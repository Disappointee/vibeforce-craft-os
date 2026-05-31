async function setup() {
  const email = "***REMOVED***";
  const password = "***REMOVED***";
  const baseUrl = "http://127.0.0.1:8090";

  let authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  if (!authRes.ok) { console.error("Auth failed"); return; }
  let token = (await authRes.json()).token;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // Fetch users ID
  let usersRes = await fetch(`${baseUrl}/api/collections/users`, { headers });
  let usersId = (await usersRes.json()).id;

  // 2. Create projects collection
  const projectsCol = {
    name: "projects", type: "base",
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.role = 'admin'", updateRule: "@request.auth.role = 'admin'", deleteRule: "@request.auth.role = 'admin'",
    fields: [
        { name: "key", type: "text", required: true, unique: true },
        { name: "name", type: "text", required: true },
        { name: "description", type: "editor" },
        { name: "status", type: "select", maxSelect: 1, values: ["active", "archived", "completed"] },
        { name: "budget_hours", type: "number" },
        { name: "budget_money", type: "number" },
        { name: "members", type: "relation", collectionId: usersId, cascadeDelete: false, maxSelect: null }
    ]
  };
  let projRes = await fetch(`${baseUrl}/api/collections`, { method: "POST", headers, body: JSON.stringify(projectsCol) });
  console.log("Projects created:", projRes.ok ? "Success" : await projRes.text());

  // Wait briefly
  await new Promise(r => setTimeout(r, 200));

  // Fetch projects id
  let projList = await fetch(`${baseUrl}/api/collections/projects`, { headers });
  let projId = (await projList.json()).id;

  // 3. Create tasks collection
  const tasksCol = {
    name: "tasks", type: "base",
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { name: "project", type: "relation", required: true, collectionId: projId, cascadeDelete: true, maxSelect: 1 },
      { name: "title", type: "text", required: true },
      { name: "description", type: "editor" },
      { name: "status", type: "select", required: true, maxSelect: 1, values: ["todo", "in_progress", "review", "done"] },
      { name: "priority", type: "select", required: true, maxSelect: 1, values: ["acute", "high", "medium", "low"] },
      { name: "assignees", type: "relation", collectionId: usersId, cascadeDelete: false, maxSelect: null },
      { name: "start_date", type: "date" },
      { name: "due_date", type: "date" }
    ]
  };
  let tasksRes = await fetch(`${baseUrl}/api/collections`, { method: "POST", headers, body: JSON.stringify(tasksCol) });
  console.log("Tasks created:", tasksRes.ok ? "Success" : await tasksRes.text());
  
  await new Promise(r => setTimeout(r, 200));
  let taskList = await fetch(`${baseUrl}/api/collections/tasks`, { headers });
  let taskData = await taskList.json();
  let taskId = taskData.id;

  // Update tasks parent_task relation now
  taskData.fields.push({ name: "parent_task", type: "relation", collectionId: taskId, cascadeDelete: true, maxSelect: 1 });
  await fetch(`${baseUrl}/api/collections/tasks`, { method: "PATCH", headers, body: JSON.stringify(taskData) });

  // 4. Create time_entries collection
  const timeEntriesCol = {
    name: "time_entries", type: "base",
    listRule: "@request.auth.id != ''", viewRule: "@request.auth.id != ''",
    createRule: "@request.auth.id != ''", updateRule: "@request.auth.id != ''", deleteRule: "@request.auth.role = 'admin'",
    fields: [
      { name: "task", type: "relation", required: true, collectionId: taskId, cascadeDelete: true, maxSelect: 1 },
      { name: "user", type: "relation", required: true, collectionId: usersId, cascadeDelete: true, maxSelect: 1 },
      { name: "start_time", type: "date", required: true },
      { name: "end_time", type: "date" },
      { name: "duration_minutes", type: "number" },
      { name: "is_billable", type: "bool" }
    ]
  };
  let timeRes = await fetch(`${baseUrl}/api/collections`, { method: "POST", headers, body: JSON.stringify(timeEntriesCol) });
  console.log("Time entries created:", timeRes.ok ? "Success" : await timeRes.text());
}

setup().catch(console.error);
