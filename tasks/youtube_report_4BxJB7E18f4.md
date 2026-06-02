# Universal Video Analysis Report

## 1. Management Summary

Dieser Bericht fasst die Kernkonzepte eines Videos zusammen, das einen kostenlosen, KI-gestützten Content-Factory-Workflow beschreibt. Die zentrale Idee ist die Kombination von **Notebook LM** (Content-Generator), **Hermes** (Orchestrator), **Obsidian** (Gedächtnis) und **Hyperframes** (Video-Bearbeitung) zu einem automatisierten System. Der Workflow ist vollständig kostenlos, erfordert kein Coding und produziert aus einer Quelle verschiedene Content-Formate (Videos, Podcasts, Infografiken) mit einem Klick. Der **Memory-Loop** mit Obsidian stellt sicher, dass das System mit jeder Iteration smarter wird und personalisierte, nicht-generische Inhalte erstellt.

## 2. Kern-Erkenntnisse & Philosophien (Gewichtet)

| Konzept | Relevanz | Beschreibung |
|---------|----------|--------------|
| **Memory-Loop mit Obsidian** | 0.9 | Obsidian dient als persistentes Gedächtnis. Alle Inhalte werden gespeichert und bei neuer Content-Erstellung abgerufen. Der Loop: neues Wissen rein → neuer Content raus → System wird täglich smarter. |
| **Kostenlose KI-Content-Factory** | 0.9 | Kombination von Notebook LM, Hermes, Obsidian und Hyperframes ergibt eine vollständig kostenlose Content-Factory. Einmal eingerichtet, produziert sie automatisch verschiedene Formate aus einer Quelle. Spart Zeit und skaliert mit wachsendem Wissen. |
| **Hyperframes zur Video-Erstellung** | 0.85 | Kostenloses Open-Source-Tool für Video-Schnitt und Avatar-Integration. Ermöglicht eine vollständige Content-Pipeline in Kombination mit Notebook LM und Hermes. |
| **Probleme von Notebook LM im Alleingang** | 0.8 | Notebook LM allein ist ineffizient: unorganisierte Notebooks, kein Gedächtnis, Tab-Hopping. Die Lösung ist ein System um das Tool herum, nicht ein besseres Tool. |

## 3. Strukturierte Workflows & Abläufe

### Workflow 1: Notebook LM + Hermes Integration
- **Schritt 1:** Quellen in Notebook LM ablegen (Website, PDF, Google Doc, Audio).
- **Schritt 2:** Hermes über MCP mit Notebook LM verbinden.
- **Schritt 3:** Hermes anweisen, einen bestimmten Content-Typ zu erstellen (z.B. Podcast, Video).
- **Schritt 4:** Hermes nutzt Hyperframes zur Bearbeitung und fügt ggf. Avatar hinzu.
- **Schritt 5:** Ergebnisse in Obsidian speichern, um Gedächtnis aufzubauen.
- **Schritt 6:** Wiederholen – neues Wissen fließt ein, Agent wird smarter.

**Regeln:**
- Nutze Notebook LM als primären Content-Generator.
- Verbinde Hermes über MCP.
- Integriere Obsidian als Wissensdatenbank.
- Verwende Hyperframes für Video.
- Setze auf kostenlose Modelle.

### Workflow 2: Memory-Loop mit Obsidian
- **Schritt 1:** Richte Obsidian als zentrale Wissensdatenbank ein.
- **Schritt 2:** Verbinde Obsidian mit Hermes.
- **Schritt 3:** Bei neuer Content-Erstellung zieht Hermes relevante Informationen aus Obsidian.
- **Schritt 4:** Neuer Content wird automatisch in Obsidian gespeichert.
- **Schritt 5:** Wiederhole den Prozess – System wird mit jeder Iteration besser.

**Regeln:**
- Speichere alle erstellten Inhalte und Metadaten in Obsidian.
- Stelle sicher, dass Hermes und Notebook LM auf Obsidian zugreifen können.
- Nutze den Memory-Loop, um Content kontinuierlich zu verbessern.
- Vermeide generischen KI-Content.

### Workflow 3: Hyperframes zur Video-Erstellung
- **Schritt 1:** Hyperframes von GitHub herunterladen und in Hermes installieren.
- **Schritt 2:** Notebook LM erstellt Video-Rohmaterial (z.B. Skript, Audiospur).
- **Schritt 3:** Hermes ruft Hyperframes auf, um das Video zu schneiden und Avatar hinzuzufügen.
- **Schritt 4:** Fertiges Video in Obsidian speichern.

**Regeln:**
- Installiere Hyperframes von GitHub in Hermes.
- Nutze Hyperframes für Video-Schnitt und Avatar-Integration.
- Kombiniere mit Notebook LM.
- Verwende kostenlose Modelle.

### Workflow 4: Kostenlose KI-Content-Factory – Aufbau
- **Schritt 1:** Notebook LM mit Quellen füttern.
- **Schritt 2:** Hermes via MCP mit Notebook LM verbinden.
- **Schritt 3:** Obsidian als Gedächtnis anbinden.
- **Schritt 4:** Hyperframes in Hermes installieren.
- **Schritt 5:** Dashboard von Hermes erstellen lassen.
- **Schritt 6:** Content-Produktion per Sprachbefehl starten.
- **Schritt 7:** Ergebnisse automatisch in Obsidian speichern.

**Regeln:**
- Nutze ausschließlich kostenlose Tools.
- Richte das System einmal ein und lasse es automatisch laufen.
- Verwende den Memory-Loop zur Qualitätssteigerung.
- Setze auf ein Dashboard zur zentralen Steuerung.

## 4. Konkrete Handlungsanweisungen & Skills

### Aktion 1: Notebook LM als Content-Generator nutzen
- **Auslöser:** Wenn eine Quelle (PDF, Website, Audio) vorliegt, aus der Content erstellt werden soll.
- **Anleitung:**
  1. Lege die Quelle in Notebook LM ab.
  2. Wähle den gewünschten Content-Typ aus.
  3. Starte die Generierung.

### Aktion 2: Hermes über MCP mit Notebook LM verbinden
- **Auslöser:** Wenn Notebook LM eingerichtet ist und Hermes als Orchestrator verwendet werden soll.
- **Anleitung:**
  1. Installiere den MCP-Connector in Hermes.
  2. Konfiguriere die Verbindung zu Notebook LM.
  3. Teste die Verbindung mit einem einfachen Befehl.

### Aktion 3: Obsidian als Gedächtnis einrichten
- **Auslöser:** Wenn ein persistentes Gedächtnis für den KI-Workflow benötigt wird.
- **Anleitung:**
  1. Erstelle einen Obsidian-Vault.
  2. Installiere ein Plugin oder richte eine API für die Verbindung zu Hermes ein.
  3. Definiere die Ordnerstruktur für Inhalte, Case Studies, Tools und Projekte.

### Aktion 4: Hyperframes in Hermes installieren
- **Auslöser:** Wenn Video-Erstellung und -Bearbeitung im Workflow benötigt wird.
- **Anleitung:**
  1. Lade Hyperframes von GitHub herunter.
  2. Integriere es in Hermes gemäß der Dokumentation.
  3. Teste die Funktion mit einem einfachen Video-Skript.

### Aktion 5: Dashboard von Hermes erstellen lassen
- **Auslöser:** Wenn eine zentrale Steuerung aller Notebooks und Inhalte gewünscht wird.
- **Anleitung:**
  1. Gib Hermes den Befehl, ein Dashboard zu erstellen.
  2. Definiere die anzuzeigenden Elemente (Notebooks, Content-Typen, Status).
  3. Passe das Dashboard bei Bedarf an.