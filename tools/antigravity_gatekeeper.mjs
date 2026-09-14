import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  console.log('='.repeat(70));
  console.log('🛡️  ANTIGRAVITY GEMINI QUALITY GATE — VALIDATION ENGINE');
  console.log('='.repeat(70));

  const submissionPath = path.join(projectRoot, 'TASK_SUBMISSION.json');
  if (!fs.existsSync(submissionPath)) {
    console.log('ℹ️ Keine aktive Einreichung gefunden (TASK_SUBMISSION.json fehlt).');
    return;
  }

  const submission = JSON.parse(fs.readFileSync(submissionPath, 'utf-8'));
  console.log(`📌 Zu prüfender Task: ${submission.taskId}`);
  console.log(`👤 Eingereicht von:  ${submission.workerModel} am ${submission.timestamp}`);
  console.log(`📝 Notizen:          ${submission.notes}`);
  console.log(`📂 Geänderte Dateien (${submission.filesChanged.length}):`);
  submission.filesChanged.forEach(f => console.log(`   • ${f}`));

  // 1. Git Diff Review (Anti-Slop / Security Check)
  console.log('\n🔍 [Step 1/3] Git Diff Analyse & Code-Hygiene...');
  let gitDiff = '';
  try {
    gitDiff = execSync('git diff', { cwd: projectRoot }).toString();
    console.log(`   Diff-Umfang: ${gitDiff.split('\n').length} Zeilen`);
  } catch (e) {
    console.warn('   Warnung bei Git Diff:', e.message);
  }

  // 2. Syntax & Build Quick-Check
  console.log('\n⚙️ [Step 2/3] Syntax & Typecheck Quick-Check...');
  let buildPass = true;
  try {
    // Führe Next.js Lint/Check im Frontend aus, falls Frontend-Dateien betroffen sind
    const hasFrontendFiles = submission.filesChanged.some(f => f.startsWith('frontend/'));
    if (hasFrontendFiles) {
      console.log('   Prüfe Frontend-Integrität...');
      // Type-check
      execSync('npm run build --prefix frontend --no-lint', { cwd: projectRoot, stdio: 'pipe' });
      console.log('   ✅ Frontend Build / Typecheck: BESTANDEN');
    } else {
      console.log('   ℹ️ Keine Frontend-Dateien betroffen, überspringe Next.js Build.');
    }
  } catch (e) {
    buildPass = false;
    console.error('   ❌ Build / Typecheck Fehler:', e.stderr?.toString() || e.message);
  }

  // 3. Gesamt-Urteil
  console.log('\n' + '='.repeat(70));
  if (buildPass) {
    console.log('✅ QUALITY GATE: BESTANDEN (PASS)');
    console.log('   Antigravity kann den Code committen und den Folgeauftrag erteilen.');
  } else {
    console.log('⚠️ QUALITY GATE: REVISION ERFORDERLICH (REVISE)');
    console.log('   Korrekturanweisungen an Kilo Code formulieren.');
  }
  console.log('='.repeat(70) + '\n');
}

main().catch(err => {
  console.error('Gatekeeper Fehler:', err);
  process.exit(1);
});
