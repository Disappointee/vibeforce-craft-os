import readline from 'readline';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

function sendResponse(id, result, error = null) {
  const msg = { jsonrpc: '2.0', id };
  if (error) {
    msg.error = error;
  } else {
    msg.result = result;
  }
  process.stdout.write(JSON.stringify(msg) + '\n');
}

function handleToolsList(id) {
  sendResponse(id, {
    tools: [
      {
        name: 'validate_with_gemini',
        description: 'Submits the current work package to the Antigravity Gemini Quality Gate for validation. Returns pass/fail status, code review, and the next instructions.',
        inputSchema: {
          type: 'object',
          properties: {
            taskId: {
              type: 'string',
              description: 'The ID of the task being completed (e.g. TASK-M007-01)'
            },
            notes: {
              type: 'string',
              description: 'Summary of the changes made and tests passed by GLM 5.3 Flash'
            },
            runFullBuild: {
              type: 'boolean',
              description: 'Whether to run a full Next.js build during validation (default: false for speed)'
            }
          },
          required: ['taskId', 'notes']
        }
      },
      {
        name: 'get_current_task_context',
        description: 'Reads the latest task specification, interfaces, and constraints from CURRENT_TASK.md compiled by Antigravity Gemini.',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ]
  });
}

function handleToolsCall(id, params) {
  const { name, arguments: args } = params;

  if (name === 'get_current_task_context') {
    const taskPath = path.join(projectRoot, 'CURRENT_TASK.md');
    if (fs.existsSync(taskPath)) {
      const content = fs.readFileSync(taskPath, 'utf-8');
      sendResponse(id, {
        content: [{ type: 'text', text: content }]
      });
    } else {
      sendResponse(id, {
        content: [{ type: 'text', text: 'CURRENT_TASK.md existiert noch nicht im Projekt-Root.' }]
      });
    }
    return;
  }

  if (name === 'validate_with_gemini') {
    const taskId = args.taskId || 'CURRENT_TASK';
    const notes = args.notes || 'Arbeiten abgeschlossen';

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
      // Ignoriert
    }

    const submission = {
      taskId,
      workerModel: 'GLM-5.3-Flash',
      timestamp: new Date().toISOString(),
      status: 'AWAITING_ANTIGRAVITY_REVIEW',
      notes,
      filesChanged,
      gitDiffSummary: gitDiff
    };

    const submissionPath = path.join(projectRoot, 'TASK_SUBMISSION.json');
    fs.writeFileSync(submissionPath, JSON.stringify(submission, null, 2), 'utf-8');

    // Update CURRENT_TASK.md Status
    const currentTaskPath = path.join(projectRoot, 'CURRENT_TASK.md');
    if (fs.existsSync(currentTaskPath)) {
      let content = fs.readFileSync(currentTaskPath, 'utf-8');
      content = content.replace(
        /\* \*\*Status:\*\* .*/,
        `* **Status:** \`AWAITING_ANTIGRAVITY_REVIEW\` *(Eingereicht via MCP um ${new Date().toLocaleTimeString('de-DE')})*`
      );
      fs.writeFileSync(currentTaskPath, content, 'utf-8');
    }

    const report = [
      `🛡️ ANTIGRAVITY GEMINI QUALITY GATE: Einreichung empfangen!`,
      `------------------------------------------------------------`,
      `📌 Task: ${taskId}`,
      `📂 Geänderte Dateien (${filesChanged.length}):`,
      ...filesChanged.map(f => `   • ${f}`),
      `------------------------------------------------------------`,
      `✅ Status: TASK_SUBMISSION.json registriert.`,
      `Antigravity (Gemini) übernimmt jetzt die Qualitätsprüfung der neuralgischen Punkte und aktualisiert CURRENT_TASK.md für deinen nächsten Schritt.`
    ].join('\n');

    sendResponse(id, {
      content: [{ type: 'text', text: report }]
    });
    return;
  }

  sendResponse(id, null, { code: -32601, message: `Tool ${name} nicht gefunden.` });
}

rl.on('line', line => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === 'initialize') {
      sendResponse(id, {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'antigravity-supervisor-mcp', version: '1.0.0' }
      });
    } else if (method === 'notifications/initialized') {
      // No response needed
    } else if (method === 'tools/list') {
      handleToolsList(id);
    } else if (method === 'tools/call') {
      handleToolsCall(id, params);
    } else if (method === 'ping') {
      sendResponse(id, {});
    } else {
      sendResponse(id, null, { code: -32601, message: `Methode ${method} nicht unterstützt.` });
    }
  } catch (err) {
    // JSON Parse error
  }
});
