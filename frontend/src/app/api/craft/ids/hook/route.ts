import { NextRequest, NextResponse } from 'next/server';
import { parseIdsCartXml } from '@/lib/ids-connect';
import { assertCraftFeatureEntitlement } from '@/lib/server-entitlements';

export const dynamic = 'force-dynamic';

/**
 * IDS-Connect 2.5 Webhook Receiver Endpoint
 * Standard: IGH IDS-Connect Version 2.5
 * 
 * Receives Cart XML payload posted from B2B Wholesaler Webshops (GC-ONLINE, Sonepar, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId') || undefined;

    // Hard Server-Side Entitlement Gate
    try {
      await assertCraftFeatureEntitlement('wholesale', projectId);
    } catch (err: any) {
      return NextResponse.json(
        {
          error: err?.message || 'Das Großhandelsmodul (IDS/DATANORM) ist für diesen Mandanten nicht lizenziert (403 Forbidden).',
          status: 'forbidden',
        },
        { status: 403 }
      );
    }
    const contentType = req.headers.get('content-type') || '';
    let xmlContent = '';

    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xmlContent = await req.text();
    } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      xmlContent = (formData.get('cart') || formData.get('xml') || formData.get('idsCart') || formData.get('data') || '') as string;
    } else {
      // Fallback: Attempt text reading
      const rawText = await req.text();
      if (rawText.includes('<idsCart') || rawText.includes('<?xml')) {
        xmlContent = rawText;
      } else {
        try {
          const json = JSON.parse(rawText);
          xmlContent = json.xml || json.cart || '';
        } catch {
          xmlContent = rawText;
        }
      }
    }

    if (!xmlContent || !xmlContent.includes('<idsCart') && !xmlContent.includes('<items>')) {
      return NextResponse.json(
        {
          error: 'Ungültiges oder leeres IDS-Connect 2.5 XML-Payload empfangen.',
          status: 'error',
        },
        { status: 400 }
      );
    }

    const parsedCart = parseIdsCartXml(xmlContent);

    return NextResponse.json({
      success: true,
      message: `IDS-Connect 2.5 Warenkorb erfolgreich verarbeitet (${parsedCart.items.length} Positionen).`,
      cart: parsedCart,
    });
  } catch (error: any) {
    console.error('[IDS-Connect Hook Error]:', error);
    return NextResponse.json(
      {
        error: 'Fehler beim Parsen des IDS 2.5 Warenkorbs: ' + (error?.message || 'Unbekannter Fehler'),
        status: 'error',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'VIBE Craft IDS-Connect 2.5 Webhook Service',
    specification: 'IDS-Connect 2.5 (IGH / BVBS)',
    supportedWholesalers: ['GC-ONLINE PLUS', 'Sonepar Deutschland', 'Richter+Frenzel', 'Rexel Germany', 'Würth B2B'],
    methods: ['POST (XML/Form-Data payload)', 'GET (Status)'],
  });
}
