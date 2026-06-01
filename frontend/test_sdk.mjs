import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://backend-production-a578.up.railway.app');
pb.autoCancellation(false);

async function test() {
  try {
    await pb.collection('users').authWithPassword('***REMOVED***', '***REMOVED***');
    console.log('Auth OK, model:', pb.authStore.record?.email);
  } catch(e) {
    console.error('Auth FAILED:', e.status, e.message);
    return;
  }

  // Test 1: No filter
  try {
    const r = await pb.collection('tasks').getList(1, 50);
    console.log('Test 1 (no filter) OK:', r.totalItems, 'tasks');
  } catch(e) {
    console.error('Test 1 FAILED:', e.status, e.message);
  }

  // Test 2: Filter with single quotes
  try {
    const r = await pb.collection('tasks').getList(1, 50, { filter: "status != 'done'" });
    console.log('Test 2 (single quotes) OK:', r.totalItems, 'tasks');
  } catch(e) {
    console.error('Test 2 FAILED:', e.status, e.message, JSON.stringify(e.response || {}));
  }

  // Test 3: Filter with double quotes
  try {
    const r = await pb.collection('tasks').getList(1, 50, { filter: 'status != "done"' });
    console.log('Test 3 (double quotes) OK:', r.totalItems, 'tasks');
  } catch(e) {
    console.error('Test 3 FAILED:', e.status, e.message, JSON.stringify(e.response || {}));
  }

  // Test 4: time_entries
  try {
    const r = await pb.collection('time_entries').getList(1, 200);
    console.log('Test 4 (time_entries) OK:', r.totalItems, 'entries');
  } catch(e) {
    console.error('Test 4 FAILED:', e.status, e.message);
  }
}

test();
