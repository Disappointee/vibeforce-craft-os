const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const targetWorkspace = 'c:\\Users\\Robin\\Desktop\\AlphaExplorer\\K.I. Takeover\\Awork_Remaster';
const normalizedWorkspace = targetWorkspace.toLowerCase().replace(/\\/g, '/');

const START_DATE = new Date('2026-04-29T00:00:00+02:00').getTime();
const GAP_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours gap threshold

const events = [];

// Helper to normalize path separators
function normalizePath(p) {
    return p.toLowerCase().replace(/\\/g, '/');
}

// 1. Scan Workspace Filesystem
function scanFilesystem(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (file === 'node_modules' || file === '.git' || file === '.kilo' || file === '.next' || file === 'dist' || file === 'scratch' || file === 'tempmediaStorage' || file === '.vercel') {
            continue;
        }

        try {
            const stat = fs.statSync(filePath);
            if (stat.isDirectory()) {
                scanFilesystem(filePath);
            } else if (stat.isFile()) {
                const mtime = stat.mtime.getTime();
                if (mtime >= START_DATE) {
                    events.push({
                        timestamp: mtime,
                        type: 'File Change',
                        source: 'VS Code / Editor',
                        detail: `Modified: ${path.relative(targetWorkspace, filePath)}`
                    });
                }
            }
        } catch (e) {
            // Ignore access errors
        }
    }
}

console.log('1. Scanning workspace filesystem for file modifications...');
try {
    scanFilesystem(targetWorkspace);
} catch (err) {
    console.error('Error scanning filesystem:', err.message);
}

// 2. Query Git Log & Reflog
console.log('2. Querying Git logs...');
try {
    const gitLog = execSync('git log --all --pretty=format:"%ad|%s" --date=iso', { cwd: targetWorkspace, encoding: 'utf-8' });
    if (gitLog) {
        gitLog.split('\n').forEach(line => {
            if (line.trim()) {
                const parts = line.split('|');
                const dateStr = parts[0];
                const subject = parts.slice(1).join('|');
                const date = new Date(dateStr);
                if (!isNaN(date.getTime()) && date.getTime() >= START_DATE) {
                    events.push({
                        timestamp: date.getTime(),
                        type: 'Git Commit',
                        source: 'Git',
                        detail: `Commit: "${subject}"`
                    });
                }
            }
        });
    }
} catch (e) {
    console.log('Note: Git log could not be queried.');
}

console.log('3. Querying Git reflog...');
try {
    const gitReflog = execSync('git reflog --date=iso', { cwd: targetWorkspace, encoding: 'utf-8' });
    if (gitReflog) {
        gitReflog.split('\n').forEach(line => {
            if (line.trim()) {
                const match = line.match(/^([a-f0-9]+)\s+HEAD@\{([^}]+)\}:\s+(.*)$/);
                if (match) {
                    const dateStr = match[2].trim();
                    const action = match[3].trim();
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime()) && date.getTime() >= START_DATE) {
                        events.push({
                            timestamp: date.getTime(),
                            type: 'Git Reflog Action',
                            source: 'Git',
                            detail: `Reflog: ${action}`
                        });
                    }
                }
            }
        });
    }
} catch (e) {
    console.log('Note: Git reflog could not be queried.');
}

// 3. Scan Antigravity App Logs (Gemini Desktop)
console.log('4. Scanning Antigravity conversation logs...');
const antigravityDir = 'C:\\Users\\Robin\\.gemini\\antigravity\\brain';
try {
    if (fs.existsSync(antigravityDir)) {
        const dirs = fs.readdirSync(antigravityDir);
        for (const dirName of dirs) {
            const transcriptPath = path.join(antigravityDir, dirName, '.system_generated', 'logs', 'transcript.jsonl');
            if (fs.existsSync(transcriptPath)) {
                const content = fs.readFileSync(transcriptPath, 'utf8');
                
                // Heuristic: Check if this transcript relates to Awork_Remaster
                if (content.toLowerCase().includes('awork_remaster') || content.toLowerCase().includes('alphaexplorer') || content.toLowerCase().includes('k.i. takeover')) {
                    const lines = content.split('\n');
                    let firstPrompt = '';
                    
                    lines.forEach(line => {
                        if (!line.trim()) return;
                        try {
                            const step = JSON.parse(line);
                            if (step.created_at) {
                                const t = new Date(step.created_at).getTime();
                                if (t >= START_DATE) {
                                    if (step.type === 'USER_INPUT' && !firstPrompt) {
                                        firstPrompt = step.content.replace(/<[^>]*>/g, '').trim().substring(0, 100);
                                    }
                                    
                                    let detailMsg = '';
                                    if (step.type === 'USER_INPUT') {
                                        detailMsg = `Prompt: "${step.content.replace(/<[^>]*>/g, '').trim().substring(0, 80)}..."`;
                                    } else if (step.tool_calls && step.tool_calls.length > 0) {
                                        detailMsg = `Tool Call: ${step.tool_calls.map(tc => tc.name).join(', ')}`;
                                    } else {
                                        detailMsg = `Step: ${step.type} (${step.source})`;
                                    }

                                    events.push({
                                        timestamp: t,
                                        type: 'Antigravity Chat Step',
                                        source: 'Antigravity (Gemini App)',
                                        detail: detailMsg,
                                        convId: dirName
                                    });
                                }
                            }
                        } catch (err) {
                            // JSON parse error
                        }
                    });
                }
            }
        }
    }
} catch (err) {
    console.error('Error scanning Antigravity logs:', err.message);
}

// 4. Scan VS Code Extensions (Roo-Cline, Kilo-Code, Claude-Dev)
console.log('5. Scanning VS Code Agent histories (Roo-Cline, Kilo-Code, Claude-Dev)...');
const roamingDir = 'C:\\Users\\Robin\\AppData\\Roaming\\Code\\User\\globalStorage';
const agentExtensions = [
    { name: 'Roo-Cline', folder: 'rooveterinaryinc.roo-cline' },
    { name: 'Kilo-Code', folder: 'kilocode.kilo-code' },
    { name: 'Claude-Dev', folder: 'saoudrizwan.claude-dev' }
];

agentExtensions.forEach(ext => {
    const tasksPath = path.join(roamingDir, ext.folder, 'tasks');
    try {
        if (fs.existsSync(tasksPath)) {
            const taskDirs = fs.readdirSync(tasksPath);
            for (const taskDir of taskDirs) {
                const historyItemPath = path.join(tasksPath, taskDir, 'history_item.json');
                const uiMessagesPath = path.join(tasksPath, taskDir, 'ui_messages.json');
                
                if (fs.existsSync(historyItemPath)) {
                    try {
                        const historyItem = JSON.parse(fs.readFileSync(historyItemPath, 'utf8'));
                        
                        // Check if workspace matches this project
                        if (historyItem.workspace) {
                            const nWork = normalizePath(historyItem.workspace);
                            if (nWork.includes('awork_remaster') || nWork.includes('alphaexplorer') || nWork === normalizedWorkspace) {
                                let taskText = historyItem.task || '';
                                taskText = taskText.substring(0, 100);
                                
                                // Gather timestamps from ui_messages.json if available
                                if (fs.existsSync(uiMessagesPath)) {
                                    const messages = JSON.parse(fs.readFileSync(uiMessagesPath, 'utf8'));
                                    messages.forEach(msg => {
                                        if (msg.ts && msg.ts >= START_DATE) {
                                            events.push({
                                                timestamp: msg.ts,
                                                type: `${ext.name} Activity`,
                                                source: ext.name,
                                                detail: msg.type === 'ask' && msg.ask === 'followup' ? `Prompt Response/Ask` : `Step: ${msg.type}`,
                                                task: taskText,
                                                taskId: historyItem.id
                                            });
                                        }
                                    });
                                } else if (historyItem.ts && historyItem.ts >= START_DATE) {
                                    events.push({
                                        timestamp: historyItem.ts,
                                        type: `${ext.name} Task`,
                                        source: ext.name,
                                        detail: `Task Start: "${taskText}..."`,
                                        task: taskText,
                                        taskId: historyItem.id
                                    });
                                }
                            }
                        }
                    } catch (e) {
                        // Error parsing json
                    }
                }
            }
        }
    } catch (err) {
        // Folder doesn't exist or can't be read
    }
});

if (events.length === 0) {
    console.log('No events found.');
    process.exit(0);
}

// Sort all events chronologically
events.sort((a, b) => a.timestamp - b.timestamp);

// Cluster events into sessions using GAP_THRESHOLD_MS
const sessions = [];
let currentSession = {
    start: events[0].timestamp,
    end: events[0].timestamp,
    events: [events[0]]
};

for (let i = 1; i < events.length; i++) {
    const e = events[i];
    if (e.timestamp - currentSession.end <= GAP_THRESHOLD_MS) {
        currentSession.end = e.timestamp;
        currentSession.events.push(e);
    } else {
        sessions.push(currentSession);
        currentSession = {
            start: e.timestamp,
            end: e.timestamp,
            events: [e]
        };
    }
}
sessions.push(currentSession);

console.log(`\nFound ${events.length} total activity timestamps.`);
console.log(`Clustered into ${sessions.length} sessions (Gap threshold: 3 hours).\n`);

// Generate Markdown report
let md = `# Awork Remastered – Workspace Activity Audit Report\n\n`;
md += `> **Generiert am:** ${new Date().toLocaleString('de-DE')}  \n`;
md += `> **Zeitraum der Analyse:** ${new Date(events[0].timestamp).toLocaleString('de-DE')} bis ${new Date(events[events.length - 1].timestamp).toLocaleString('de-DE')}  \n`;
md += `> **Cluster-Schwellenwert:** 3 Stunden Inaktivität  \n\n`;

md += `## Zusammenfassung der Aktivitäts-Quellen\n\n`;
md += `Dieser Bericht rekonstruiert lückenlos alle aktiven Arbeitssitzungen durch Aggregation der folgenden Datenquellen:\n`;
md += `- **Dateisystem-Audits (VS Code):** Tatsächliche Schreibvorgänge an Code-Dateien im Workspace.\n`;
md += `- **Git Log & Reflog:** Commits und lokale Zweigoperationen (Checkouts, Merges, Resets).\n`;
md += `- **Antigravity Logs:** Prompts, Tool-Ausführungen und Antworten der Gemini-Desktopsitzungen.\n`;
md += `- **VS Code Agenten-Historie:** Prompts und Ausführungsschritte von Kilo Code (Roo-Cline) und Claude-Dev.\n\n`;

md += `## Chronologische Sitzungs-Rekonstruktion\n\n`;

sessions.forEach((s, index) => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    let durationMin = Math.round((s.end - s.start) / (60 * 1000));
    if (durationMin === 0) durationMin = 15; // Mindestdauer für Einzelevent

    const hours = Math.floor(durationMin / 60);
    const mins = durationMin % 60;
    
    // Aggregate activities in this session
    const counts = {};
    const filesTouched = new Set();
    const gitActions = [];
    const prompts = [];
    
    s.events.forEach(e => {
        counts[e.type] = (counts[e.type] || 0) + 1;
        if (e.type === 'File Change') {
            const match = e.detail.match(/Modified: (.*)$/);
            if (match) filesTouched.add(match[1]);
        } else if (e.type === 'Git Commit' || e.type === 'Git Reflog Action') {
            gitActions.push(e.detail);
        } else if (e.detail.startsWith('Prompt:')) {
            prompts.push(e.detail);
        } else if (e.task && !prompts.includes(`Roo-Cline: "${e.task}"`)) {
            prompts.push(`${e.source}: "${e.task}"`);
        }
    });

    const countsStr = Object.entries(counts).map(([type, count]) => `**${count}** x ${type}`).join(', ');

    md += `### Sitzung #${index + 1}: ${start.toLocaleDateString('de-DE')} (${start.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} – ${end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })})\n\n`;
    md += `- **Dauer:** **${hours} Std. ${mins} Min.**  \n`;
    md += `- **Aktivitäten:** ${countsStr || 'Keine Angabe'}  \n`;

    if (prompts.length > 0) {
        md += `- **Wichtige Prompts / Aufgaben:**\n`;
        const uniquePrompts = [...new Set(prompts)].slice(0, 5);
        uniquePrompts.forEach(p => {
            md += `  - ${p.replace(/\n/g, ' ')}\n`;
        });
    }

    if (filesTouched.size > 0) {
        md += `- **Geänderte Dateien (${filesTouched.size}):**\n`;
        const filesArray = Array.from(filesTouched).slice(0, 10);
        filesArray.forEach(f => {
            md += `  - \`${f}\`\n`;
        });
        if (filesTouched.size > 10) {
            md += `  - *und ${filesTouched.size - 10} weitere Dateien...*\n`;
        }
    }

    if (gitActions.length > 0) {
        md += `- **Git-Aktionen:**\n`;
        const uniqueGit = [...new Set(gitActions)].slice(0, 5);
        uniqueGit.forEach(g => {
            md += `  - ${g}\n`;
        });
    }

    md += `\n---\n\n`;
});

const reportPath = path.join(targetWorkspace, 'tasks', 'workspace_activity_audit.md');
fs.writeFileSync(reportPath, md, 'utf8');
console.log(`Saved detailed audit report to: ${reportPath}`);

// Also print summary to terminal
console.log('=== AUDIT SUMMARY ===');
sessions.forEach((s, idx) => {
    const start = new Date(s.start);
    const end = new Date(s.end);
    const durationMin = Math.max(15, Math.round((s.end - s.start) / (60 * 1000)));
    const h = Math.floor(durationMin / 60);
    const m = durationMin % 60;
    console.log(`Sitzung #${idx + 1}: ${start.toLocaleString('de-DE')} bis ${end.toLocaleTimeString('de-DE')} (${h}h ${m}m) - ${s.events.length} Events`);
});
