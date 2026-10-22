const email = "admin@vibeforce-flow.de";
const password = process.env.PB_ADMIN_PASSWORD;
const baseUrl = "http://127.0.0.1:8090";

async function deepDebug() {
  const authRes = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const headers = { "Authorization": `Bearer ${token}` };

  // 1. Fetch Project
  const projId = "qox9g3zr9qk95va";
  console.log(`Testing Project getOne(${projId})...`);
  const res1 = await fetch(`${baseUrl}/api/collections/projects/records/${projId}`, { headers });
  console.log("Status:", res1.status);
  if (res1.status !== 200) console.log(await res1.json());

  // 2. Fetch Tasks with Filter
  console.log(`Testing Tasks filter (project='${projId}')...`);
  const url = `${baseUrl}/api/collections/tasks/records?filter=project%3D'${projId}'&expand=assignees`;
  const res2 = await fetch(url, { headers });
  console.log("Status:", res2.status);
  const data2 = await res2.json();
  if (res2.status !== 200) {
    console.log(JSON.stringify(data2, null, 2));
  } else {
    console.log("Success:", data2.items.length, "tasks");
  }
}

deepDebug().catch(console.error);
