import PocketBase from 'pocketbase';

const liveUrl = 'https://pb-vibeforce.46-225-178-235.sslip.io';
const pb = new PocketBase(liveUrl);

async function main() {
  await pb.collection('_superusers').authWithPassword('***REMOVED***', process.env.PB_ADMIN_PASSWORD);
  
  const collections = await pb.collections.getFullList();
  console.log(`\n📦 Collections on LIVE PocketBase (${liveUrl}):`);
  for (const c of collections) {
    try {
      const res = await pb.collection(c.name).getList(1, 1);
      console.log(` - ${c.name.padEnd(22)} (${c.type}): ${res.totalItems} records`);
    } catch (err) {
      console.log(` - ${c.name.padEnd(22)} (${c.type}): error (${err.message})`);
    }
  }
}

main().catch(console.error);
