import PocketBase from 'pocketbase';

const POCKETBASE_URL = 'https://pb-vibeforce.46-225-178-235.sslip.io';
const pb = new PocketBase(POCKETBASE_URL);

async function seedLiveCraftShowcase() {
  console.log('======================================================================');
  console.log('🔨 SEEDER: Vibeforce Craft OS Live Showcase Demodatensatz');
  console.log('======================================================================\n');

  // 1. Authenticate as Superuser
  console.log('1. Authentifiziere Superuser an PocketBase...');
  await pb.collection('_superusers').authWithPassword('admin@vibeforce-flow.de', '***REMOVED***');
  console.log('   ✅ Superuser erfolgreich authentifiziert.');

  // Find Robin Meister User
  const users = await pb.collection('users').getList(1, 10, {
    filter: 'email = "***REMOVED***" || role = "admin"',
  });
  const meisterUser = users.items[0];
  const meisterId = meisterUser ? meisterUser.id : 't1ygq6mbphm6mkt';
  console.log(`   Meister / Bauleiter Account: ${meisterUser?.name || 'Robin Lehnebach'} (${meisterId})`);

  // 2. Client 1: Familie Markus Huber (Privater Bauherr)
  console.log('\n2. Prüfe/Erstelle Bauherr Familie Markus Huber...');
  let huberClient;
  const existingHuber = await pb.collection('clients').getList(1, 1, { filter: 'name ~ "Huber"' });
  if (existingHuber.items.length > 0) {
    huberClient = existingHuber.items[0];
    console.log(`   ℹ️ Vorhandener Bauherr gefunden: ${huberClient.name} (${huberClient.id})`);
  } else {
    huberClient = await pb.collection('clients').create({
      name: 'Familie Markus Huber',
      company: 'Bauvorhaben Huber Riemerling',
      email: 'markus.huber@t-online.de',
      phone: '+49 89 12345678',
      address: 'Sonnenweg 14, 85521 Riemerling',
      notes: 'Neubau KfW-40 Plus Einfamilienhaus in Holzständerbauweise. Privater Bauherr (Regelbesteuerung 19%, kein § 13b Reverse Charge).',
      status: 'aktiv',
      auftragsvolumen: 148500,
    });
    console.log(`   ✅ Bauherr Huber neu angelegt (${huberClient.id})`);
  }

  // 3. Client 2: Schmidt Logistik & Gewerbebau GmbH (Bauträger § 13b & § 48b)
  console.log('\n3. Prüfe/Erstelle Bauträger Schmidt Logistik GmbH...');
  let schmidtClient;
  const existingSchmidt = await pb.collection('clients').getList(1, 1, { filter: 'name ~ "Schmidt"' });
  if (existingSchmidt.items.length > 0) {
    schmidtClient = existingSchmidt.items[0];
    console.log(`   ℹ️ Vorhandener Bauträger gefunden: ${schmidtClient.name} (${schmidtClient.id})`);
  } else {
    schmidtClient = await pb.collection('clients').create({
      name: 'Gewerbebau Schmidt GmbH & Co. KG',
      company: 'Schmidt Logistik & Gewerbebau Gruppe',
      email: 'bauleitung@schmidt-gewerbebau.de',
      phone: '+49 89 98765432',
      address: 'Industriestraße 88, 80935 München',
      notes: 'Gültige Freistellungsbescheinigung nach § 48b EStG bis 31.12.2027. Netto-Rechnungen mit Vermerk gem. § 13b UStG (Steuerschuldnerschaft des Leistungsempfängers).',
      status: 'active',
      auftragsvolumen: 340000,
    });
    console.log(`   ✅ Bauträger Schmidt neu angelegt (${schmidtClient.id})`);
  }

  // 4. Baustelle 1: Neubau EFH Familie Huber (Dachstuhl & Holzbau)
  console.log('\n4. Prüfe/Aktualisiere Baustelle 1 (BAU-01 / Huber)...');
  let p1;
  const existingP1 = await pb.collection('projects').getList(1, 1, { filter: 'key = "BAU-01" || id = "58t8jfsty4e6o99"' });
  const p1Data = {
    name: 'Neubau EFH Familie Huber (Dachstuhl & Holzbau)',
    key: 'BAU-01',
    description: 'Neubau KfW-40 Plus Einfamilienhaus in Holzständerbauweise. Abbund und Aufschlagen des Satteldachs mit Aufsparrendämmung nach VOB/B.',
    status: 'active',
    client: huberClient.id,
    budget_hours: 320,
    budget_money: 148500,
    start_date: '2026-03-01',
    due_date: '2026-07-31',
    geofence_type: 'circle',
    geofence_data: {
      center: [48.0652, 11.6784],
      radius: 150,
      name: 'Baustelle Huber Riemerling',
    },
  };

  if (existingP1.items.length > 0) {
    p1 = await pb.collection('projects').update(existingP1.items[0].id, p1Data);
    console.log(`   ✅ Baustelle 1 aktualisiert (${p1.id}): "${p1.name}"`);
  } else {
    p1 = await pb.collection('projects').create(p1Data);
    console.log(`   ✅ Baustelle 1 neu angelegt (${p1.id}): "${p1.name}"`);
  }

  // 5. Baustelle 2: Sanierung Gewerbehalle Schmidt (Brandschutz & Trockenbau)
  console.log('\n5. Prüfe/Aktualisiere Baustelle 2 (BAU-02 / Schmidt)...');
  let p2;
  const existingP2 = await pb.collection('projects').getList(1, 1, { filter: 'key = "BAU-02" || id = "detyh3oxx7y80za"' });
  const p2Data = {
    name: 'Sanierung Gewerbehalle Schmidt (Brandschutz & Trockenbau)',
    key: 'BAU-02',
    description: 'Brandschutztechnische Ertüchtigung Decken und Träger F90 nach DIN 4102. Trockenbauwände F90 in Hallenabschnitt 1-3 gem. VOB/C.',
    status: 'active',
    client: schmidtClient.id,
    budget_hours: 450,
    budget_money: 230000,
    start_date: '2026-02-15',
    due_date: '2026-09-30',
    geofence_type: 'circle',
    geofence_data: {
      center: [48.1950, 11.5540],
      radius: 200,
      name: 'Gewerbehalle Schmidt München Nord',
    },
  };

  if (existingP2.items.length > 0) {
    p2 = await pb.collection('projects').update(existingP2.items[0].id, p2Data);
    console.log(`   ✅ Baustelle 2 aktualisiert (${p2.id}): "${p2.name}"`);
  } else {
    p2 = await pb.collection('projects').create(p2Data);
    console.log(`   ✅ Baustelle 2 neu angelegt (${p2.id}): "${p2.name}"`);
  }

  // 6. Bautagesberichte & VOB/B § 6 Behinderungsanzeige
  console.log('\n6. Erstelle Bautagesberichte mit VOB/B § 6 & Digitaler Signatur...');
  const today = new Date().toISOString().split('T')[0];

  // Report 1 für Baustelle Huber (Signiert)
  const rep1Filter = `project = "${p1.id}" && report_date = "${today}"`;
  const existingRep1 = await pb.collection('site_reports').getList(1, 1, { filter: rep1Filter });
  let report1;

  const dummySignatureStrokes = [
    [{ x: 10, y: 20 }, { x: 50, y: 30 }, { x: 120, y: 25 }],
    [{ x: 30, y: 10 }, { x: 80, y: 40 }]
  ];
  const dummySvgDataUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><path d="M 10 30 Q 50 10 90 35 T 180 25" stroke="%231e293b" stroke-width="2" fill="none"/></svg>';

  const rep1Payload = {
    project: p1.id,
    author: meisterId,
    report_date: today,
    status: 'signed',
    weather: 'Heiter & sonnig',
    temperature: 21,
    work_performed: 'Aufrichten Dachstuhl Achse 1 bis 6 abgeschlossen. Richten der Mittel- und Firstpfetten (BSH 20/36). Einbau der Schalungsbahn und Aufsparrendämmung vorbereitet. Kerven nachgearbeitet und verschraubt gem. Statikplan Holzbau.',
    special_events: 'Baustellenbegehung durch Statiker Herrn Dr. Krause um 14:00 Uhr. Konstruktion abgenommen, Freigabe zur Eindeckung erteilt.',
    qualification_hours: {
      'Meister / Bauleiter': 8,
      'Vorarbeiter Holzbau': 8,
      'Zimmerergeselle 1': 8,
      'Zimmerergeselle 2': 8,
      'Auszubildender': 6
    },
    is_regie_extra: false,
    client_name: 'Herr Markus Huber',
    client_signature: dummySvgDataUri,
    client_signed_at: new Date().toISOString(),
    contractor_signature: dummySvgDataUri,
    contractor_signed_at: new Date().toISOString(),
    signature_manifest: {
      signer_role: 'Bauherr & Zimmerermeister',
      device_mode: 'Glove / Touch Studio',
      timestamp: new Date().toISOString(),
      gps_validated: true,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    gps_lat: 48.0652,
    gps_lon: 11.6784,
    gps_accuracy: 4.2
  };

  if (existingRep1.items.length > 0) {
    report1 = await pb.collection('site_reports').update(existingRep1.items[0].id, rep1Payload);
    console.log(`   ✅ Bautagesbericht 1 aktualisiert (ID: ${report1.id})`);
  } else {
    report1 = await pb.collection('site_reports').create(rep1Payload);
    console.log(`   ✅ Bautagesbericht 1 neu angelegt (ID: ${report1.id})`);
  }

  // Report 2 für Baustelle Schmidt mit VOB/B § 6 Behinderungsanzeige
  const rep2Filter = `project = "${p2.id}" && report_date = "${today}"`;
  const existingRep2 = await pb.collection('site_reports').getList(1, 1, { filter: rep2Filter });
  let report2;

  const rep2Payload = {
    project: p2.id,
    author: meisterId,
    report_date: today,
    status: 'draft',
    weather: 'Bedeckt, zeitweise Nieselregen',
    temperature: 15,
    work_performed: 'Montage F90-Brandschutzunterdecke in Hallenabschnitt 2 (Achsen 4-6). Anbringen der Abhänger und Grundprofile.',
    special_events: '⚠️ VOB/B § 6 BEHINDERUNGSANZEIGE: Der Vorunternehmer TGA hat die Kabeltrassen in Hallenabschnitt 2 (Achse 7-9) nicht wie vereinbart bis zum 06.09.2026 freigegeben. Unsere Monteure können die Deckenbekleidung nicht fortführen. Behinderungsanzeige wurde der Oberbauleitung Schmidt per Einschreiben/E-Mail formell zugestellt.',
    qualification_hours: {
      'Bauleiter': 4,
      'Trockenbaumonteur 1': 8,
      'Trockenbaumonteur 2': 8,
      'Monteur Brandschutz': 8
    },
    is_regie_extra: true,
    client_name: 'Schmidt Oberbauleitung',
    gps_lat: 48.1950,
    gps_lon: 11.5540,
    gps_accuracy: 5.0
  };

  if (existingRep2.items.length > 0) {
    report2 = await pb.collection('site_reports').update(existingRep2.items[0].id, rep2Payload);
    console.log(`   ✅ Bautagesbericht 2 (mit VOB/B § 6) aktualisiert (ID: ${report2.id})`);
  } else {
    report2 = await pb.collection('site_reports').create(rep2Payload);
    console.log(`   ✅ Bautagesbericht 2 (mit VOB/B § 6) neu angelegt (ID: ${report2.id})`);
  }

  // 7. DIN 18299 Aufmaßzeilen (measurements)
  console.log('\n7. Erstelle DIN 18299 Aufmaßzeilen für Bautagesbericht 1 & 2...');
  const sampleMeasurements = [
    {
      site_report: report1.id,
      position_nr: '01.01',
      title: 'Bodenbelagsabbruch & Estrichfräsen',
      formula: '12.40 * 6.50',
      quantity: 80.6,
      unit: 'm2',
      unit_price: 18.5,
      total_price: 1491.1,
      tax_rate_type: 'standard_19',
      notes: 'EG Flur und Technikraum gem. DIN 18299',
    },
    {
      site_report: report1.id,
      position_nr: '01.02',
      title: 'Zementestrich DIN 18560 CT-C25-F4 d=65mm',
      formula: '12.40 * 6.50 - 1.20 * 0.80',
      quantity: 79.64,
      unit: 'm2',
      unit_price: 34.0,
      total_price: 2707.76,
      tax_rate_type: 'standard_19',
      notes: 'Übermessungsabzug Schacht < 2.5m² gem. DIN 18299',
    },
    {
      site_report: report1.id,
      position_nr: '02.01',
      title: 'Richten Dachstuhl Nadelholz C24 nach Statik',
      formula: '14.50 * 6.80 * 0.18',
      quantity: 17.75,
      unit: 'm3',
      unit_price: 980.0,
      total_price: 17395.0,
      tax_rate_type: 'standard_19',
      notes: 'Satteldach 38 Grad Dachneigung',
    },
    {
      site_report: report2.id,
      position_nr: '03.01',
      title: 'F90-A Brandschutzbekleidung Stahlträger HEA 300',
      formula: '24.00 * 1.35',
      quantity: 32.4,
      unit: 'm2',
      unit_price: 72.0,
      total_price: 2332.8,
      tax_rate_type: 'reverse_charge_13b',
      notes: 'Hallenabschnitt 2, Promat Brandschutzplatten 20mm gem. Zulassung',
    },
    {
      site_report: report2.id,
      position_nr: '03.02',
      title: 'Trockenbauwand F90 125mm beidseitig 2-lagig beplankt',
      formula: '18.50 * 4.20',
      quantity: 77.7,
      unit: 'm2',
      unit_price: 68.5,
      total_price: 5322.45,
      tax_rate_type: 'reverse_charge_13b',
      notes: 'Brandabschnittstrennwand Halle / Verwaltung gem. VOB/C DIN 18340',
    }
  ];

  for (const m of sampleMeasurements) {
    const existing = await pb.collection('measurements').getList(1, 1, {
      filter: `site_report = "${m.site_report}" && position_nr = "${m.position_nr}"`
    });
    if (existing.items.length === 0) {
      await pb.collection('measurements').create(m);
      console.log(`   ✅ Aufmaß ${m.position_nr} (${m.title.substring(0, 35)}...) angelegt.`);
    }
  }

  // 8. Großhandels-Warenkorb (ids_carts - IDS 2.5 Punchout GC-Gruppe)
  console.log('\n8. Erstelle IDS 2.5 Großhandels-Warenkorb für Baustelle Schmidt...');
  const cartFilter = `project = "${p2.id}" && wholesaler ~ "Gienger"`;
  const existingCart = await pb.collection('ids_carts').getList(1, 1, { filter: cartFilter });
  const idsPayload = {
    cart_id: 'GC-IDS-2026-98124',
    project: p2.id,
    wholesaler: 'GC-Gruppe / Gienger München KG',
    item_count: 14,
    source: 'form_post',
    payload_json: {
      order_date: today,
      commission: 'BAU-02 Schmidt Gewerbehalle',
      supplier_number: '748201',
      total_net: 4890.50,
      items: [
        { art_nr: 'KN-12401', desc: 'Knauf Feuerschutzplatte GKF 12,5 mm 2000x1250', qty: 120, unit: 'm2', price: 8.40 },
        { art_nr: 'KN-98122', desc: 'Knauf CW-75/50 Ständerprofil 4000mm', qty: 45, unit: 'Stk', price: 11.20 },
        { art_nr: 'KN-98123', desc: 'Knauf UW-75 Randprofil 4000mm', qty: 20, unit: 'Stk', price: 9.80 },
        { art_nr: 'PR-88102', desc: 'Promat Brandschutzkitt F90 Kartusche 310ml', qty: 24, unit: 'Stk', price: 16.50 },
        { art_nr: 'SC-55210', desc: 'Schnellbauschrauben mit Bohrspitze 3,5x35 (1000 Stk)', qty: 6, unit: 'Pak', price: 18.90 }
      ]
    }
  };

  if (existingCart.items.length === 0) {
    const createdCart = await pb.collection('ids_carts').create(idsPayload);
    console.log(`   ✅ IDS 2.5 Punchout-Warenkorb angelegt (${createdCart.cart_id}, ${createdCart.item_count} Artikel).`);
  } else {
    console.log(`   ℹ️ IDS Warenkorb existiert bereits (${existingCart.items[0].cart_id}).`);
  }

  // 9. ZUGFeRD 2.2 / XRechnung Abschlagsrechnung (invoices_zugferd)
  console.log('\n9. Erstelle ZUGFeRD 2.2 Abschlagsrechnung für Baustelle Schmidt...');
  const invFilter = `project = "${p2.id}" && invoice_number = "RE-2026-0301"`;
  const existingInv = await pb.collection('invoices_zugferd').getList(1, 1, { filter: invFilter });
  const invPayload = {
    project: p2.id,
    site_report: report2.id,
    invoice_number: 'RE-2026-0301',
    invoice_type: 'abschlag',
    net_total: 28450.00,
    tax_rate: 0,
    tax_total: 0,
    gross_total: 28450.00,
    prepaid_amount: 0,
    zugferd_xml: `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter>
      <ram:ID>urn:cen.eu:en16931:2017#compliant#urn:zugferd.de:2p0:extended</ram:ID>
    </ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>RE-2026-0301</ram:ID>
    <ram:TypeCode>380</ram:TypeCode>
    <ram:IssueDateTime><ram:DateTimeString format="102">20260307</ram:DateTimeString></ram:IssueDateTime>
    <ram:IncludedNote><ram:Content>1. Abschlagsrechnung gem. § 632a BGB i.V.m. VOB/B § 16. Steuerschuldnerschaft des Leistungsempfängers gem. § 13b UStG (Bauleistungen).</ram:Content></ram:IncludedNote>
  </rsm:ExchangedDocument>
</rsm:CrossIndustryInvoice>`,
    datev_exported: false
  };

  if (existingInv.items.length === 0) {
    const createdInv = await pb.collection('invoices_zugferd').create(invPayload);
    console.log(`   ✅ ZUGFeRD Abschlagsrechnung ${createdInv.invoice_number} über ${createdInv.gross_total} € angelegt.`);
  } else {
    console.log(`   ℹ️ ZUGFeRD Rechnung existiert bereits (${existingInv.items[0].invoice_number}).`);
  }

  // 10. Tasks & VOB/B § 13 Mängel
  console.log('\n10. Erstelle Baustellen-Aufgaben & VOB/B § 13 Mängel...');
  const craftTasks = [
    {
      project: p1.id,
      title: 'Gerüstfreigabe Gerüstbau Müller kontrollieren & dokumentieren',
      description: 'Prüfen des Gerüst-Prüfprotokolls nach TRBS 2121. Gerüstabnahme vor Beginn der Dachstuhlarbeiten.',
      status: 'done',
      priority: 'high',
      type: 'other',
      estimated_hours: 2,
    },
    {
      project: p1.id,
      title: 'Aufsparrendämmung diffusionsoffen verlegen & verkleben',
      description: 'Verlegen der Holzfaser-Dämmplatten d=160mm. Anschlüsse an Traufe und First winddicht verkleben.',
      status: 'in_progress',
      priority: 'medium',
      type: 'development',
      estimated_hours: 16,
    },
    {
      project: p2.id,
      title: 'VOB/B § 13 Mängelrüge: Brandabschottung Kabeltrasse Hallenabschnitt 2',
      description: 'Kabeldurchführung Brandwand F90 nicht fachgerecht geschottet durch Nachunternehmer TGA. Nachbesserung bis 15.03.2026 gefordert gem. VOB/B § 13 Abs. 5.',
      status: 'todo',
      priority: 'acute',
      type: 'other',
      estimated_hours: 4,
    },
    {
      project: p2.id,
      title: 'VOB-Schlussaufmaß Deckenbekleidung mit Bauleiter Schmidt terminieren',
      description: 'Gemeinsames Aufmaß vor Ort zur Erstellung der Schlussrechnung.',
      status: 'todo',
      priority: 'high',
      type: 'consulting',
      estimated_hours: 3,
    }
  ];

  for (const t of craftTasks) {
    const existing = await pb.collection('tasks').getList(1, 1, {
      filter: `project = "${t.project}" && title = "${t.title}"`
    });
    if (existing.items.length === 0) {
      await pb.collection('tasks').create(t);
      console.log(`   ✅ Task "${t.title.substring(0, 45)}..." angelegt.`);
    }
  }

  console.log('\n======================================================================');
  console.log('🎉 SEEDING ERFOLGREICH BEENDET: VOLLSTÄNDIGER LIVE DEMODATENSATZ BEREIT!');
  console.log('======================================================================\n');
}

seedLiveCraftShowcase().catch(err => {
  console.error('Seeding error:', err);
  process.exit(1);
});
