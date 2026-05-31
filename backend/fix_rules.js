const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "http://127.0.0.1:8090";

async function fixRules() {
  let authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const token = (await authRes.json()).token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Fix users rule
  const usersRes = await fetch(`${baseUrl}/api/collections/users`, { headers });
  const users = await usersRes.json();
  users.viewRule = "@request.auth.id != ''";
  users.listRule = "@request.auth.id != ''";
  await fetch(`${baseUrl}/api/collections/users`, { method: "PATCH", headers, body: JSON.stringify(users) });

  // Fix projects rule
  const projectsRes = await fetch(`${baseUrl}/api/collections/projects`, { headers });
  const projects = await projectsRes.json();
  projects.listRule = "@request.auth.id != ''";
  projects.viewRule = "@request.auth.id != ''";
  projects.createRule = "@request.auth.id != ''"; // Allow all auth users for now
  projects.updateRule = "@request.auth.id != ''";
  await fetch(`${baseUrl}/api/collections/projects`, { method: "PATCH", headers, body: JSON.stringify(projects) });

  console.log("Rules updated successfully.");
}

fixRules().catch(console.error);
