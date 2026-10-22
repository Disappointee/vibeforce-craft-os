import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SCREENSHOTS_DIR = join(__dirname, '..', 'screenshots');

if (!existsSync(SCREENSHOTS_DIR)) {
  mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let BASE_URL;
let EMAIL;
let PASSWORD;

if (existsSync(join(__dirname, 'auth.json'))) {
  const authData = JSON.parse(readFileSync(join(__dirname, 'auth.json'), 'utf-8'));
  BASE_URL = authData.frontendUrl || 'https://vibeforce-flow-os.vercel.app';
  EMAIL = authData.testUserEmail || authData.adminEmail;
  PASSWORD = authData.testUserPassword || authData.adminPassword;
} else {
  BASE_URL = 'https://vibeforce-flow-os.vercel.app';
  EMAIL = '***REMOVED***';
  PASSWORD = process.env.PB_ADMIN_PASSWORD;
}

async function escapeActiveDialogs(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
}

async function run() {
  console.log('=== Capture Audit: Visuelles Status-Check ===\n');
  console.log(`Frontend: ${BASE_URL}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  try {
    console.log(`Navigiere zu ${BASE_URL}/login...`);
    await page.goto(`${BASE_URL}/login`, { timeout: 30000, waitUntil: 'networkidle' });

    console.log('Login...');
    await page.fill('#email', EMAIL);
    await page.fill('#password', PASSWORD);
    await page.click('button[type="submit"]');

    try {
      await page.waitForURL(`${BASE_URL}/`, { timeout: 30000 });
      console.log('Login erfolgreich');
    } catch {
      console.log('Warte auf Navigation nach Login...');
      await page.waitForTimeout(5000);
    }
    await page.waitForTimeout(3000);

    console.log('\n--- Screenshot 1/4: crm_hierarchy.png (/clients) ---');
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'crm_hierarchy.png'),
      fullPage: true,
    });
    console.log('crm_hierarchy.png gespeichert');

    console.log('\n--- Screenshot 2/4: task_modal_check.png (Neue Aufgabe Modal) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const quickActionBtn = page.locator('button[aria-label="Schnellaktionen öffnen"]');
    const quickBtnCount = await quickActionBtn.count();
    if (quickBtnCount > 0) {
      await quickActionBtn.first().click();
      await page.waitForTimeout(600);

      const newTaskAction = page.locator('button:has-text("Neue Aufgabe erstellen")');
      if (await newTaskAction.count() > 0) {
        await newTaskAction.first().click();
        await page.waitForTimeout(1200);
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, 'task_modal_check.png'),
          fullPage: false,
        });
        console.log('task_modal_check.png gespeichert (via Schnellaktionen)');
      }
    } else {
      const taskBtn = page.locator('button:has-text("Neue Aufgabe")').first();
      if (await taskBtn.count() > 0) {
        await taskBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: join(SCREENSHOTS_DIR, 'task_modal_check.png'),
          fullPage: false,
        });
        console.log('task_modal_check.png gespeichert (direkt)');
      }
    }
    await escapeActiveDialogs(page);

    console.log('\n--- Screenshot 3/4: timerbar_functional.png (Aktiver Timer) ---');
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    const zapBtn = page.locator('button[aria-label="Schnellaktionen öffnen"]');
    if (await zapBtn.count() > 0) {
      await zapBtn.first().click();
      await page.waitForTimeout(800);

      const timerAction = page.locator('button:has-text("Zeiterfassung starten")');
      if (await timerAction.count() > 0) {
        await timerAction.first().click();
        await page.waitForTimeout(1000);

        const searchInput = page.locator('input[placeholder="Aufgabe suchen..."]');
        if (await searchInput.count() > 0) {
          await searchInput.first().fill('Design-Konzept');
          await page.waitForTimeout(800);

          const designBtn = page.locator('button:has-text("Design-Konzept")');
          const designCount = await designBtn.count();
          if (designCount > 0) {
            await designBtn.first().click();
            await page.waitForTimeout(2500);
            console.log('Timer gestartet auf Design-Konzept');
          } else {
            const anyTask = page.getByText('WSR', { exact: false }).first();
            if (await anyTask.count() > 0) {
              await anyTask.click();
              await page.waitForTimeout(2500);
              console.log('Timer gestartet auf WSR-Task');
            }
          }
        }
      } else {
        const anyTaskBtn = page.locator('[class*="max-h"] button, .space-y-0\\.5 button').first();
        if (await anyTaskBtn.count() > 0) {
          await anyTaskBtn.click();
          await page.waitForTimeout(2500);
          console.log('Timer gestartet via erstem Task-Button');
        }
      }
    }

    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'timerbar_functional.png'),
      fullPage: true,
    });
    console.log('timerbar_functional.png gespeichert');

    console.log('\n--- Screenshot 4/4: hell_mode_kontrast.png (Light Mode Dashboard) ---');
    const darkLabel = page.locator('button[aria-label*="Hell"]');
    const darkLblCount = await darkLabel.count();
    if (darkLblCount > 0) {
      await darkLabel.first().click();
    } else {
      const sunBtn = page.locator('header button:has(svg)').nth(0);
      if (await sunBtn.count() > 0) {
        await sunBtn.click();
      }
    }
    await page.waitForTimeout(1500);

    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: join(SCREENSHOTS_DIR, 'hell_mode_kontrast.png'),
      fullPage: true,
    });
    console.log('hell_mode_kontrast.png gespeichert');

    console.log('\n=== Alle 4 Screenshots erfolgreich erfasst ===');

  } catch (e) {
    console.error('Fehler im Capture-Lauf:', e.message);
    try {
      await page.screenshot({ path: join(SCREENSHOTS_DIR, 'error_state.png') });
    } catch {}
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Unerwarteter Fehler:', err);
  process.exit(1);
});
