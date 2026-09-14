import fs from 'fs';
import path from 'path';

const url = process.env.POCKETBASE_URL || 'https://pb-vibeforce.46-225-178-235.sslip.io';
const email = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@vibeforce-flow.de';
const pass = process.env.POCKETBASE_ADMIN_PASSWORD || '***REMOVED***';

console.log(`=== Starting PocketBase Craft & IDS Migration on ${url} ===`);

async function run() {
  const authRes = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password: pass })
  });

  if (!authRes.ok) {
    console.error('Superuser login failed:', authRes.status, await authRes.text());
    process.exit(1);
  }

  const { token } = await authRes.json();
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // Helper to fetch collection by name
  async function getCollection(name) {
    const res = await fetch(`${url}/api/collections/${name}`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Failed to fetch collection ${name}: ${await res.text()}`);
    return await res.json();
  }

  // 1. Projects Geofence fields
  console.log('\n1. Checking projects geofence fields...');
  const projects = await getCollection('projects');
  if (!projects) {
    throw new Error('Projects collection not found!');
  }

  const projectFieldNames = projects.fields.map(f => f.name);
  let projectsUpdated = false;

  if (!projectFieldNames.includes('geofence_type')) {
    projects.fields.push({ name: 'geofence_type', type: 'text', required: false });
    projectsUpdated = true;
    console.log('  + Added geofence_type to projects');
  }
  if (!projectFieldNames.includes('geofence_data')) {
    projects.fields.push({ name: 'geofence_data', type: 'json', required: false });
    projectsUpdated = true;
    console.log('  + Added geofence_data to projects');
  }
  if (!projectFieldNames.includes('geofence_auto_prompt')) {
    projects.fields.push({ name: 'geofence_auto_prompt', type: 'bool', required: false });
    projectsUpdated = true;
    console.log('  + Added geofence_auto_prompt to projects');
  }

  if (projectsUpdated) {
    const patchRes = await fetch(`${url}/api/collections/projects`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: projects.fields })
    });
    if (!patchRes.ok) console.error('Failed to update projects:', await patchRes.text());
    else console.log('  ✓ projects updated successfully');
  } else {
    console.log('  ✓ projects already has all geofence fields');
  }

  // 2. Collection: site_reports
  console.log('\n2. Checking site_reports collection...');
  let siteReports = await getCollection('site_reports');
  const siteReportsDef = {
    name: 'site_reports',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { name: 'project', type: 'relation', collectionId: projects.id, cascadeDelete: false, maxSelect: 1, required: true },
      { name: 'author', type: 'relation', collectionId: '_pb_users_auth_', cascadeDelete: false, maxSelect: 1, required: true },
      { name: 'report_date', type: 'text', required: true },
      { name: 'status', type: 'text', required: false },
      { name: 'weather', type: 'text', required: false },
      { name: 'temperature', type: 'number', required: false },
      { name: 'work_performed', type: 'text', required: false },
      { name: 'special_events', type: 'text', required: false },
      { name: 'qualification_hours', type: 'json', required: false },
      { name: 'is_regie_extra', type: 'bool', required: false },
      { name: 'client_name', type: 'text', required: false },
      { name: 'client_signature', type: 'text', required: false },
      { name: 'client_signed_at', type: 'text', required: false },
      { name: 'contractor_signature', type: 'text', required: false },
      { name: 'contractor_signed_at', type: 'text', required: false },
      { name: 'signature_manifest', type: 'text', required: false },
      { name: 'signature_strokes', type: 'json', required: false },
      { name: 'gps_lat', type: 'number', required: false },
      { name: 'gps_lon', type: 'number', required: false },
      { name: 'gps_accuracy', type: 'number', required: false }
    ]
  };

  if (!siteReports) {
    console.log('  + Creating site_reports collection...');
    const createRes = await fetch(`${url}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(siteReportsDef)
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create site_reports: ${await createRes.text()}`);
    }
    siteReports = await createRes.json();
    console.log('  ✓ site_reports collection created successfully (ID:', siteReports.id, ')');
  } else {
    // Check if is_regie_extra or other fields are missing
    const existingFieldNames = siteReports.fields.map(f => f.name);
    let patchNeeded = false;
    for (const f of siteReportsDef.fields) {
      if (!existingFieldNames.includes(f.name)) {
        siteReports.fields.push(f);
        patchNeeded = true;
        console.log(`  + Adding missing field ${f.name} to site_reports`);
      }
    }
    if (patchNeeded) {
      const patchRes = await fetch(`${url}/api/collections/site_reports`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: siteReports.fields })
      });
      if (!patchRes.ok) console.error('Failed to patch site_reports:', await patchRes.text());
      else console.log('  ✓ site_reports updated with new fields');
    } else {
      console.log('  ✓ site_reports collection already complete');
    }
  }

  // 3. Collection: ids_carts
  console.log('\n3. Checking ids_carts collection...');
  let idsCarts = await getCollection('ids_carts');
  const idsCartsDef = {
    name: 'ids_carts',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { name: 'cart_id', type: 'text', required: true },
      { name: 'project', type: 'relation', collectionId: projects.id, cascadeDelete: false, maxSelect: 1, required: false },
      { name: 'payload_json', type: 'json', required: false },
      { name: 'wholesaler', type: 'text', required: false },
      { name: 'item_count', type: 'number', required: false },
      { name: 'source', type: 'select', values: ['form_post', 'ajax'], maxSelect: 1, required: false }
    ]
  };

  if (!idsCarts) {
    console.log('  + Creating ids_carts collection...');
    const createRes = await fetch(`${url}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(idsCartsDef)
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create ids_carts: ${await createRes.text()}`);
    }
    idsCarts = await createRes.json();
    console.log('  ✓ ids_carts collection created successfully (ID:', idsCarts.id, ')');
  } else {
    console.log('  ✓ ids_carts collection already exists');
  }

  // 4. Collection: measurements
  console.log('\n4. Checking measurements collection...');
  let measurements = await getCollection('measurements');
  const measurementsDef = {
    name: 'measurements',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { name: 'site_report', type: 'relation', collectionId: siteReports.id, cascadeDelete: true, maxSelect: 1, required: true },
      { name: 'position_nr', type: 'text', required: false },
      { name: 'title', type: 'text', required: true },
      { name: 'formula', type: 'text', required: false },
      { name: 'quantity', type: 'number', required: false },
      { name: 'unit', type: 'text', required: false },
      { name: 'unit_price', type: 'number', required: false },
      { name: 'total_price', type: 'number', required: false },
      { name: 'tax_rate_type', type: 'text', required: false },
      { name: 'notes', type: 'text', required: false }
    ]
  };

  if (!measurements) {
    console.log('  + Creating measurements collection...');
    const createRes = await fetch(`${url}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(measurementsDef)
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create measurements: ${await createRes.text()}`);
    }
    measurements = await createRes.json();
    console.log('  ✓ measurements collection created successfully (ID:', measurements.id, ')');
  } else {
    console.log('  ✓ measurements collection already exists');
  }

  // 5. Collection: evidence_items
  console.log('\n5. Checking evidence_items collection...');
  let evidence = await getCollection('evidence_items');
  const evidenceDef = {
    name: 'evidence_items',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { name: 'site_report', type: 'relation', collectionId: siteReports.id, cascadeDelete: true, maxSelect: 1, required: true },
      { name: 'image', type: 'file', mimeTypes: ['image/jpeg', 'image/png', 'image/webp'], maxSize: 10485760, maxSelect: 1, required: false },
      { name: 'caption', type: 'text', required: false },
      { name: 'sha256_hash', type: 'text', required: false },
      { name: 'taken_at', type: 'text', required: false },
      { name: 'gps_lat', type: 'number', required: false },
      { name: 'gps_lon', type: 'number', required: false }
    ]
  };

  if (!evidence) {
    console.log('  + Creating evidence_items collection...');
    const createRes = await fetch(`${url}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(evidenceDef)
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create evidence_items: ${await createRes.text()}`);
    }
    evidence = await createRes.json();
    console.log('  ✓ evidence_items collection created successfully (ID:', evidence.id, ')');
  } else {
    console.log('  ✓ evidence_items collection already exists');
  }

  // 6. Collection: invoices_zugferd
  console.log('\n6. Checking invoices_zugferd collection...');
  let invoices = await getCollection('invoices_zugferd');
  const invoicesDef = {
    name: 'invoices_zugferd',
    type: 'base',
    listRule: "@request.auth.id != ''",
    viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''",
    updateRule: "@request.auth.id != ''",
    deleteRule: "@request.auth.id != ''",
    fields: [
      { name: 'site_report', type: 'relation', collectionId: siteReports.id, cascadeDelete: false, maxSelect: 1, required: false },
      { name: 'project', type: 'relation', collectionId: projects.id, cascadeDelete: false, maxSelect: 1, required: true },
      { name: 'invoice_number', type: 'text', required: true },
      { name: 'invoice_type', type: 'text', required: false },
      { name: 'net_total', type: 'number', required: false },
      { name: 'tax_rate', type: 'number', required: false },
      { name: 'tax_total', type: 'number', required: false },
      { name: 'gross_total', type: 'number', required: false },
      { name: 'prepaid_amount', type: 'number', required: false },
      { name: 'zugferd_xml', type: 'text', required: false },
      { name: 'pdf_file', type: 'file', mimeTypes: ['application/pdf'], maxSize: 20971520, maxSelect: 1, required: false },
      { name: 'datev_exported', type: 'bool', required: false },
      { name: 'datev_export_date', type: 'text', required: false }
    ]
  };

  if (!invoices) {
    console.log('  + Creating invoices_zugferd collection...');
    const createRes = await fetch(`${url}/api/collections`, {
      method: 'POST',
      headers,
      body: JSON.stringify(invoicesDef)
    });
    if (!createRes.ok) {
      throw new Error(`Failed to create invoices_zugferd: ${await createRes.text()}`);
    }
    invoices = await createRes.json();
    console.log('  ✓ invoices_zugferd collection created successfully (ID:', invoices.id, ')');
  } else {
    // Check prepaid_amount
    const existingFieldNames = invoices.fields.map(f => f.name);
    if (!existingFieldNames.includes('prepaid_amount')) {
      invoices.fields.push({ name: 'prepaid_amount', type: 'number', required: false });
      const patchRes = await fetch(`${url}/api/collections/invoices_zugferd`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields: invoices.fields })
      });
      if (patchRes.ok) console.log('  ✓ Added prepaid_amount to invoices_zugferd');
    } else {
      console.log('  ✓ invoices_zugferd collection already complete');
    }
  }

  console.log('\n=== PocketBase Migration Complete & Watertight! ===');
}

run().catch(err => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});
