import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');
pb.autoCancellation(false);

async function run() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', '***REMOVED***');
  const taskCol = await pb.collections.getOne('tasks');
  const f = taskCol.fields.find(f => f.name === 'assignees');
  console.log('tasks.assignees field:', JSON.stringify(f, null, 2));

  const usersCol = await pb.collections.getOne('users');
  console.log('users collection id:', usersCol.id, 'name:', usersCol.name);
}

run().catch(console.error);
