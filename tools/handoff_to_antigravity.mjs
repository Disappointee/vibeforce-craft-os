import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

function getArgs() {
  const args = process.argv.slice(2);
  const map = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].replace(/^--/, '');
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      map[key] = val;
    }
  }
  return map;
}

async function main() {
  const args = getArgs();
  const taskId = args.task || 'CURRENT_TASK';
  const notes = args.notes || 'Arbeiten abgeschlossen, bereit zur Validierung';

  console.log('='.repeat(65));
  console.log('⚡ KILO CODE (GLM 5.3 FLASH) -> ANTIGRAVITY HANDOFF PROTOCOL');
  console.log('='.repeat(65));
  console.log(`📌 Task-ID:       ${taskId}`);
  console.log(`📝 Notizen:       ${notes}`);
  console.log(`⏰ Zeitstempel:   ${new Date().toISOString()}`);

  // 1. Git Status & Diffs ermitteln
  let gitStatus = '';
  let gitDiff = '';
  let filesChanged = [];
  try {
    gitStatus = execSync('git status --porcelain', { cwd: projectRoot }).toString();
    gitDiff = execSync('git diff --stat', { cwd: projectRoot }).toString();
    filesChanged = gitStatus
      .split('\n')
      .map(line => line.trim().split(/\s+/)[1])
      .filter(Boolean);
  } catch (e) {
    console.warn('⚠️ Konnte Git-Status nicht ermitteln:', e.message);
  }

  console.log(`\n📂 Geänderte Dateien (${filesChanged.length}):`);
  filesChanged.forEach(f => console.log(`   • ${f}`));

  // 2. Submission Payload erstellen
  const submission = {
    taskId,
    workerModel: 'GLM-5.3-Flash',
    timestamp: new Date().toISOString(),
    status: 'READY_FOR_ANTIGRAVITY_REVIEW',
    notes,
    filesChanged,
    gitDiffSummary: gitDiff
  };

  const submissionPath = path.join(projectRoot, 'TASK_SUBMISSION.json');
  fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2), 'utf-8');

  // 3. Status in CURRENT_TASK.md aktualisieren
  const currentTaskPath = path.join(projectRoot, 'CURRENT_TASK.md');
  if (fs.existsSync(currentTaskPath)) {
    let content = fs.readFileSync(currentTaskPath, 'utf-8');
    content = content.replace(
      /\* \*\*Status:\*\* .*/,
      `* **Status:** \`AWAITING_ANTIGRAVITY_REVIEW\` *(Eingereicht um ${new Date().toLocaleTimeString('de-DE')})*`
    );
    fs.writeFileSync(currentTaskPath, content, 'utf-8');
  }

  console.log('\n' + '='.repeat(65));
  console.log('🎉 ERFOLGREICH AN ANTIGRAVITY ÜBERGEBEN!');
  console.log('='.repeat(65));
  console.log('👉 Status: AWAITING_ANTIGRAVITY_REVIEW');
  console.log('👉 Datei:  TASK_SUBMISSION.json aktualisiert.');
  console.log('\n⚠️  ANWEISUNG FÜR KILO CODE (GLM 5.3 FLASH):');
  console.log('    Pausiere jetzt deine Arbeit. Antigravity (Gemini) übernimmt');
  console.log('    die Validierung der neuralgischen Punkte (Qualitäts-Gate) und');
  console.log('    schreibt den nächsten Teilauftrag in CURRENT_TASK.md.');
  console.log('='.repeat(65) + '\n');
}

main().catch(err => {
  console.error('❌ Fehler beim Handoff:', err);
  process.exit(1);
});
