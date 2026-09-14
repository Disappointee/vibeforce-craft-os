import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function test() {
  await pb.collection('_superusers').authWithPassword('admin@vibeforce-flow.de', '***REMOVED***');
  const id = '58t8jfsty4e6o99';

  const tests = [
    { name: 'empty opts', opts: {} },
    { name: 'filter only', opts: { filter: `project = '${id}'` } },
    { name: 'filter + sort created', opts: { filter: `project = '${id}'`, sort: '-created' } },
    { name: 'filter + expand author', opts: { filter: `project = '${id}'`, expand: 'author' } },
    { name: 'filter + sort report_date', opts: { filter: `project = '${id}'`, sort: '-report_date' } },
    { name: 'filter + sort both', opts: { filter: `project = '${id}'`, sort: '-report_date,-created' } },
    { name: 'full original query', opts: { filter: `project = '${id}'`, sort: '-report_date,-created', expand: 'author' } },
  ];

  for (const t of tests) {
    try {
      const res = await pb.collection('site_reports').getList(1, 10, t.opts);
      console.log(`✅ [${t.name}]: SUCCESS (items: ${res.totalItems})`);
    } catch (e) {
      console.log(`❌ [${t.name}]: FAILED -> ${e.message}`);
    }
  }
}

test().catch(console.error);
