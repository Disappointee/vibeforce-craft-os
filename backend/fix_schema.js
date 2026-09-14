// Fix: Add created/updated fields to tasks, projects, time_entries collections
const email = "admin@vibeforce-flow.de";
const password = "***REMOVED***";
const baseUrl = "http://127.0.0.1:8090";

async function fixSchemas() {
  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const { token } = await authRes.json();
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const collections = ['tasks', 'projects', 'time_entries'];
  
  for (const colName of collections) {
    const res = await fetch(`${baseUrl}/api/collections/${colName}`, { headers });
    const data = await res.json();
    
    // Check if autodate fields exist
    const fieldNames = data.fields.map(f => f.name);
    console.log(`\n${colName} fields:`, fieldNames.join(', '));
    
    let needsUpdate = false;
    
    if (!fieldNames.includes('created')) {
      data.fields.push({
        name: "created",
        type: "autodate",
        onCreate: true,
        onUpdate: false
      });
      needsUpdate = true;
      console.log(`  + Adding 'created' field`);
    }
    
    if (!fieldNames.includes('updated')) {
      data.fields.push({
        name: "updated",
        type: "autodate",
        onCreate: true,
        onUpdate: true
      });
      needsUpdate = true;
      console.log(`  + Adding 'updated' field`);
    }
    
    if (needsUpdate) {
      const updateRes = await fetch(`${baseUrl}/api/collections/${colName}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data)
      });
      if (updateRes.ok) {
        console.log(`  ✓ ${colName} updated successfully`);
      } else {
        const err = await updateRes.text();
        console.error(`  ✗ ${colName} update failed:`, err);
      }
    } else {
      console.log(`  ✓ ${colName} already has created/updated fields`);
    }
  }
}

fixSchemas().catch(console.error);
