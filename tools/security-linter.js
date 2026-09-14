const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🛡️  Starte Vibeforce Security Linter...');

// 1. Hole alle im Git gestageten Dateien
let files = [];
try {
  const output = execSync('git diff --cached --name-only --diff-filter=d', { encoding: 'utf-8' });
  files = output
    .split('\n')
    .map(line => line.trim())
    .filter(f => f && !f.includes('tools') && !f.includes('.kilo') && (f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js') || f.endsWith('.jsx')));
} catch (e) {
  console.log('⚠️  Kein Git-Repository gefunden oder keine gestageten Dateien. Überspringe Git-Diff Scans.');
}

// Fallback: Wenn keine gestageten Dateien vorhanden sind (z.B. bei manuellem Aufruf), 
// scrolle durch src/ Verzeichnis, falls als Argument "--all" übergeben wird.
if (files.length === 0 && process.argv.includes('--all')) {
  console.log('🔍 Scanne das gesamte frontend/src/ Verzeichnis...');
  const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat && stat.isDirectory()) {
        if (!fullPath.includes('node_modules') && !fullPath.includes('.next')) {
          results = results.concat(walk(fullPath));
        }
      } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
        results.push(fullPath);
      }
    });
    return results;
  };

  const frontendSrc = path.join(__dirname, '../frontend/src');
  if (fs.existsSync(frontendSrc)) {
    files = walk(frontendSrc);
  }
}

if (files.length === 0) {
  console.log('ℹ️  Keine geänderten TypeScript/JavaScript Dateien zum Scannen gefunden.');
  process.exit(0);
}

console.log(`🔎 Scanne ${files.length} Datei(en)...`);

let hasErrors = false;

files.forEach(file => {
  const absolutePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) return;

  const content = fs.readFileSync(absolutePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(process.cwd(), absolutePath);

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Überspringe Kommentare
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      return;
    }

    // Regel 1: PocketBase Filter Check (Template Literals mit ${ })
    // Findet z.B. pb.filter(`... ${someVar} ...`) oder filter: `... ${someVar} ...`
    if ((trimmed.includes('pb.filter') || trimmed.includes('filter:')) && trimmed.includes('${')) {
      console.error(`❌ CRITICAL SECURITY ERROR in [${relPath}:${lineNum}]:`);
      console.error(`   String-Interpolation (Template Literals) in PocketBase-Filter entdeckt!`);
      console.error(`   Verwende stattdessen: pb.filter('field = {:param}', { param: value })`);
      console.error(`   Gefundener Code: "${trimmed}"\n`);
      hasErrors = true;
    }

    // Regel 2: PocketBase Filter Check (String Konkatenation mit +)
    // Findet z.B. filter: "id = " + someVar oder pb.filter('id = ' + someVar)
    if (trimmed.includes('pb.filter') || trimmed.includes('filter:')) {
      if (trimmed.includes('+')) {
        // Überprüfe, ob das '+' Zeichen zur String-Konkatenation im Filter verwendet wird
        if (/filter\s*:\s*['"][^'"]*'\s*\+|\+.*['"]|pb\.filter\(\s*['"][^'"]*['"]\s*\+/.test(trimmed)) {
          console.error(`❌ CRITICAL SECURITY ERROR in [${relPath}:${lineNum}]:`);
          console.error(`   String-Konkatenation in PocketBase-Filter entdeckt!`);
          console.error(`   Verwende stattdessen: pb.filter('field = {:param}', { param: value })`);
          console.error(`   Gefundener Code: "${trimmed}"\n`);
          hasErrors = true;
        }
      }
    }

    // Regel 3: React dangerouslySetInnerHTML Check
    if (trimmed.includes('dangerouslySetInnerHTML')) {
      console.warn(`⚠️  SECURITY WARNING in [${relPath}:${lineNum}]:`);
      console.warn(`   dangerouslySetInnerHTML verwendet! Stelle sicher, dass die Daten sanitisiert sind.`);
      console.warn(`   Gefundener Code: "${trimmed}"\n`);
    }
  });
});

if (hasErrors) {
  console.log('❌ Security-Check FEHLGESCHLAGEN. Bitte beheben Sie die oben genannten Probleme!');
  process.exit(1);
} else {
  console.log('✅ Vibeforce Security Linter: Keine kritischen Fehler gefunden.');
  process.exit(0);
}
