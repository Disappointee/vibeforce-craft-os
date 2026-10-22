import PocketBase from 'pocketbase';

const pb = new PocketBase('http://127.0.0.1:8090');
pb.autoCancellation(false);

async function audit() {
  await pb.collection('users').authWithPassword('admin@vibeforce-flow.de', process.env.PB_ADMIN_PASSWORD);

  const projects = await pb.collection('projects').getFullList({ sort: 'created' });
  console.log('=== ALL PROJECTS ===');
  projects.forEach(p => {
    console.log('ID:', p.id, '| Key:', p.key, '| Name:', p.name, '| Status:', p.status, '| Created:', p.created);
  });
  console.log('Total:', projects.length, 'projects\n');

  // Check for duplicate keys
  const keyMap = {};
  projects.forEach(p => {
    if (!keyMap[p.key]) keyMap[p.key] = [];
    keyMap[p.key].push(p.id);
  });
  const dupeKeys = Object.entries(keyMap).filter(([k, ids]) => ids.length > 1);
  if (dupeKeys.length > 0) {
    console.log('=== DUPLICATE PROJECT KEYS ===');
    dupeKeys.forEach(([key, ids]) => console.log('Key:', key, '| IDs:', ids.join(', ')));
  } else {
    console.log('No duplicate project keys found.');
  }

  const tasks = await pb.collection('tasks').getFullList({ sort: '-created', expand: 'project,assignees' });
  console.log('\n=== ALL TASKS ===');
  tasks.forEach(t => {
    const projKey = t.expand?.project?.key || t.project;
    const assigneeNames = t.expand?.assignees?.map(a => a.name || a.email) || t.assignees;
    console.log('ID:', t.id, '| Project:', projKey, '| Title:', t.title, '| Status:', t.status, '| Priority:', t.priority, '| Assignees:', JSON.stringify(assigneeNames));
  });
  console.log('Total:', tasks.length, 'tasks\n');

  const users = await pb.collection('users').getFullList();
  console.log('=== ALL USERS ===');
  users.forEach(u => console.log('ID:', u.id, '| Name:', u.name, '| Email:', u.email, '| Role:', u.role));

  const timeEntries = await pb.collection('time_entries').getFullList();
  console.log('\n=== TIME ENTRIES:', timeEntries.length, '===');
  timeEntries.forEach(t => console.log('ID:', t.id, '| Task:', t.task, '| Duration:', t.duration_minutes, 'min | Billable:', t.is_billable));
}

audit().catch(console.error);
