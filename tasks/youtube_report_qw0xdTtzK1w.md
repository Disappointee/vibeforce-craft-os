# Universal Video Analysis Report

## 1. Management Summary

Dieser Report fasst die Kernkonzepte und Workflows eines Videos zur KI-gestützten Lead-Generierung zusammen. Im Fokus steht ein System zur automatischen Optimierung von E-Mail-Kampagnen durch datengetriebene Experimente. Die zentralen Erkenntnisse sind:

- **Kontinuierliche Optimierung**: KI führt regelmäßig Experimente durch, um die Reply-Rate zu steigern (20.71 vs. 10.71 Replies pro 1.000).
- **Kontext vor Daten**: Umfassende Informationssammlung (Website, Voice Memo) ist die Basis.
- **Vollständiger TAM-Aufbau**: Alle relevanten Datenpunkte werden vorab erfasst.
- **Menschliche Kontrolle**: KI-Vorschläge erfordern Freigabe.

Der Workflow nutzt Tools wie Claude Code/Codex, SmartLead und verschiedene APIs. Ein wöchentlicher Automatisierungszyklus analysiert vergangene Leistungen und schlägt neue Kampagnen vor.

## 2. Kern-Erkenntnisse & Philosophien (Gewichtet)

| Relevanz | Konzept | Beschreibung |
|----------|---------|--------------|
| 1.0 | **Kontinuierliche, datengetriebene Optimierung** | Iterative Verbesserung durch KI-Experimente basierend auf historischen Daten. |
| 0.95 | **Kontext vor Daten** | Vollständige Informationssammlung (Website, Voice Memo) als Grundlage. |
| 0.9 | **TAM vollständig vorab aufbauen** | Einmalige Erfassung aller relevanten Datenpunkte potenzieller Zielunternehmen. |
| 0.85 | **Menschliche Kontrolle über KI-Vorschläge** | KI generiert Vorschläge, aber finale Freigabe durch Menschen. |

## 3. Strukturierte Workflows & Abläufe

### Workflow 1: KI-gestützte Lead-Generierung mit Auto-Optimierung

1. **Kontext erfassen**: Website scannen, Voice Memo aufnehmen, an KI übergeben.
2. **Onboarding-Dokumente generieren**: ICP, Case Studies, Value Proposition, Problem Statement.
3. **TAM aufbauen**: Zielunternehmen mit Datenpunkten anreichern (Demo-CTA, Pricing, Teamgröße).
4. **Experimente vorschlagen lassen**: KI analysiert TAM und Kontext, erstellt Kampagnenvorschläge.
5. **Kampagnen genehmigen und anpassen**: Mensch prüft und passt an.
6. **Automatischer Versand und Monitoring**: Reply-Raten tracken, erfolgreiche Muster verstärken.

**Guardrails**:
- CTA gesperrt
- E-Mail-Verifizierung (Million Verifier)
- Benutzerfreigabe erforderlich
- Lokale CSV-Speicherung

### Workflow 2: Wöchentlicher Automatisierungszyklus mit Codex

1. Listen und Kontext erstellen.
2. Experimente und Copywriting definieren.
3. Erste Charge in SmartLead/Instantly laden.
4. Wöchentliche Automatisierung (z.B. freitags) mit Codex: Leistungsanalyse und neue Vorschläge.
5. Vorschläge genehmigen.
6. Genehmigte Kampagnen mit aktualisierten Kontakten hochladen.
7. Zyklus wöchentlich wiederholen.

**Guardrails**:
- Codex/Cloud Code für Automatisierung
- CTA auf bestimmte Aktion gesperrt
- E-Mail-Verifizierung
- Lokale CSV-Speicherung

## 4. Konkrete Handlungsanweisungen & Skills

### Skill 1: Kontext erfassen (Website und Voice Memo)
- **Auslöser**: Zu Beginn eines neuen Lead-Gen-Projekts.
- **Anleitung**:
  - Website mit HTML-to-Text scannen.
  - Voice Memo mit Beschreibung des idealen Kunden aufnehmen.
  - Beides an KI übergeben.

### Skill 2: TAM-Daten sammeln und anreichern
- **Auslöser**: Nach Kontexterfassung.
- **Anleitung**:
  - Relevante Datenpunkte identifizieren (Sales-Motion, Pricing, Teamstruktur).
  - APIs nutzen (Rapid API, Apify, Prospeo, Blitz API, Clay).
  - Websites crawlen (HTML-to-Text).
  - Daten in CSV/JSON speichern.

### Skill 3: KI-Experimente vorschlagen lassen
- **Auslöser**: Wöchentlich nach Leistungsanalyse.
- **Anleitung**:
  - TAM und Kontext an KI übergeben.
  - Neue Kampagnenvarianten vorschlagen lassen.
  - Vorschläge auf Relevanz prüfen.

### Skill 4: Kampagnen genehmigen und anpassen
- **Auslöser**: Nach Erhalt der KI-Vorschläge.
- **Anleitung**:
  - Jeden Vorschlag auf Korrektheit prüfen.
  - Copywriting anpassen.
  - CTA sperren.
  - Kampagne freigeben.