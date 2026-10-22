const email = "admin@vibeforce-flow.de";
const password = process.env.PB_ADMIN_PASSWORD;
const baseUrl = "http://127.0.0.1:8090";

async function globalRuleReset() {
  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const token = (await authRes.json()).token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const collections = ['projects', 'tasks', 'time_entries', 'users'];
  
  for (const colName of collections) {
    const res = await fetch(`${baseUrl}/api/collections/${colName}`, { headers });
    const data = await res.json();
    
    data.listRule = "@request.auth.id != ''";
    data.viewRule = "@request.auth.id != ''";
    data.createRule = "@request.auth.id != ''";
    data.updateRule = "@request.auth.id != ''";
    data.deleteRule = "@request.auth.role = 'admin'"; // Keep delete restricted
    
    await fetch(`${baseUrl}/api/collections/${colName}`, { 
      method: "PATCH", 
      headers, 
      body: JSON.stringify(data) 
    });
    console.log(`Rules for ${colName} updated.`);
  }
}

globalRuleReset().catch(console.error);
