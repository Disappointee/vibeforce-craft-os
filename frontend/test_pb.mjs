import PocketBase from 'pocketbase';

async function test(url, name) {
    console.log(`\n--- Testing ${name} (${url}) ---`);
    const pb = new PocketBase(url);
    try {
        console.log("Authenticating...");
        await pb.collection('users').authWithPassword('klicklaut@agentur.de', '***REMOVED***');
        console.log("Auth success. Token:", pb.authStore.token ? "Exists" : "Empty");
        
        console.log("Fetching projects...");
        const projects = await pb.collection('projects').getList(1, 10);
        console.log(`Projects found: ${projects.totalItems}`);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

async function run() {
    await test('https://aworkremaster-production.up.railway.app', 'Railway Direct');
    await test('https://api-46-225-178-235.sslip.io', 'sslip.io Proxy');
}

run();
