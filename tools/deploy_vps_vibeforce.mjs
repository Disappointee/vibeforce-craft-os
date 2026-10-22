import { execSync } from 'child_process';

const yamlContent = `http:
  routers:
    vibeforce-backend:
      rule: "Host(\`pb-vibeforce.46-225-178-235.sslip.io\`)"
      service: "vibeforce-backend"
      entryPoints:
        - "websecure"
      tls:
        certResolver: "letsencrypt"
  services:
    vibeforce-backend:
      loadBalancer:
        servers:
          - url: "http://vibeforce-backend:8080"
`;

// 1. Write dynamic traefik file on VPS
const b64 = Buffer.from(yamlContent).toString('base64');
execSync(`ssh -p 2222 -i C:\\Users\\kasan\\.ssh\\id_ed25519_hetzner root@46.225.178.235 "echo ${b64} | base64 -d > /opt/klicklaut/traefik/dynamic/vibeforce.yml"`, { stdio: 'inherit' });
console.log('✅ Wrote /opt/klicklaut/traefik/dynamic/vibeforce.yml');

// 2. Re-create vibeforce-backend cleanly on klicklaut_web network without messy labels
execSync(`ssh -p 2222 -i C:\\Users\\kasan\\.ssh\\id_ed25519_hetzner root@46.225.178.235 "docker rm -f vibeforce-backend && docker run -d --name vibeforce-backend --restart unless-stopped --network klicklaut_web -v /opt/vibeforce/pb_data:/pb/pb_data ghcr.io/muchobien/pocketbase:latest --http=0.0.0.0:8080"`, { stdio: 'inherit' });
console.log('✅ Started vibeforce-backend container');

// 3. Upsert superuser
const adminEmail = process.env.PB_ADMIN_EMAIL || '***REMOVED***';
const adminPassword = process.env.PB_ADMIN_PASSWORD;
if (!adminPassword) {
  console.error('❌ PB_ADMIN_PASSWORD not set — refusing to upsert superuser.');
  process.exit(1);
}
execSync(`ssh -p 2222 -i C:\\Users\\kasan\\.ssh\\id_ed25519_hetzner root@46.225.178.235 "docker exec vibeforce-backend /usr/local/bin/pocketbase superuser upsert ${adminEmail} ${adminPassword}"`, { stdio: 'inherit' });
console.log('✅ Upserted superuser ' + adminEmail);
