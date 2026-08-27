import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pb-vibeforce.46-225-178-235.sslip.io');

async function testCredentials(pass) {
  console.log(`\nTesting password: "${pass}" for ***REMOVED***...`);
  
  // 1. Check users collection (App Login)
  try {
    pb.authStore.clear();
    const userAuth = await pb.collection('users').authWithPassword('***REMOVED***', pass);
    console.log(`✅ USERS COLLECTION (App Login): SUCCESS! ID: ${userAuth.record.id}, Role: ${userAuth.record.role}`);
  } catch (e) {
    console.log(`❌ USERS COLLECTION (App Login): FAILED -> ${e.message}`);
  }

  // 2. Check _superusers collection (PocketBase Dashboard Login)
  try {
    pb.authStore.clear();
    const superAuth = await pb.collection('_superusers').authWithPassword('***REMOVED***', pass);
    console.log(`✅ SUPERUSERS COLLECTION (DB Dashboard): SUCCESS!`);
  } catch (e) {
    console.log(`❌ SUPERUSERS COLLECTION (DB Dashboard): FAILED -> ${e.message}`);
  }
}

async function inspectAllUsers() {
  console.log(`\n--- Inspecting all users in users collection ---`);
  try {
    await pb.collection('_superusers').authWithPassword('***REMOVED***', '***REMOVED***');
    const users = await pb.collection('users').getFullList();
    console.log(`Found ${users.length} users:`);
    for (const u of users) {
      console.log(` - ${u.email} (Name: ${u.name}, Role: ${u.role}, Verified: ${u.verified}, ID: ${u.id})`);
    }
  } catch (e) {
    console.error('Superuser inspection failed:', e.message);
  }
}

async function main() {
  await testCredentials('***REMOVED***');
  await inspectAllUsers();
}

main().catch(console.error);
