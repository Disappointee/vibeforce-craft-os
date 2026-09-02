import { NextRequest, NextResponse } from 'next/server';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';

/**
 * 🛡️ Non-Repudiation Impersonation Route
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Enforces synchronous, immutable audit log creation before generating
 * a 1-hour impersonation session token for administrative auditing.
 */

export async function POST(request: NextRequest) {
  const user = await verifyUserSession();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { targetUserId, reason } = body;
  if (!targetUserId) {
    return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
  }

  const clientIp =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  return withAdminPB(async (adminPb) => {
    let targetUser;
    try {
      targetUser = await adminPb.collection('users').getOne(targetUserId);
    } catch {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // FAIL-SAFE: Audit-Log must succeed before impersonate is granted
    try {
      await adminPb.collection('audit_logs').create({
        action: 'impersonate',
        entity_type: 'users',
        entity_id: targetUserId,
        summary: `Admin ${user.id} (${user.email || 'admin'}) impersonated user ${targetUserId} (${targetUser.email || 'user'})`,
        user: user.id as string,
        metadata: {
          admin_id: user.id,
          admin_email: user.email,
          target_user_id: targetUserId,
          target_email: targetUser.email,
          ip: clientIp,
          user_agent: userAgent,
          reason: reason || 'Administrative Inspection',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditError) {
      console.error(
        '[AUDIT] Failed to write non-repudiation audit log, blocking impersonation:',
        auditError instanceof Error ? auditError.message : auditError
      );
      return NextResponse.json(
        { error: 'Impersonation blocked: Audit trail failure.' },
        { status: 500 }
      );
    }

    try {
      const impersonatedPb = await adminPb.collection('users').impersonate(targetUserId, 3600);
      const token = impersonatedPb.authStore.token;
      return NextResponse.json({ token, record: targetUser });
    } catch (error) {
      console.error('[IMPERSONATE] Execution failed:', error instanceof Error ? error.message : error);
      return NextResponse.json({ error: 'Impersonation failed' }, { status: 500 });
    }
  });
}

