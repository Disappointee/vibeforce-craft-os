import { NextRequest, NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { POCKETBASE_URL } from '@/lib/pocketbase-server';
import { getAuthCookieName, getAppConfig } from '@/config/app-mode';

function getDemoGuests(): Record<string, { email: string; pass: string }> {
  const emailA = process.env.DEMO_GUEST_A_EMAIL;
  const passA = process.env.DEMO_GUEST_A_PASSWORD;
  const emailB = process.env.DEMO_GUEST_B_EMAIL;
  const passB = process.env.DEMO_GUEST_B_PASSWORD;

  if (!emailA || !passA || !emailB || !passB) {
    throw new Error('DEMO_GUEST_A/B_EMAIL/PASSWORD must be set in environment');
  }

  return {
    slot_a: { email: emailA, pass: passA },
    slot_b: { email: emailB, pass: passB },
  };
}

function isSafeRedirect(url: string): boolean {
  try {
    const parsed = new URL(url, 'http://localhost');
    // Only allow relative paths (no protocol, no host)
    return parsed.origin === 'http://localhost' && parsed.pathname.startsWith('/');
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const host = request.headers.get('x-vibeforce-host') || request.headers.get('host');
    const appConfig = getAppConfig(host);
    const slotParam = request.nextUrl.searchParams.get('slot');
    const slot = slotParam === 'slot_b' ? 'slot_b' : 'slot_a';
    const redirectParam = request.nextUrl.searchParams.get('redirect');
    
    // Whitelist redirect to relative paths only (XSS/Open-Redirect protection)
    const targetRoute = isSafeRedirect(redirectParam || '') 
      ? redirectParam 
      : appConfig.startRoute;

    const demoGuests = getDemoGuests();
    const guest = demoGuests[slot];

    if (!guest?.pass) {
      return NextResponse.redirect(new URL('/login?error=demo_unavailable', request.url));
    }

    const pb = new PocketBase(POCKETBASE_URL);
    pb.autoCancellation(false);

    const authData = await pb.collection('users').authWithPassword(guest.email, guest.pass);

    const cookieKey = getAuthCookieName(host);
    const cookieHeader = pb.authStore.exportToCookie({
      httpOnly: false,
      sameSite: 'Lax',
      secure: true,
      path: '/',
    }, cookieKey);

    const fallbackHeader = pb.authStore.exportToCookie({
      httpOnly: false,
      sameSite: 'Lax',
      secure: true,
      path: '/',
    }, 'pb_auth');

    const authPayload = JSON.stringify({
      token: authData.token,
      record: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        role: authData.record.role,
      },
      model: {
        id: authData.record.id,
        email: authData.record.email,
        name: authData.record.name,
        role: authData.record.role,
      },
    });

    const isCraft = appConfig.mode === 'craft';
    const appTitle = isCraft ? 'Vibeforce Craft OS' : 'Vibeforce Flow OS';
    const appSubtitle = isCraft
      ? 'Handwerks- & Baustellen-Zugang wird initialisiert...'
      : 'Demo-Zugang wird initialisiert...';
    const accentColor = isCraft ? '#f59e0b' : '#0d9488';

    // HTML response that sets cookies via both HTTP headers AND client-side document.cookie / localStorage
    // before performing an instant window.location.replace() to the target route.
    const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${appTitle} — Demo Login</title>
  <style>
    body {
      background: #090d16;
      color: #e2e8f0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      overflow: hidden;
    }
    .card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 32px 40px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      max-width: 400px;
      width: 90%;
    }
    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255, 255, 255, 0.1);
      border-top-color: ${accentColor};
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h1 {
      font-size: 20px;
      font-weight: 700;
      margin: 0 0 8px;
      letter-spacing: -0.02em;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin: 0;
    }
  </style>
  <script>
    (function() {
      try {
        const payload = ${JSON.stringify(authPayload)};
        const encoded = encodeURIComponent(payload);
        const cookieMaxAge = 60 * 60 * 24 * 7; // 7 days
        document.cookie = "${cookieKey}=" + encoded + "; path=/; max-age=" + cookieMaxAge + "; SameSite=Lax; Secure";
        document.cookie = "pb_auth=" + encoded + "; path=/; max-age=" + cookieMaxAge + "; SameSite=Lax; Secure";
        try {
          localStorage.setItem("pocketbase_auth", payload);
        } catch(e) {}
      } catch (err) {
        console.error("Cookie initialization error", err);
      }
      window.location.replace(${JSON.stringify(targetRoute)});
    })();
  </script>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h1>${appTitle}</h1>
    <p>${appSubtitle}</p>
  </div>
</body>
</html>`;

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });

    response.headers.append('Set-Cookie', cookieHeader);
    if (cookieKey !== 'pb_auth') {
      response.headers.append('Set-Cookie', fallbackHeader);
    }

    return response;
  } catch (err: unknown) {
    console.error('Demo auth failed:', err);
    return NextResponse.redirect(new URL('/login?error=demo_unavailable', request.url));
  }
}