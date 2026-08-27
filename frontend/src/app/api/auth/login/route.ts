import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/lib/pocketbase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich.' },
        { status: 400 },
      );
    }

    // Server-side auth — no CORS, no Brave Shields, no browser restrictions
    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);

    const authData = await pb.collection('users').authWithPassword(
      email.trim().toLowerCase(),
      password,
    );

    // Use SDK's exportToCookie for format-compatible cookie value
    const cookieHeader = pb.authStore.exportToCookie({
      httpOnly: false,   // Client-side SDK needs read access
      sameSite: 'Lax',
      secure: true,
      path: '/',
    });

    const response = NextResponse.json({
      success: true,
      record: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        role: authData.record.role,
      },
    });

    response.headers.append('Set-Cookie', cookieHeader);
    return response;
  } catch (err: unknown) {
    const pbErr = err as { status?: number; message?: string };
    const status = pbErr?.status || 400;
    const message = pbErr?.message || 'Authentifizierung fehlgeschlagen.';
    return NextResponse.json({ error: message }, { status });
  }
}
