const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "";

async function fixUsersRule() {
  let authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  
  if (!authRes.ok) {
    console.error("Superuser-Login fehlgeschlagen:", await authRes.text());
    return;
  }
  
  const token = (await authRes.json()).token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  const usersRes = await fetch(`${baseUrl}/api/collections/users`, { headers });
  const users = await usersRes.json();
  
  // Erlaube Benutzern sich selbst zu updaten ODER Admins alle zu updaten
  users.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  
  const updateRes = await fetch(`${baseUrl}/api/collections/users`, { 
    method: "PATCH", 
    headers, 
    body: JSON.stringify({ updateRule: users.updateRule }) 
  });

  if (updateRes.ok) {
    console.log("Users Update Rule erfolgreich aktualisiert:", (await updateRes.json()).updateRule);
  } else {
    console.error("Fehler beim Update:", await updateRes.text());
  }
}

fixUsersRule().catch(console.error);
