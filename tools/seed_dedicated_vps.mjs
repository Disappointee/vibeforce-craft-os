import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function main() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', '***REMOVED***');
  console.log('✅ Superuser logged in');

  // 1. Ensure Robin is verified
  const robins = await pb.collection('users').getList(1, 1, { filter: 'email = "***REMOVED***"' });
  if (robins.totalItems > 0) {
    await pb.collection('users').update(robins.items[0].id, { verified: true });
    console.log('✅ Robin verified: true');
  }

  // 2. Check and seed sample tasks
  const tasks = await pb.collection('tasks').getList(1, 1);
  if (tasks.totalItems === 0) {
    console.log('Creating sample tasks for Vibeforce Flow OS...');
    const projects = await pb.collection('projects').getList(1, 5);
    const users = await pb.collection('users').getList(1, 5);
    const uIds = users.items.map(u => u.id);

    const sampleTasks = [
      { title: 'Brand Design System Finalisierung', status: 'in_progress', priority: 'high', estimated_hours: 12 },
      { title: 'Multi-View Gantt Timeline Konfiguration', status: 'done', priority: 'medium', estimated_hours: 8 },
      { title: 'ZUGFeRD 2.2 E-Invoicing Schnittstelle testen', status: 'todo', priority: 'acute', estimated_hours: 16 },
      { title: 'Workload & Team-Auslastungsanalyse', status: 'in_progress', priority: 'medium', estimated_hours: 6 },
      { title: 'Multi-Market Compliance Leitfaden prüfen', status: 'todo', priority: 'low', estimated_hours: 4 },
      { title: 'Dashboard KPI Widget Validierung', status: 'done', priority: 'high', estimated_hours: 5 },
    ];

    for (let i = 0; i < sampleTasks.length; i++) {
      const p = projects.items[i % projects.items.length];
      await pb.collection('tasks').create({
        ...sampleTasks[i],
        project: p.id,
        assignees: [uIds[i % uIds.length]],
        due_date: new Date(Date.now() + (i + 1) * 86400000 * 2).toISOString(),
      });
      console.log(`  + Created task: ${sampleTasks[i].title} (${p.name})`);
    }
  }

  const finalTasks = await pb.collection('tasks').getList(1, 10);
  console.log(`✅ Total tasks in dedicated Vibeforce backend: ${finalTasks.totalItems}`);
}

main().catch(console.error);
