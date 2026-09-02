/**
 * 🛡️ Automated SQLite Boot Healthcheck & Recovery Engine
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Runs on container/server startup:
 * 1. Executes PRAGMA quick_check; to detect corruption from sudden power-loss.
 * 2. Checks data.db-wal size and flushes oversized WAL files (>50 MB).
 * 3. In case of corruption, triggers automated .dump recovery pipeline.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const PB_DATA_DIR = process.env.PB_DATA_DIR || path.join(__dirname, 'pb_data');
const DB_FILE = path.join(PB_DATA_DIR, 'data.db');
const WAL_FILE = `${DB_FILE}-wal`;
const WAL_FLUSH_THRESHOLD_MB = 50;

function checkSqliteCli() {
  try {
    const res = spawnSync('sqlite3', ['--version'], { encoding: 'utf-8' });
    return res.status === 0;
  } catch {
    return false;
  }
}

async function runHealthcheck() {
  console.log(`[HEALTHCHECK] Running SQLite Boot Healthcheck...`);
  console.log(`[HEALTHCHECK] Target DB: ${DB_FILE}`);

  if (!fs.existsSync(DB_FILE)) {
    console.log(`[HEALTHCHECK] No database file found at ${DB_FILE}. (Fresh installation). OK.`);
    process.exit(0);
  }

  const hasCli = checkSqliteCli();

  // 1. Check WAL size and flush if bloated
  if (fs.existsSync(WAL_FILE)) {
    const walStat = fs.statSync(WAL_FILE);
    const walSizeMb = walStat.size / (1024 * 1024);
    console.log(`[HEALTHCHECK] Active WAL size: ${walSizeMb.toFixed(2)} MB`);

    if (walSizeMb > WAL_FLUSH_THRESHOLD_MB && hasCli) {
      console.warn(`[HEALTHCHECK] ⚠️ WAL exceeds ${WAL_FLUSH_THRESHOLD_MB} MB. Truncating checkpoint...`);
      try {
        execSync(`sqlite3 "${DB_FILE}" "PRAGMA wal_checkpoint(TRUNCATE);"`, { stdio: 'inherit' });
        console.log(`[HEALTHCHECK] ✅ WAL truncated successfully.`);
      } catch (checkpointErr) {
        console.error(`[HEALTHCHECK] Failed to truncate WAL:`, checkpointErr.message);
      }
    }
  }

  // 2. Perform Quick Check
  if (hasCli) {
    try {
      console.log(`[HEALTHCHECK] Running PRAGMA quick_check; ...`);
      const checkResult = execSync(`sqlite3 "${DB_FILE}" "PRAGMA quick_check;"`, { encoding: 'utf-8' }).trim();
      
      if (checkResult === 'ok') {
        console.log(`[HEALTHCHECK] ✅ SQLite Database is healthy (PRAGMA quick_check = ok).`);
        process.exit(0);
      } else {
        console.error(`[HEALTHCHECK] ❌ Corruption detected: ${checkResult}`);
        attemptRecovery();
      }
    } catch (err) {
      console.error(`[HEALTHCHECK] ❌ Quick check execution failed:`, err.message);
      attemptRecovery();
    }
  } else {
    console.log(`[HEALTHCHECK] sqlite3 CLI not available in environment. Basic file checks passed.`);
    process.exit(0);
  }
}

function attemptRecovery() {
  console.warn(`[HEALTHCHECK] ⚠️ Initiating automated SQLite .dump recovery...`);
  const timestamp = Date.now();
  const corruptBackup = `${DB_FILE}.corrupt_${timestamp}`;
  const recoveredDb = `${DB_FILE}.recovered_${timestamp}`;
  const sqlDump = path.join(PB_DATA_DIR, `recovery_dump_${timestamp}.sql`);

  try {
    console.log(`[HEALTHCHECK] Dumping readable tables to ${sqlDump}...`);
    execSync(`sqlite3 "${DB_FILE}" ".dump" > "${sqlDump}"`, { shell: true });

    console.log(`[HEALTHCHECK] Reconstructing recovered database at ${recoveredDb}...`);
    execSync(`sqlite3 "${recoveredDb}" < "${sqlDump}"`, { shell: true });

    const verifyRecovered = execSync(`sqlite3 "${recoveredDb}" "PRAGMA quick_check;"`, { encoding: 'utf-8' }).trim();
    if (verifyRecovered !== 'ok') {
      throw new Error(`Recovered database failed integrity check: ${verifyRecovered}`);
    }

    console.log(`[HEALTHCHECK] Moving corrupt file to ${corruptBackup}...`);
    fs.renameSync(DB_FILE, corruptBackup);
    if (fs.existsSync(WAL_FILE)) {
      fs.renameSync(WAL_FILE, `${WAL_FILE}.corrupt_${timestamp}`);
    }

    console.log(`[HEALTHCHECK] Activating recovered database...`);
    fs.renameSync(recoveredDb, DB_FILE);

    // Clean up temporary dump
    if (fs.existsSync(sqlDump)) {
      fs.unlinkSync(sqlDump);
    }

    console.log(`[HEALTHCHECK] ✅ Recovery successful. Database restored and active.`);
    process.exit(0);
  } catch (recoveryErr) {
    console.error(`[HEALTHCHECK] ❌ Automated recovery failed:`, recoveryErr);
    process.exit(1);
  }
}

runHealthcheck().catch((err) => {
  console.error('[HEALTHCHECK] Fatal error:', err);
  process.exit(1);
});
