const email = "***REMOVED***";
const password = "***REMOVED***";

async function checkPB(url) {
  try {
    let authRes = await fetch(`${url}/api/collections/_superusers/auth-with-password`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password: password })
    });
    
    if (!authRes.ok) {
      console.log(`[${url}] Login failed:`, await authRes.text());
      return;
    }
    
    const token = (await authRes.json()).token;
    const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

    const usersRes = await fetch(`${url}/api/collections/users`, { headers });
    const users = await usersRes.json();
    console.log(`[${url}] users updateRule:`, users.updateRule);
  } catch (e) {
    console.log(`[${url}] Connection error:`, e.message);
  }
}

async function run() {
  await checkPB("");
  await checkPB("");
}

run();
