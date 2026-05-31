// Check for duplicate project keys
const baseUrl = "http://127.0.0.1:8090";

async function main() {
    const res = await fetch(`${baseUrl}/api/collections/projects/records?perPage=100`);
    const data = await res.json();
    const keys = data.items.map(p => p.key);
    const seen = {};
    const dups = [];
    for (const k of keys) {
        if (seen[k]) { dups.push(k); }
        seen[k] = true;
    }
    console.log('Total projects:', data.items.length);
    console.log('All keys:', JSON.stringify(keys));
    console.log('Duplicate keys:', JSON.stringify([...new Set(dups)]));

    // Show duplicate records
    for (const dupKey of [...new Set(dups)]) {
        const dups_records = data.items.filter(p => p.key === dupKey);
        console.log(`\nDuplicates for key "${dupKey}":`);
        for (const r of dups_records) {
            console.log(`  - ID: ${r.id}, Name: ${r.name}, Created: ${r.created}`);
        }
    }
}

main().catch(console.error);
