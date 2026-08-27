import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');
pb.autoCancellation(false);

async function run() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', '***REMOVED***');
  const projs = await pb.collection('projects').getList(1, 1);
  const users = await pb.collection('users').getList(1, 2);
  const u1 = users.items[0].id;
  const u2 = users.items[1].id;
  const pId = projs.items[0].id;

  console.log('Testing assignees as single string:', u1);
  try {
    const r1 = await pb.collection('tasks').create({
      project: pId,
      title: 'Assignee String Test',
      status: 'todo',
      priority: 'high',
      assignees: u1
    });
    console.log('Single string ok:', r1.id, 'assignees field:', r1.assignees);
    await pb.collection('tasks').delete(r1.id);
  } catch (e) { console.log('Single string err:', e.response?.data || e.message); }

  console.log('Testing assignees as single-element array:', [u1]);
  try {
    const r2 = await pb.collection('tasks').create({
      project: pId,
      title: 'Assignee Array 1 Test',
      status: 'todo',
      priority: 'high',
      assignees: [u1]
    });
    console.log('Array 1 ok:', r2.id, 'assignees field:', r2.assignees);
    await pb.collection('tasks').delete(r2.id);
  } catch (e) { console.log('Array 1 err:', e.response?.data || e.message); }
}

run().catch(console.error);
