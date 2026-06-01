async function test() {
  const email = 'admin@vibeforce-flow.de';
  const pw = '***REMOVED***';
  
  // Auth as USER (not superuser)
  const authRes = await fetch('http://127.0.0.1:8090/api/collections/users/auth-with-password', {
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: email, password: pw })
  });
  
  if (!authRes.ok) {
    console.log('USER AUTH FAILED:', authRes.status, await authRes.text());
    return;
  }
  
  const { token } = await authRes.json();
  const h = { 'Authorization': 'Bearer ' + token };
  console.log('User auth success, testing filters...\n');

  // Test 1: No filter
  const r1 = await fetch('http://127.0.0.1:8090/api/collections/tasks/records', { headers: h });
  const d1 = await r1.json();
  console.log('Test 1 - No filter:', r1.status, d1.totalItems, 'tasks');

  // Test 2: Double-quoted filter 
  const filter2 = 'status != "done"';
  const r2 = await fetch('http://127.0.0.1:8090/api/collections/tasks/records?filter=' + encodeURIComponent(filter2), { headers: h });
  console.log('Test 2 - Double quotes:', r2.status, r2.ok ? (await r2.json()).totalItems + ' tasks' : await r2.text());

  // Test 3: Single-quoted filter
  const filter3 = "status != 'done'";
  const r3 = await fetch('http://127.0.0.1:8090/api/collections/tasks/records?filter=' + encodeURIComponent(filter3), { headers: h });
  console.log('Test 3 - Single quotes:', r3.status, r3.ok ? (await r3.json()).totalItems + ' tasks' : await r3.text());

  // Test 4: Project filter 
  const filter4 = "project = 'wduuzqkrq3mt89m'";
  const r4 = await fetch('http://127.0.0.1:8090/api/collections/tasks/records?filter=' + encodeURIComponent(filter4), { headers: h });
  console.log('Test 4 - Project filter:', r4.status, r4.ok ? (await r4.json()).totalItems + ' tasks' : await r4.text());

  // Test 5: Expand test
  const r5 = await fetch('http://127.0.0.1:8090/api/collections/tasks/records?expand=project,assignees', { headers: h });
  console.log('Test 5 - Expand:', r5.status, r5.ok ? (await r5.json()).totalItems + ' tasks' : await r5.text());

  // Test 6: Users list
  const r6 = await fetch('http://127.0.0.1:8090/api/collections/users/records', { headers: h });
  console.log('Test 6 - Users list:', r6.status, r6.ok ? (await r6.json()).totalItems + ' users' : await r6.text());
}

test().catch(console.error);
