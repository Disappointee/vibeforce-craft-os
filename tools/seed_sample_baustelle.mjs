import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function seedSampleCraft() {
  await pb.collection('_superusers').authWithPassword('admin@vibeforce-flow.de', process.env.PB_ADMIN_PASSWORD);
  console.log('✅ Superuser authenticated');

  // 1. Client
  let clientId = null;
  const clients = await pb.collection('clients').getList(1, 1, { filter: 'name ~ "Huber"' });
  if (clients.totalItems > 0) {
    clientId = clients.items[0].id;
    console.log('Found existing client:', clientId);
  } else {
    const c = await pb.collection('clients').create({
      name: 'Familie Markus Huber',
      company: 'Bauvorhaben Huber Riemerling',
      contact_person: 'Herr Markus Huber (Bauherr)',
      email: 'markus.huber@t-online.de',
      phone: '+49 89 12345678',
      address: 'Sonnenweg 14, 85521 Riemerling',
      notes: 'Neubau KfW-40 Plus Einfamilienhaus in Holzständerbauweise.',
    });
    clientId = c.id;
    console.log('Created client:', clientId);
  }

  // 2. Craft Projects
  const craftProjects = [
    {
      name: 'Neubau EFH Familie Huber (Dachstuhl & Holzbau)',
      key: 'BAU-01',
      description: 'Neubau KfW-40 Plus Einfamilienhaus in Holzständerbauweise. VOB/B Bauvorhaben.',
      status: 'active',
      budget_hours: 320,
      budget_money: 148500,
      client: clientId,
    },
    {
      name: 'Sanierung Gewerbehalle Schmidt (Brandschutz & Trockenbau)',
      key: 'BAU-02',
      description: 'Sanierung Gewerbehalle nach VOB/B § 13. F90 Brandschutz und Akustikdecken.',
      status: 'active',
      budget_hours: 450,
      budget_money: 230000,
      client: clientId,
    }
  ];

  for (const p of craftProjects) {
    const existing = await pb.collection('projects').getList(1, 1, { filter: `key = '${p.key}'` });
    if (existing.totalItems > 0) {
      console.log(`Project ${p.key} already exists:`, existing.items[0].id);
    } else {
      const created = await pb.collection('projects').create(p);
      console.log(`✅ Created project ${p.key}:`, created.id);
    }
  }
}

seedSampleCraft().catch(console.error);
