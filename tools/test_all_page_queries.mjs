import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function testAll() {
  await pb.collection('_superusers').authWithPassword('admin@vibeforce-flow.de', process.env.PB_ADMIN_PASSWORD);
  const id = '58t8jfsty4e6o99';

  console.log('1. getOne project...');
  const project = await pb.collection('projects').getOne(id);
  console.log('Project:', project.name);

  console.log('2. tasks query...');
  const tasksResult = await pb.collection('tasks').getList(1, 50, {
    filter: pb.filter('project = {:id}', { id }),
    sort: '-created',
    expand: 'assignees',
  });
  console.log('Tasks:', tasksResult.items.length);

  console.log('3. external_expenses query...');
  try {
    const expensesResult = await pb.collection('external_expenses').getList(1, 100, {
      filter: pb.filter('project = {:id}', { id }),
      sort: '-created',
    });
    console.log('Expenses:', expensesResult.items.length);
  } catch (e) {
    console.log('Expenses failed:', e.message);
  }

  console.log('4. site_reports query...');
  try {
    const reportsResult = await pb.collection('site_reports').getList(1, 100, {
      filter: pb.filter('project = {:id}', { id }),
      sort: '-report_date',
      expand: 'author',
    });
    console.log('Reports:', reportsResult.items.length);
  } catch (e) {
    console.log('Reports failed:', e.message);
  }
}

testAll().catch(console.error);
