import PocketBase from 'pocketbase';

const liveUrl = 'https://pb-vibeforce.46-225-178-235.sslip.io';
const pb = new PocketBase(liveUrl);

async function main() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', process.env.PB_ADMIN_PASSWORD);
  console.log('✅ Authenticated as superuser on live server');

  // Check and update projects
  const projects = await pb.collection('projects').getFullList();
  console.log(`Found ${projects.length} projects on live server:`);
  for (const p of projects) {
    console.log(` - ${p.id}: ${p.name} (${p.key})`);
    if (p.name.includes('Awork') || p.name.includes('awork') || p.name.includes('Klicklaut')) {
      console.log(`   -> Updating project name to "Vibeforce Flow OS Core"...`);
      await pb.collection('projects').update(p.id, {
        name: 'Vibeforce Flow OS Core',
        key: 'VFOS',
        description: 'Zentrales Plattform- und Entwicklungsprojekt für Vibeforce Flow OS.'
      });
      console.log(`   ✅ Project updated.`);
    }
  }

  // Verify Daniel admin record
  const users = await pb.collection('users').getFullList({ filter: 'email = "Daniel@vibeforcetest.de"' });
  if (users.length > 0) {
    console.log(`✅ Daniel Admin user exists: ID ${users[0].id}, Role: ${users[0].role}, Verified: ${users[0].verified}`);
  } else {
    console.log(`Creating Daniel Admin user...`);
    const d = await pb.collection('users').create({
      email: 'Daniel@vibeforcetest.de',
      password: process.env.DEMO_DANIEL_PASSWORD,
      passwordConfirm: process.env.DEMO_DANIEL_PASSWORD,
      name: 'Daniel',
      role: 'admin',
      verified: true,
      emailVisibility: true
    });
    console.log(`✅ Created Daniel Admin user: ${d.id}`);
  }

  // Test real login as Daniel
  pb.authStore.clear();
  const danielAuth = await pb.collection('users').authWithPassword('Daniel@vibeforcetest.de', process.env.DEMO_DANIEL_PASSWORD);
  console.log(`🎉 TEST LOGIN SUCCESSFUL for Daniel! Token length: ${danielAuth.token.length}`);
}

main().catch(console.error);
