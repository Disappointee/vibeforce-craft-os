const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://vibeforce-flow-os.vercel.app';
const EMAIL = '***REMOVED***';
const PASSWORD = process.env.PB_ADMIN_PASSWORD;
const SNAPSHOTS_DIR = path.join(__dirname, 'snapshots');

if (!fs.existsSync(SNAPSHOTS_DIR)) {
  fs.mkdirSync(SNAPSHOTS_DIR, { recursive: true });
}

async function run() {
  console.log('Starte Playwright...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Set window viewport
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    console.log(`Navigiere zu ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { timeout: 20000, waitUntil: 'networkidle' });
  } catch (e) {
    console.error('FEHLER: Konnte keine Verbindung zum Vercel-Server aufbauen.', e);
    await browser.close();
    process.exit(1);
  }

  // 1. Login
  console.log('Führe Login aus...');
  await page.fill('#email', EMAIL);
  await page.fill('#password', PASSWORD);
  await page.click('button[type="submit"]');

  try {
    await page.waitForURL(`${BASE_URL}/`, { timeout: 20000 });
    console.log('Login erfolgreich!');
  } catch (e) {
    console.error('FEHLER beim Login. Stimmen die Credentials?', e);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'login_failed.png') });
    await browser.close();
    process.exit(1);
  }

  await page.waitForTimeout(3000); // Kurz warten für Animationen

  // 2. Standard-Seiten-Snapshots
  const routes = [
    { name: 'dashboard', path: '/' },
    { name: 'projects', path: '/projects' },
    { name: 'tasks', path: '/tasks' },
    { name: 'planner', path: '/planner' },
    { name: 'time_tracking', path: '/time' },
    { name: 'clients', path: '/clients' },
    { name: 'team', path: '/team' },
    { name: 'reports', path: '/reports' },
    { name: 'notifications', path: '/notifications' },
    { name: 'profile', path: '/profile' },
    { name: 'docs', path: '/docs' },
    { name: 'admin_users', path: '/admin/users' }
  ];

  for (const route of routes) {
    console.log(`Navigiere zu ${route.name} (${route.path})...`);
    try {
      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(3000);
      const screenshotPath = path.join(SNAPSHOTS_DIR, `${route.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`Snapshot gespeichert unter: ${screenshotPath}`);
    } catch (e) {
      console.error(`Fehler bei ${route.name}:`, e.message);
    }
  }

  // 3. Interaktionen und Dialoge dokumentieren
  console.log('Führe UI-Interaktionen aus für Dialoge und Menüs...');
  try {
    // Zurück zum Dashboard
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // -- A: Schnellaktionen öffnen
    console.log('Schnappschuss: Schnellaktionen Menü');
    await page.click('button[aria-label="Schnellaktionen öffnen"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'interaction_quick_actions.png') });

    // -- B: Dialog "Neue Aufgabe erstellen"
    console.log('Schnappschuss: Neue Aufgabe Dialog');
    await page.click('text="Neue Aufgabe erstellen"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'dialog_new_task.png') });
    await page.keyboard.press('Escape'); // Dialog schließen
    await page.waitForTimeout(500);

    // -- C: Dialog "Neues Projekt anlegen"
    console.log('Schnappschuss: Neues Projekt Dialog');
    await page.click('button[aria-label="Schnellaktionen öffnen"]');
    await page.waitForTimeout(500);
    await page.click('text="Neues Projekt anlegen"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'dialog_new_project.png') });
    await page.keyboard.press('Escape'); // Dialog schließen
    await page.waitForTimeout(500);

    // -- D: Dialog "Neuen Kunden anlegen"
    console.log('Schnappschuss: Neuen Kunden Dialog');
    await page.click('button[aria-label="Schnellaktionen öffnen"]');
    await page.waitForTimeout(500);
    await page.click('text="Neuen Kunden anlegen"');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'dialog_new_client.png') });
    await page.keyboard.press('Escape'); // Dialog schließen
    await page.waitForTimeout(500);

    // -- E: User Profil Menü dropdown
    console.log('Schnappschuss: User-Profil-Menü');
    await page.click('button[aria-haspopup="menu"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'interaction_user_menu.png') });
    await page.keyboard.press('Escape'); // Wieder schließen
    await page.waitForTimeout(500);

    // -- F: Sidebar einklappen
    console.log('Schnappschuss: Sidebar eingeklappt');
    const collapseBtn = 'button[aria-label="Sidebar einklappen"]';
    if (await page.locator(collapseBtn).count() > 0) {
      await page.click(collapseBtn);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'interaction_sidebar_collapsed.png') });
    }

    // -- G: TimerBar Dropdown "Aufgabe auswählen"
    console.log('Schnappschuss: TimerBar Dropdown');
    const taskSelector = 'button:has-text("Aufgabe auswählen")';
    if (await page.locator(taskSelector).count() > 0) {
      await page.click(taskSelector);
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(SNAPSHOTS_DIR, 'interaction_timerbar_dropdown.png') });
    }

  } catch (e) {
    console.error('Fehler bei Interaktionen:', e);
  }

  console.log('Alle Snapshots inklusive Interaktionen wurden erfolgreich abgelegt!');
  await browser.close();
}

run().catch(err => {
  console.error('Unerwarteter Fehler im Playwright-Skript:', err);
  process.exit(1);
});
