import net from 'net';

const host = '46.225.178.235';
const ports = [22, 2222, 80, 443, 8080, 8081, 9443];

function checkPort(port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2500);
    
    socket.on('connect', () => {
      socket.destroy();
      resolve({ port, status: 'OPEN' });
    });

    socket.on('timeout', () => {
      socket.destroy();
      resolve({ port, status: 'TIMEOUT' });
    });

    socket.on('error', (err) => {
      resolve({ port, status: `ERROR: ${err.message}` });
    });

    socket.connect(port, host);
  });
}

async function main() {
  console.log(`Scanning ports on ${host}...`);
  for (const p of ports) {
    const res = await checkPort(p);
    console.log(`Port ${p}: ${res.status}`);
  }
}

main().catch(console.error);
