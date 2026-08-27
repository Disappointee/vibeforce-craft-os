import PocketBase from 'pocketbase';

const pb = new PocketBase('https://api-46-225-178-235.sslip.io');
pb.autoCancellation(false);

async function run() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', '***REMOVED***');
  const projs = await pb.collection('projects').getList(1, 1);
  const users = await pb.collection('users').getList(1, 2);
  const u1 = users.items[0].id;
  const u2 = users.items[1].id;
  const pId = projs.items[0].id;

  const base = { project: pId, title: 'Diagnostic Task', status: 'todo', priority: 'high' };

  console.log('1. Base task only:');
  try {
    const r = await pb.collection('tasks').create(base);
    console.log('Base ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Base err:', e.response?.data || e.message); }

  console.log('2. Base + assignees:');
  try {
    const r = await pb.collection('tasks').create({ ...base, assignees: [u1, u2] });
    console.log('Assignees ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Assignees err:', e.response?.data || e.message); }

  console.log('3. Base + description:');
  try {
    const r = await pb.collection('tasks').create({ ...base, description: '<p>Hello</p>' });
    console.log('Desc ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Desc err:', e.response?.data || e.message); }

  console.log('4. Base + type:');
  try {
    const r = await pb.collection('tasks').create({ ...base, type: 'development' });
    console.log('Type ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Type err:', e.response?.data || e.message); }

  console.log('5. Base + dates:');
  try {
    const r = await pb.collection('tasks').create({
      ...base,
      start_date: '2026-08-12 12:00:00.000Z',
      due_date: '2026-09-10 12:00:00.000Z'
    });
    console.log('Dates ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Dates err:', e.response?.data || e.message); }

  console.log('6. Base + estimated_hours:');
  try {
    const r = await pb.collection('tasks').create({ ...base, estimated_hours: 24 });
    console.log('Est hours ok:', r.id);
    await pb.collection('tasks').delete(r.id);
  } catch (e) { console.log('Est hours err:', e.response?.data || e.message); }
}

run().catch(console.error);
