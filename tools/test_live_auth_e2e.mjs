import PocketBase from 'pocketbase';

const liveUrl = 'https://api-46-225-178-235.sslip.io';
const pb = new PocketBase(liveUrl);

async function testAuth(email, pass, label) {
  console.log(`\n========================================`);
  console.log(`🧪 Testing Auth for: ${label} (${email})`);
  console.log(`========================================`);
  
  pb.authStore.clear();

  try {
    const authData = await pb.collection('users').authWithPassword(email, pass);
    console.log(`✅ AUTH SUCCESS:`);
    console.log(`  - User ID: ${authData.record.id}`);
    console.log(`  - Name: ${authData.record.name}`);
    console.log(`  - Email: ${authData.record.email}`);
    console.log(`  - Role: ${authData.record.role}`);
    console.log(`  - Verified: ${authData.record.verified}`);
    console.log(`  - Token: ${authData.token.substring(0, 20)}... (Length: ${authData.token.length})`);

    // Verify token can query collections
    const projects = await pb.collection('projects').getList(1, 5);
    console.log(`✅ Data Access Test: Successfully loaded ${projects.totalItems} projects`);

    const tasks = await pb.collection('tasks').getList(1, 5);
    console.log(`✅ Data Access Test: Successfully loaded ${tasks.totalItems} tasks`);

  } catch (err) {
    console.error(`❌ AUTH FAILED:`, err.message);
    process.exit(1);
  }
}

async function run() {
  await testAuth('Daniel@vibeforcetest.de', '***REMOVED***', 'Daniel (Admin)');
  await testAuth('***REMOVED***', '***REMOVED***', 'Robin Lehnebach (Admin)');
  console.log(`\n🎉 ALL LIVE END-TO-END AUTH TESTS PASSED 100%!`);
}

run().catch(console.error);
