import PocketBase from 'pocketbase';

const urlsToTest = [
  'https://pb-vibeforce.46-225-178-235.sslip.io',
  'http://46.225.178.235:8090',
  'https://pb.vibeforce-flow.de',
  'https://vibeforce-flow.de'
];

async function testUrl(url) {
  console.log(`\n--- Testing ${url} ---`);
  const pb = new PocketBase(url);
  
  // 1. Healthcheck
  try {
    const health = await pb.health.check();
    console.log(`✅ Health check passed:`, health);
  } catch (err) {
    console.log(`❌ Health check failed:`, err.message);
    return;
  }

  // 2. Try auth as superuser / admin
  const creds = [
    { email: 'admin@vibeforce-flow.de', pass: process.env.PB_ADMIN_PASSWORD },
    { email: '***REMOVED***', pass: process.env.PB_ADMIN_PASSWORD },
    { email: 'Daniel@vibeforcetest.de', pass: process.env.DEMO_DANIEL_PASSWORD }
  ];

  for (const c of creds) {
    try {
      const auth = await pb.collection('users').authWithPassword(c.email, c.pass);
      console.log(`✅ Users collection Login SUCCESS for ${c.email} (Role: ${auth.record.role})`);
    } catch (e) {
      console.log(`❌ Users collection Login FAILED for ${c.email}: ${e.message}`);
    }

    try {
      const auth = await pb.collection('_superusers').authWithPassword(c.email, c.pass);
      console.log(`✅ Superusers collection Login SUCCESS for ${c.email}`);
    } catch (e) {
      console.log(`❌ Superusers collection Login FAILED for ${c.email}: ${e.message}`);
    }
  }
}

async function main() {
  for (const u of urlsToTest) {
    await testUrl(u);
  }
}

main().catch(console.error);
