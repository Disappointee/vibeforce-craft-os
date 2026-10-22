import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function run() {
  await pb.collection('_superusers').authWithPassword('admin@vibeforce-flow.de', process.env.PB_ADMIN_PASSWORD);
  console.log('=== AUTH AS SUPERUSER OK ===');

  // 1. All time entries
  const entries = await pb.collection('time_entries').getFullList({
    sort: '-created',
    expand: 'task,user,task.project'
  });
  console.log('Total time_entries in DB:', entries.length);
  for (const e of entries) {
    const durH = ((e.duration_minutes || 0) / 60).toFixed(2);
    console.log(
      `ID: ${e.id} | User: ${e.expand?.user?.email || e.user} | Task: ${e.expand?.task?.title || e.task} | Start: ${e.start_time} | End: ${e.end_time} | Min: ${e.duration_minutes} (${durH}h) | Created: ${e.created} | Updated: ${e.updated}`
    );
  }

  // 2. Request logs
  try {
    const logs = await pb.send('/api/logs', {
      query: { filter: 'url ~ "time_entries"', perPage: 30 }
    });
    console.log('\n=== RECENT POCKETBASE LOGS FOR TIME_ENTRIES ===');
    console.log('Found log items:', logs.items?.length || 0);
    for (const l of (logs.items || [])) {
      console.log(`${l.created} | ${l.method} ${l.status} | URL: ${l.url} | IP: ${l.ip}`);
    }
  } catch (err) {
    console.log('Logs endpoint query notice:', err.message);
  }
}

run().catch(console.error);
