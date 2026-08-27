import { NextRequest, NextResponse } from 'next/server';
import { getAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

export async function POST(request: NextRequest) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId } = body;
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }

  const adminPb = await getAdminPB();
  let targetUser;
  try {
    targetUser = await adminPb.collection('users').getOne(targetUserId);
  } catch {
    return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
  }

  // FAIL-SAFE: Audit-Log muss erfolgreich sein, bevor impersonate ausgeführt wird
  try {
    await adminPb.collection('audit_logs').create({
      action: 'impersonate',
      entity_type: 'users',
      entity_id: targetUserId,
      summary: `Admin ${user.id} impersonated user ${targetUserId}`,
      user: user.id,
    });
  } catch (auditError) {
    console.error('[AUDIT] Failed to write audit log, blocking impersonation:', auditError instanceof Error ? auditError.message : auditError);
    return NextResponse.json({ error: 'Impersonation failed' }, { status: 500 });
  }

  try {
    const impersonatedPb = await adminPb.collection('users').impersonate(targetUserId, 3600);
    const token = impersonatedPb.authStore.token;
    return NextResponse.json({ token, record: targetUser });
  } catch (error) {
    console.error('[IMPERSONATE] Execution failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Impersonation failed' }, { status: 500 });
  }
}
