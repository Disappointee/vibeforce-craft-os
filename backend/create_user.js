const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "http://127.0.0.1:8090";

async function createUser() {
  // 1. Get admin token
  let authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  
  if (!authRes.ok) {
    console.error("Admin auth failed. Is PocketBase running?");
    return;
  }
  
  const token = (await authRes.json()).token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // 2. Check if user already exists
  const checkRes = await fetch(`${baseUrl}/api/collections/users/records?filter=(email='${email}')`, { headers });
  const checkData = await checkRes.json();
  
  if (checkData.totalItems > 0) {
    console.log("User already exists. Updating password just in case...");
    const userId = checkData.items[0].id;
    await fetch(`${baseUrl}/api/collections/users/records/${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        password: password,
        passwordConfirm: password,
        name: "Robin Lehnebach",
        role: "admin"
      })
    });
  } else {
    console.log("Creating new user...");
    await fetch(`${baseUrl}/api/collections/users/records`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        email: email,
        password: password,
        passwordConfirm: password,
        name: "Robin Lehnebach",
        emailVisibility: true,
        role: "admin"
      })
    });
  }
  console.log("User setup complete.");
}

createUser().catch(console.error);
