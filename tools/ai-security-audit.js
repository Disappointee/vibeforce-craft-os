const { execSync } = require('child_process');
const https = require('https');

const SYSTEM_PROMPT = `Du bist ein hochspezialisierter Security-Auditor für ein Web-Projekt mit folgendem Tech Stack:
- Frontend: Next.js 16.2 (App Router), Tailwind v4, TypeScript
- Backend: PocketBase
- Hosting: Docker / Hetzner

Deine Aufgabe ist es, den bereitgestellten GIT DIFF auf Sicherheitslücken, Architekturfehler und Richtlinienverstöße zu prüfen.

KRITISCHE REGELN:
1. PocketBase: NIE String-Interpolation in Filtern verwenden. Nur parametrisierte Queries wie pb.filter('field = {:param}', { param: value }).
2. Keine Secrets, API Keys oder Passwörter im Code (müssen in .env sein).
3. React/XSS: Keine ungefilterte Ausgabe von HTML (Vermeidung von dangerouslySetInnerHTML).
4. SSR Hydration: In Next.js auf korrekte SSR-Kompatibilität achten (z.B. TipTap Editor benötigt immediatelyRender: false).

Antworte IMMER im folgenden JSON-Format:
{
  "safe": true/false,
  "vulnerabilities": [
    {
      "file": "Pfad/zur/Datei",
      "severity": "CRITICAL" | "WARNING" | "INFO",
      "issue": "Beschreibung der Lücke",
      "fix": "Code-Beispiel wie es behoben wird"
    }
  ]
}`;

const PROVIDERS = {
  gemini: {
    defaultModel: 'gemini-2.5-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    label: 'Gemini',
    buildRequest(model, apiKey, diff) {
      return {
        hostname: 'generativelanguage.googleapis.com',
        port: 443,
        path: `/v1beta/models/${model}:generateContent`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: `System-Richtlinien:\n${SYSTEM_PROMPT}` },
                { text: `Hier ist der Git Diff zum Prüfen:\n\n${diff}` },
              ],
            },
          ],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      };
    },
    parseResponse(data) {
      return data.candidates[0].content.parts[0].text;
    },
  },

  deepseek: {
    defaultModel: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    label: 'DeepSeek',
    buildRequest(model, apiKey, diff) {
      return {
        hostname: 'api.deepseek.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: `Hier ist der Git Diff zum Prüfen:\n\n${diff}` },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
      };
    },
    parseResponse(data) {
      return data.choices[0].message.content;
    },
  },
};

function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned status ${res.statusCode}: ${body}`));
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
    req.on('error', reject);
    req.write(options.body);
    req.end();
  });
}

function parseAuditResult(rawText) {
  const jsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  return JSON.parse(jsonStr);
}

async function runAISecurityAudit() {
  console.log('🤖 Starte AI Delta Security Audit...');

  let diff = '';
  try {
    diff = execSync('git diff --cached', { encoding: 'utf-8', maxBuffer: 1024 * 1024 * 50 });
  } catch (e) {
    console.error('❌ Fehler beim Lesen des Git Diff:', e.message);
    process.exit(1);
  }

  if (!diff.trim()) {
    console.log('ℹ️  Keine Änderungen im Git-Staging zum Auditen vorhanden. Commit wird fortgesetzt.');
    process.exit(0);
  }

  const providerName = (process.env.AI_AUDIT_PROVIDER || 'gemini').toLowerCase();
  const provider = PROVIDERS[providerName];

  if (!provider) {
    console.warn(`⚠️  Unbekannter Provider "${providerName}". Unterstützt: ${Object.keys(PROVIDERS).join(', ')}`);
    console.warn('   AI-Audit wird übersprungen.');
    process.exit(0);
  }

  const apiKey = process.env[provider.apiKeyEnv];
  if (!apiKey) {
    console.warn(`⚠️  ${provider.apiKeyEnv} nicht in den Umgebungsvariablen gefunden.`);
    console.warn('   AI-Audit wird übersprungen. Setze den Key für vollen Schutz.');
    process.exit(0);
  }

  const model = process.env.AI_AUDIT_MODEL || provider.defaultModel;

  console.log(`📤 Sende Git-Diff an ${provider.label} (${model})...`);

  try {
    const requestOptions = provider.buildRequest(model, apiKey, diff);
    const data = await httpsRequest(requestOptions);
    const rawText = provider.parseResponse(data);
    const auditResult = parseAuditResult(rawText);

    if (!auditResult.safe) {
      console.error(`\n❌ AI AUDIT (${provider.label}) BLOCKIERTE DIESEN COMMIT:\n`);
      auditResult.vulnerabilities.forEach((v) => {
        console.error(`[${v.severity}] in ${v.file}:`);
        console.error(`Problem: ${v.issue}`);
        console.error(`Lösung:\n${v.fix}\n`);
      });
      process.exit(1);
    }

    console.log(`✅ AI Delta-Audit (${provider.label}) erfolgreich: Keine Sicherheitslücken gefunden.`);
    process.exit(0);
  } catch (error) {
    console.error(`⚠️  Fehler beim AI-Audit (${provider.label}, wird ignoriert):`, error.message);
    process.exit(0);
  }
}

runAISecurityAudit();
