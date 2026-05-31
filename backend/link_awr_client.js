const email = "***REMOVED***";
const password = "***REMOVED***";
const baseUrl = "https://aworkremaster-production.up.railway.app";

(async () => {
    const loginRes = await fetch(baseUrl + "/api/collections/users/auth-with-password", {
        method: "POST", headers: {"Content-Type": "application/json"},
        body: JSON.stringify({identity: email, password})
    });
    const auth = await loginRes.json();
    const headers = {Authorization: auth.token, "Content-Type": "application/json"};
    
    const projRes = await fetch(baseUrl + "/api/collections/projects/records?filter=(key='AWR')", {headers});
    const projs = await projRes.json();
    const proj = projs.items[0];
    console.log("Project:", proj.name, "client:", proj.client || "NONE");
    
    const cliRes = await fetch(baseUrl + "/api/collections/clients/records?filter=(name='Awork Remaster')", {headers});
    const clis = await cliRes.json();
    const cli = clis.items[0];
    console.log("Client:", cli.name, "id:", cli.id, "rate:", cli.stundenhonorar);
    
    if (!proj.client || proj.client !== cli.id) {
        const update = await fetch(baseUrl + "/api/collections/projects/records/" + proj.id, {
            method: "PATCH", headers,
            body: JSON.stringify({client: cli.id})
        });
        console.log("Link status:", update.status);
    } else {
        console.log("Already linked.");
    }
})().catch(e => console.error(e));
