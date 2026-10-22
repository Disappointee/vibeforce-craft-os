import { chromium } from 'playwright';

(async () => {
  console.log('Starte Playwright End-to-End Login-Test auf vibeforce-flow-os.vercel.app...');
  
  // Echter Browser-Modus, keine Security-Bypasses!
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();
  
  try {
    // Fange API Responses ab
    page.on('response', async response => {
      if (response.url().includes('/api/auth/login')) {
        console.log(`\n--- API RESPONSE [${response.status()}] ---`);
        try {
          const body = await response.text();
          console.log(body);
        } catch (e) {
          console.log('Konnte Body nicht lesen');
        }
        console.log('------------------------------\n');
      }
    });

    // 1. Gehe zur Login-Seite
    console.log('Navigiere zu https://vibeforce-flow-os.vercel.app/login ...');
    await page.goto('https://vibeforce-flow-os.vercel.app/login', { waitUntil: 'networkidle' });
    
    // 2. Fülle Credentials aus
    console.log('Gebe Daniel-Credentials ein...');
    await page.fill('input[type="email"]', 'daniel@vibeforcetest.de');
    await page.fill('input[type="password"]', process.env.DEMO_DANIEL_PASSWORD);
    
    // 3. Klicke Login
    console.log('Klicke Login-Button...');
    await page.click('button[type="submit"]');
    
    // Warte kurz, um dem Request Zeit zu geben
    await page.waitForTimeout(4000);
    
    // Screenshot zur Analyse
    await page.screenshot({ path: 'tools/login_debug.png' });
    console.log('Screenshot gespeichert: tools/login_debug.png');
    
    // 4. Prüfen was passiert ist
    const currentUrl = page.url();
    console.log('Aktuelle URL nach Login:', currentUrl);
    
    if (currentUrl === 'https://vibeforce-flow-os.vercel.app/') {
      console.log('✅ LOGIN ERFOLGREICH! (Weiterleitung zum Dashboard)');
      process.exit(0);
    } else {
      console.error('❌ LOGIN FEHLGESCHLAGEN. Keine Weiterleitung.');
      
      // Fehler auf der Seite suchen
      const bodyText = await page.textContent('body');
      console.log('--- SEITENINHALT AUSZUG ---');
      // Gebe nur die ersten 500 Zeichen aus, die Fehlerwoerter enthalten
      if (bodyText.toLowerCase().includes('fehler') || bodyText.toLowerCase().includes('invalid') || bodyText.toLowerCase().includes('failed')) {
        console.log('Möglicher Fehlertext gefunden!');
      } else {
        console.log('Keine offensichtlichen Fehler-Keywords gefunden.');
      }
      process.exit(1);
    }
    
  } catch (err) {
    console.error('❌ FEHLER BEIM TEST:', err.message);
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
