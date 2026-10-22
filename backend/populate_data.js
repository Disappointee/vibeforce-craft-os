const email = "admin@vibeforce-flow.de";
const password = process.env.PB_ADMIN_PASSWORD;
const baseUrl = "http://127.0.0.1:8090";

async function populateData() {
  // 1. Auth as user
  const authRes = await fetch(`${baseUrl}/api/collections/users/auth-with-password`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password: password })
  });
  const authData = await authRes.json();
  const token = authData.token;
  const userId = authData.record.id;
  const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };

  // 2. Create Project
  const projRes = await fetch(`${baseUrl}/api/collections/projects/records`, {
    method: "POST", headers,
    body: JSON.stringify({
      key: "KL",
      name: "Website Relaunch",
      status: "active",
      budget_hours: 100,
      members: [userId]
    })
  });
  const project = await projRes.json();
  console.log("Project created:", project.id);

  // 3. Create Tasks
  const tasks = [
    { title: "SEO Keyword Analyse", status: "todo", priority: "high", project: project.id, assignees: [userId] },
    { title: "UI/UX Design Mockups", status: "in_progress", priority: "acute", project: project.id, assignees: [userId] },
    { title: "Frontend Entwicklung", status: "todo", priority: "medium", project: project.id, assignees: [userId] }
  ];

  for (const t of tasks) {
    await fetch(`${baseUrl}/api/collections/tasks/records`, {
      method: "POST", headers,
      body: JSON.stringify(t)
    });
  }
  console.log("Tasks created.");
}

populateData().catch(console.error);
