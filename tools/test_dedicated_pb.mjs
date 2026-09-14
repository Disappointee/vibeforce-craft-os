import PocketBase from 'pocketbase';

const liveUrl = 'https://pb-vibeforce.46-225-178-235.sslip.io';
const pb = new PocketBase(liveUrl);

async function testUser(email, pass, label) {
  console.log(`\nTesting login for: ${label} (${email})...`);
  pb.authStore.clear();

  try {
    const auth = await pb.collection('users').authWithPassword(email, pass);
    console.log(`✅ SUCCESS! Logged in as: ${auth.record.email}`);
    console.log(`  - Role: ${auth.record.role}`);
    console.log(`  - Verified: ${auth.record.verified}`);
    console.log(`  - Token Length: ${auth.token.length}`);
  } catch (err) {
    console.error(`❌ FAILED: ${err.message}`);
    throw err;
  }
}

async function main() {
  console.log(`Checking https://pb-vibeforce.46-225-178-235.sslip.io...`);
  
  // Health
  const health = await pb.health.check();
  console.log(`✅ Health:`, health);

  // Daniel
  await testUser('Daniel@vibeforcetest.de', '***REMOVED***', 'Daniel (Admin)');

  // Robin
  await testUser('***REMOVED***', '***REMOVED***', 'Robin (Admin)');

  // Projects count
  const projects = await pb.collection('projects').getList(1, 5);
  console.log(`✅ Projects available: ${projects.totalItems} total`);

  // Tasks count
  const tasks = await pb.collection('tasks').getList(1, 5);
  console.log(`✅ Tasks available: ${tasks.totalItems} total`);

  console.log(`\n🎉 100% OPERATIONAL & VERIFIED!`);
}

main().catch(console.error);
