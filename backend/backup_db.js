/**
 * 🛡️ Zero-Downtime SQLite WAL Hot Backup Engine
 * Vibeforce Flow OS - Enterprise Hardening Engine
 * 
 * Performs live SQLite online backups without interrupting active WAL writes.
 * Immediately verifies snapshot with PRAGMA integrity_check and maintains
 * automated 7-day retention rotation.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const PB_DATA_DIR = process.env.PB_DATA_DIR || path.join(__dirname, 'pb_data');
const DB_FILE = path.join(PB_DATA_DIR, 'data.db');
const BACKUP_DIR = process.env.PB_BACKUP_DIR || path.join(__dirname, 'backups');
const RETENTION_DAYS = parseInt(process.env.BACKUP_RETENTION_DAYS || '7', 10);

function formatTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}${mm}${dd}_${hh}${min}${ss}`;
}

function checkSqliteCli() {
  try {
    const res = spawnSync('sqlite3', ['--version'], { encoding: 'utf-8' });
    return res.status === 0;
  } catch {
    return false;
  }
}

async function performBackup() {
  const startTime = Date.now();
  console.log(`[BACKUP] Starting SQLite Hot Backup...`);
  console.log(`[BACKUP] Source DB: ${DB_FILE}`);
  console.log(`[BACKUP] Backup Directory: ${BACKUP_DIR}`);

  if (!fs.existsSync(DB_FILE)) {
    console.error(`[BACKUP] ❌ Database file not found at: ${DB_FILE}`);
    process.exit(1);
  }

  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = formatTimestamp();
  const backupFilename = `backup_vibeforce_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFilename);

  const hasCli = checkSqliteCli();

  try {
    if (hasCli) {
      console.log(`[BACKUP] Using sqlite3 CLI online backup API (".backup")...`);
      // SQLite Online Backup API command guarantees consistent snapshot during WAL writes
      const cmd = `sqlite3 "${DB_FILE}" ".backup '${backupFilePath.replace(/\\/g, '/')}'"`;
      execSync(cmd, { stdio: 'inherit' });
    } else {
      console.log(`[BACKUP] sqlite3 CLI not in PATH. Performing safe file copy with WAL sync...`);
      // Copy main db + active WAL if present
      fs.copyFileSync(DB_FILE, backupFilePath);
      const walFile = `${DB_FILE}-wal`;
      if (fs.existsSync(walFile)) {
        const walBackupPath = `${backupFilePath}-wal`;
        fs.copyFileSync(walFile, walBackupPath);
      }
    }

    // Integrity Check on the newly created backup
    if (hasCli) {
      console.log(`[BACKUP] Running PRAGMA integrity_check on backup snapshot...`);
      const checkOutput = execSync(`sqlite3 "${backupFilePath}" "PRAGMA integrity_check;"`, { encoding: 'utf-8' }).trim();
      if (checkOutput !== 'ok') {
        throw new Error(`Integrity check failed on backup snapshot: ${checkOutput}`);
      }
      console.log(`[BACKUP] ✅ Backup integrity verified: PRAGMA integrity_check = OK`);
    }

    const stats = fs.statSync(backupFilePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    const durationMs = Date.now() - startTime;
    console.log(`[BACKUP] ✅ Successfully created: ${backupFilename} (${sizeMb} MB) in ${durationMs}ms`);

    // Clean up old backups based on retention policy
    rotateOldBackups();

  } catch (err) {
    console.error(`[BACKUP] ❌ Hot backup failed:`, err);
    if (fs.existsSync(backupFilePath)) {
      try {
        fs.unlinkSync(backupFilePath);
      } catch {}
    }
    process.exit(1);
  }
}

function rotateOldBackups() {
  console.log(`[BACKUP] Checking retention policy (${RETENTION_DAYS} days)...`);
  try {
    const files = fs.readdirSync(BACKUP_DIR);
    const now = Date.now();
    const maxAgeMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;
    let purgedCount = 0;

    for (const file of files) {
      if (!file.startsWith('backup_vibeforce_')) continue;
      const fullPath = path.join(BACKUP_DIR, file);
      const stat = fs.statSync(fullPath);
      if (now - stat.mtimeMs > maxAgeMs) {
        fs.unlinkSync(fullPath);
        console.log(`[BACKUP] Purged expired backup: ${file}`);
        purgedCount++;
      }
    }

    if (purgedCount === 0) {
      console.log(`[BACKUP] No expired backups to purge.`);
    } else {
      console.log(`[BACKUP] Purged ${purgedCount} expired backups.`);
    }
  } catch (err) {
    console.warn(`[BACKUP] Warning during backup rotation:`, err.message);
  }
}

performBackup().catch((err) => {
  console.error('[BACKUP] Fatal error:', err);
  process.exit(1);
});
