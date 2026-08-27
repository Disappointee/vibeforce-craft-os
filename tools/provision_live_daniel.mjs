import PocketBase from 'pocketbase';

const liveUrl = 'https://api-46-225-178-235.sslip.io';
const pb = new PocketBase(liveUrl);

const superEmail = '***REMOVED***';
const superPass = '***REMOVED***';

const danielEmail = 'Daniel@vibeforcetest.de';
const danielPass = '***REMOVED***';
const danielName = 'Daniel';

async function main() {
  console.log(`Connecting to LIVE PocketBase at ${liveUrl}...`);

  // 1. Authenticate as superuser
  await pb.collection('_superusers').authWithPassword(superEmail, superPass);
  console.log(`✅ Superuser authenticated: ${superEmail}`);

  // 2. Check if Daniel exists in live users collection
  const existing = await pb.collection('users').getList(1, 1, {
    filter: `email = "${danielEmail}"`,
  });

  let rec;
  if (existing.totalItems > 0) {
    console.log(`Updating existing Daniel account on live server...`);
    rec = await pb.collection('users').update(existing.items[0].id, {
      password: danielPass,
      passwordConfirm: danielPass,
      name: danielName,
      role: 'admin',
      verified: true,
      emailVisibility: true,
    });
    console.log(`✅ Live user updated:`, rec.id);
  } else {
    console.log(`Creating new Daniel account on live server...`);
    rec = await pb.collection('users').create({
      email: danielEmail,
      password: danielPass,
      passwordConfirm: danielPass,
      name: danielName,
      role: 'admin',
      verified: true,
      emailVisibility: true,
    });
    console.log(`✅ Live user created:`, rec.id);
  }

  // 3. Test Daniel login on LIVE server
  console.log(`\n🧪 Testing Daniel login on LIVE server (${liveUrl})...`);
  pb.authStore.clear();
  const danielAuth = await pb.collection('users').authWithPassword(danielEmail, danielPass);
  console.log(`🎉 LIVE DANIEL LOGIN SUCCESSFUL!`);
  console.log(`  - User ID:`, danielAuth.record.id);
  console.log(`  - Email:`, danielAuth.record.email);
  console.log(`  - Role:`, danielAuth.record.role);
  console.log(`  - Token Length:`, danielAuth.token.length);

  // 4. Test Robin login on LIVE server
  console.log(`\n🧪 Testing Robin login on LIVE server (${liveUrl})...`);
  pb.authStore.clear();
  const robinAuth = await pb.collection('users').authWithPassword(superEmail, superPass);
  console.log(`🎉 LIVE ROBIN LOGIN SUCCESSFUL!`);
  console.log(`  - User ID:`, robinAuth.record.id);
  console.log(`  - Email:`, robinAuth.record.email);
  console.log(`  - Role:`, robinAuth.record.role);
}

main().catch(err => {
  console.error(`❌ Error provisioning live server:`, err);
  process.exit(1);
});
