const base = 'https://aworkremaster-production.up.railway.app';

async function main() {
  const auth = await fetch(base + '/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'admin@example.com', password: 'admin123' }),
  }).then(r => r.json());
  const headers = { Authorization: auth.token, 'Content-Type': 'application/json' };

  // Find and update Vibeforce client
  const clients = await fetch(base + '/api/collections/clients/records?filter=(name~"DigitalPulse")', { headers })
    .then(r => r.json());
  const client = clients.items[0];
  if (!client) { console.log('No DigitalPulse client found'); return; }
  console.log(`Client: ${client.id} | ${client.name} | stundenhonorar=${client.stundenhonorar}`);

  await fetch(base + '/api/collections/clients/records/' + client.id, {
    method: 'PATCH', headers,
    body: JSON.stringify({ stundenhonorar: 20 }),
  });
  console.log('Updated stundenhonorar to 20');

  // Find AWR project
  const projects = await fetch(base + '/api/collections/projects/records?filter=(key="AWR")', { headers })
    .then(r => r.json());
  const project = projects.items[0];
  if (!project) { console.log('No AWR project found'); return; }
  console.log(`Project: ${project.id} | ${project.name} | client=${project.client}`);

  if (project.client !== client.id) {
    await fetch(base + '/api/collections/projects/records/' + project.id, {
      method: 'PATCH', headers,
      body: JSON.stringify({ client: client.id }),
    });
    console.log('AWR assigned to DigitalPulse');
  } else {
    console.log('AWR already assigned to DigitalPulse');
  }
}
main();
