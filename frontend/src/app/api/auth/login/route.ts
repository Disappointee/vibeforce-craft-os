import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/lib/pocketbase-server';
import { getAuthCookieName } from '@/config/app-mode';

export async function POST(request: NextRequest) {
  try {
    const host = request.headers.get('x-vibeforce-host') || request.headers.get('host');
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

    // Use SDK's exportToCookie with stack-isolated cookie key (pb_auth_flow vs pb_auth_craft)
    const cookieKey = getAuthCookieName(host);
    const cookieHeader = pb.authStore.exportToCookie({
      httpOnly: false,   // Client-side SDK needs read access
      sameSite: 'Lax',
      secure: true,
      path: '/',
    }, cookieKey);

    const response = NextResponse.json({
      success: true,
      cookieKey,
      token: authData.token,
      record: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        role: authData.record.role,
      },
    });

    response.headers.append('Set-Cookie', cookieHeader);

    // Set fallback standard cookie to ensure universal backward compatibility
    if (cookieKey !== 'pb_auth') {
      const fallbackHeader = pb.authStore.exportToCookie({
        httpOnly: false,
        sameSite: 'Lax',
        secure: true,
        path: '/',
      }, 'pb_auth');
      response.headers.append('Set-Cookie', fallbackHeader);
    }
    return response;
  } catch (err: unknown) {
    const pbErr = err as { status?: number; message?: string };
    const status = pbErr?.status || 400;
    const message = pbErr?.message || 'Authentifizierung fehlgeschlagen.';
    return NextResponse.json({ error: message }, { status });
  }
}
