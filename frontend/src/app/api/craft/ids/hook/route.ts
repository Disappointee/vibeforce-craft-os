import { NextRequest, NextResponse } from 'next/server';
import { parseIdsCartXml, parseIdsCartJson, verifyIdsHookToken, type IdsCart } from '@/lib/ids-connect';
import { assertCraftFeatureEntitlement } from '@/lib/server-entitlements';
import { withAdminPB } from '@/lib/pocketbase-server';

export const dynamic = 'force-dynamic';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://onlineplus.gc-gruppe.de',
  'https://www.sonepar.de',
  'https://www.richter-frenzel.de',
  'https://www.rexel.de',
  'https://eshop.wuerth.de',
];

function getAllowedOrigins(req?: NextRequest): Set<string> {
  const allowed = new Set<string>(DEFAULT_ALLOWED_ORIGINS);
  const envOrigins = process.env.IDS_ALLOWED_ORIGINS;
  if (envOrigins) {
    for (const o of envOrigins.split(',')) {
      const trimmed = o.trim();
      if (trimmed) allowed.add(trimmed);
    }
  }
  for (const appUrl of [process.env.NEXT_PUBLIC_APP_URL, process.env.APP_URL]) {
    if (appUrl) {
      try {
        allowed.add(new URL(appUrl).origin);
      } catch {}
    }
  }
  if (req) {
    try {
      allowed.add(new URL(req.url).origin);
    } catch {}
  }
  return allowed;
}

function getCorsHeaders(req?: NextRequest): Record<string, string> {
  const origin = req?.headers.get('origin');
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
    'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin && getAllowedOrigins(req).has(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function corsJson(body: unknown, status: number = 200, req?: NextRequest): NextResponse {
  return NextResponse.json(body, { status, headers: getCorsHeaders(req) });
}

/**
 * IDS-Connect 2.5 Webhook Receiver Endpoint
 * Standard: IGH IDS-Connect Version 2.5
 *
 * Receives Cart XML payload posted from B2B Wholesaler Webshops (GC-ONLINE, Sonepar, etc.)
 * - AJAX-Posts (application/xml, application/json) -> JSON-Antwort
 * - HTML-Formular-POSTs (x-www-form-urlencoded / multipart) -> HTTP 303 Redirect ins Dashboard
 */
export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;

    // Hard Server-Side Entitlement Gate
    try {
      await assertCraftFeatureEntitlement('wholesale', projectId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Das Großhandelsmodul (IDS/DATANORM) ist für diesen Mandanten nicht lizenziert (403 Forbidden).';
      return corsJson(
        {
          error: message,
          status: 'forbidden',
        },
        403,
        req
      );
    }

    // CSRF/Session-Validierung per hookToken (HMAC-SHA256, max. 4h gültig).
    const hookSecret =
      process.env.IDS_HOOK_SECRET ||
      process.env.NEXTAUTH_SECRET ||
      process.env.SESSION_SECRET;
    if (!hookSecret) {
      console.error('[IDS-Connect Hook]: Missing IDS_HOOK_SECRET / NEXTAUTH_SECRET / SESSION_SECRET.');
      return corsJson(
        {
          error: 'IDS-Connect Webhook ist serverseitig nicht konfiguriert (Secret fehlt).',
          status: 'misconfigured',
        },
        500,
        req
      );
    }

    const token = searchParams.get('token') || '';
    if (!token) {
      return corsJson(
        {
          error: 'Fehlendes hookToken. Authentifizierung erforderlich.',
          status: 'unauthorized',
        },
        401,
        req
      );
    }

    const tokenCheck = verifyIdsHookToken(token, hookSecret);
    if (!tokenCheck.valid) {
      return corsJson(
        {
          error: tokenCheck.error || 'Ungültiges oder abgelaufenes hookToken.',
          status: 'unauthorized',
        },
        401,
        req
      );
    }
    if (projectId && tokenCheck.projectId && tokenCheck.projectId !== projectId) {
      return corsJson(
        {
          error: 'hookToken gehört nicht zum angefragten Projekt (projectId-Mismatch).',
          status: 'unauthorized',
        },
        401,
        req
      );
    }

    const contentType = req.headers.get('content-type') || '';
    const isFormPost =
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data');
    const isJsonPost = contentType.includes('application/json');

    let xmlContent = '';
    let jsonCartPayload: unknown = null;

    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xmlContent = await req.text();
    } else if (isFormPost) {
      const formData = await req.formData();
      const formValue = formData.get('cart') || formData.get('xml') || formData.get('idsCart') || formData.get('data');
      xmlContent = typeof formValue === 'string' ? formValue : '';
    } else if (isJsonPost) {
      // AJAX-JSON: Entweder { xml | cart: "<idsCart XML>" } Wrapper oder reiner JSON-Cart
      const rawText = await req.text();
      try {
        const json: unknown = JSON.parse(rawText);
        const isRecord = (v: unknown): v is Record<string, unknown> =>
          typeof v === 'object' && v !== null && !Array.isArray(v);
        if (isRecord(json) && (typeof json['xml'] === 'string' || typeof json['cart'] === 'string')) {
          xmlContent = typeof json['xml'] === 'string' ? json['xml'] : (json['cart'] as string);
        } else {
          jsonCartPayload = json;
        }
      } catch {
        xmlContent = rawText;
      }
    } else {
      // Fallback: Attempt text reading
      const rawText = await req.text();
      if (rawText.includes('<idsCart') || rawText.includes('<?xml')) {
        xmlContent = rawText;
      } else {
        try {
          const json = JSON.parse(rawText) as { xml?: string; cart?: string };
          xmlContent = json.xml || json.cart || '';
        } catch {
          xmlContent = rawText;
        }
      }
    }

    let parsedCart;
    if (jsonCartPayload !== null) {
      try {
        parsedCart = parseIdsCartJson(jsonCartPayload);
      } catch (parseError: unknown) {
        const parseMessage = parseError instanceof Error ? parseError.message : 'Strukturvalidierung fehlgeschlagen.';
        return corsJson(
          {
            error: `Ungültiger IDS-Connect 2.5 JSON-Cart: ${parseMessage}`,
            status: 'error',
          },
          400,
          req
        );
      }
    } else {
      if (!xmlContent || (!xmlContent.includes('<idsCart') && !xmlContent.includes('<items>'))) {
        return corsJson(
          {
            error: 'Ungültiges oder leeres IDS-Connect 2.5 XML-Payload empfangen.',
            status: 'error',
          },
          400,
          req
        );
      }
      parsedCart = parseIdsCartXml(xmlContent);
    }

    // Spec „parsen/sichern": Der Warenkorb wird serverseitig persistiert (ids_carts),
    // damit der 303-Form-Flow die Daten nicht verwirft. Ohne erfolgreiche Persistenz
    // wird NIEMALS ids_imported=1 gemeldet (fail-closed gegen stillen Datenverlust).
    const cartId = globalThis.crypto.randomUUID();
    let persisted = false;
    try {
      await withAdminPB(async (pb) => {
        await pb.collection('ids_carts').create({
          cart_id: cartId,
          project: projectId || '',
          payload_json: JSON.stringify(parsedCart),
          wholesaler: parsedCart.header.wholesalerName,
          item_count: parsedCart.items.length,
          source: isFormPost ? 'form_post' : 'ajax',
        });
      });
      persisted = true;
    } catch (persistError: unknown) {
      console.error('[IDS-Connect Hook Persist Error]:', persistError);
    }

    // Dualer Universal Receiver: HTML-Formular-POSTs landen per 303 im Dashboard
    // statt auf einer rohen JSON-Seite.
    if (isFormPost) {
      const redirectUrl = new URL(
        persisted
          ? `/craft?tab=wholesale&ids_imported=1&cart_id=${cartId}`
          : '/craft?tab=wholesale&ids_imported=0&ids_error=persist_failed',
        req.url
      );
      return new NextResponse(null, {
        status: 303,
        headers: {
          Location: redirectUrl.toString(),
          ...getCorsHeaders(req),
        },
      });
    }

    if (!persisted) {
      return corsJson(
        {
          error: 'IDS-Connect 2.5 Warenkorb konnte nicht persistiert werden (ids_carts). Bitte erneut senden.',
          status: 'error',
        },
        500,
        req
      );
    }

    return corsJson(
      {
        success: true,
        cart_id: cartId,
        message: `IDS-Connect 2.5 Warenkorb erfolgreich verarbeitet und gespeichert (${parsedCart.items.length} Positionen).`,
        cart: parsedCart as IdsCart,
      },
      200,
      req
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    console.error('[IDS-Connect Hook Error]:', error);
    return corsJson(
      {
        error: 'Fehler beim Parsen des IDS 2.5 Warenkorbs: ' + message,
        status: 'error',
      },
      500,
      req
    );
  }
}

export async function GET(req: NextRequest) {
  return corsJson(
    {
      status: 'online',
      service: 'VIBE Craft IDS-Connect 2.5 Webhook Service',
      specification: 'IDS-Connect 2.5 (IGH / BVBS)',
      supportedWholesalers: ['GC-ONLINE PLUS', 'Sonepar Deutschland', 'Richter+Frenzel', 'Rexel Germany', 'Würth B2B'],
      methods: ['POST (XML/Form-Data payload)', 'OPTIONS (CORS preflight)', 'GET (Status)'],
    },
    200,
    req
  );
}
