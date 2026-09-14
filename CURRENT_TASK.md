# CURRENT TASK — Worker Execution Contract (Kilo Code)

> **Rolle:** Dieser Task wird von **Kilo Code** umgesetzt und von **Antigravity (Gemini)** an den neuralgischen Qualitätspunkten geprüft und freigegeben.

---

## 📌 Aktueller Task: [PIPELINE-VERIFIKATION & HANDOFF-TEST]
* **Task-ID:** `TASK-TEST-HANDOFF-01`
* **Status:** `AWAITING_ANTIGRAVITY_REVIEW` *(Eingereicht via MCP um 16:53:32)*
* **Prüfstufe:** Antigravity Gemini Quality Gate

---

## 🎯 Ziel & Umfang
Verifikation der automatisierten Arbeitsbrücke zwischen Kilo Code und Antigravity.
Kilo Code soll:
1. Eine kurze Testbestätigung in `tools/pipeline_test.txt` schreiben.
2. Das Übergabeskript `tools/handoff_to_antigravity.mjs` ausführen (oder das MCP-Tool `validate_with_gemini` aufrufen).
3. Auf Antigravitys Bestätigung und den Folgeauftrag warten.

---

## 📂 Target Files (Ausschließlich diese Datei anlegen/bearbeiten)
* `tools/pipeline_test.txt`

---

## 📐 Vorgabe für Target File
Erstelle `tools/pipeline_test.txt` mit folgendem Inhalt:
```text
Kilo Code Handoff Pipeline Test: OK
Zeitstempel: [Aktuelle Uhrzeit]
Status: Bereit für Tandem-Arbeit mit Antigravity
```

---

## 🚫 Don'ts & Anti-Patterns für Kilo Code
* ❌ Keine anderen Dateien anfassen.
* ❌ Nicht das Repository durchsuchen.
* ❌ Nach der Übergabe sofort stoppen und auf Antigravity warten.

---

## ✅ Akzeptanzkriterien
1. [ ] Datei `tools/pipeline_test.txt` existiert mit dem geforderten Inhalt.
2. [ ] Übergabeskript `node tools/handoff_to_antigravity.mjs` wurde im Terminal ausgeführt.
3. [ ] Antigravity bestätigt den Empfang in `TASK_SUBMISSION.json`.

---

## 🚀 Übergabe-Befehl (Wenn fertig)
Führe nach dem Erstellen der Datei folgenden Befehl im Terminal aus:
```bash
node tools/handoff_to_antigravity.mjs --task TASK-TEST-HANDOFF-01 --notes "Pipeline Test erfolgreich abgeschlossen"
```
*(Alternativ: Rufe das MCP-Tool `validate_with_gemini` mit taskId="TASK-TEST-HANDOFF-01" auf)*

