const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "http://127.0.0.1:8090";

async function testQuery() {
  const authRes = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const headers = { "Authorization": `Bearer ${token}` };

  console.log("Testing filter: status != 'done'");
  const url = `${baseUrl}/api/collections/tasks/records?page=1&perPage=50&filter=status%20!%3D%20'done'&expand=project,assignees`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  if (res.status !== 200) {
    console.error("Error Status:", res.status);
    console.error("Error Body:", JSON.stringify(data, null, 2));
  } else {
    console.log("Success:", data.items.length, "tasks");
  }
}

testQuery().catch(console.error);
