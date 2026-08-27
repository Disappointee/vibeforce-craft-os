import PocketBase from 'pocketbase';

const baseUrl = 'http://127.0.0.1:8090';
const pb = new PocketBase(baseUrl);

const adminEmail = 'Daniel@vibeforcetest.de';
const adminPassword = '***REMOVED***';
const adminName = 'Daniel';

async function main() {
  console.log('🔄 Connecting to PocketBase at', baseUrl);

  // 1. Authenticate as superuser / existing admin to manage collections
  let superuserToken = null;
  const superuserCredentials = [
    { email: 'admin@vibeforce-flow.de', pass: '***REMOVED***' },
    { email: '***REMOVED***', pass: '***REMOVED***' }
  ];

  for (const cred of superuserCredentials) {
    try {
      await pb.collection('_superusers').authWithPassword(cred.email, cred.pass);
      superuserToken = pb.authStore.token;
      console.log(`✅ Authenticated as superuser: ${cred.email}`);
      break;
    } catch (err) {
      // try next
    }
  }

  if (!superuserToken) {
    // If superuser not authenticated via _superusers, try users collection
    for (const cred of superuserCredentials) {
      try {
        await pb.collection('users').authWithPassword(cred.email, cred.pass);
        superuserToken = pb.authStore.token;
        console.log(`✅ Authenticated as admin user: ${cred.email}`);
        break;
      } catch (err) {
        // try next
      }
    }
  }

  // 2. Check if Daniel exists in users collection
  try {
    const existing = await pb.collection('users').getList(1, 1, {
      filter: `email = "${adminEmail}"`,
    });

    let danielRecord;
    if (existing.totalItems > 0) {
      console.log('ℹ️ User exists. Updating credentials for Daniel...');
      danielRecord = await pb.collection('users').update(existing.items[0].id, {
        password: adminPassword,
        passwordConfirm: adminPassword,
        name: adminName,
        role: 'admin',
        verified: true,
        emailVisibility: true,
      });
      console.log('✅ User record updated:', danielRecord.id);
    } else {
      console.log('🆕 Creating new Admin user record for Daniel...');
      danielRecord = await pb.collection('users').create({
        email: adminEmail,
        password: adminPassword,
        passwordConfirm: adminPassword,
        name: adminName,
        role: 'admin',
        verified: true,
        emailVisibility: true,
      });
      console.log('✅ User record created:', danielRecord.id);
    }

    // 3. Clear auth store and test REAL LOGIN as Daniel
    pb.authStore.clear();
    console.log('\n🧪 Testing automated login for Daniel...');
    const authData = await pb.collection('users').authWithPassword(adminEmail, adminPassword);
    
    console.log('🎉 LOGIN VERIFIED SUCCESSFULLY!');
    console.log('  - User ID:', authData.record.id);
    console.log('  - Email:', authData.record.email);
    console.log('  - Name:', authData.record.name);
    console.log('  - Role:', authData.record.role);
    console.log('  - Auth Token Length:', authData.token.length);
    console.log('  - Status: 100% OPERATIONAL');

  } catch (err) {
    console.error('❌ Error during user creation / test:', err);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
