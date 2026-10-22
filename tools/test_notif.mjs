import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');
pb.autoCancellation(false);

async function run() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', process.env.PB_ADMIN_PASSWORD);
  const users = await pb.collection('users').getList(1, 1);
  const u1 = users.items[0].id;

  console.log('Testing direct notification creation:');
  try {
    const notif = await pb.collection('notifications').create({
      user: u1,
      type: 'task_assigned',
      title: 'Test Notification',
      message: 'Test message',
      read: false,
      link: '/tasks'
    });
    console.log('Notification created ok:', notif.id);
    await pb.collection('notifications').delete(notif.id);
  } catch (e) {
    console.log('Notification error:', e.response?.data || e.message);
  }
}

run().catch(console.error);
