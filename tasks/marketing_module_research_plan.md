# Marketing-Modul: Forschungs- & Ausarbeitungsplan

> Stand: 2026-06-02 | Basierend auf 3 YouTube-Analysen (Content Factory, CSS Subgrid, Lead-Generierung)

---

## Übersicht der 4 Konzepte

| # | Name | Scope | Kern-Fokus |
|---|------|-------|------------|
| 1 | **VibeMarketer** | Full Pipeline | Content + Leads + Outreach + Analytics + Memory |
| 2 | **ContentForge** | Content-Only | AI-Content-Engine mit Wissensgraph |
| 3 | **LeadBloom** | Leads-Only | Lead-Intelligence, Scoring, Outreach |
| 4 | **FlowMarketer** | Modular OS | Plugin-System mit Shared Memory Layer |

---

## Forschungs-Kategorien (für alle 4 Konzepte)

Jedes Konzept muss durch folgende 7 Forschungs-Dimensionen:

1. **Technologie-Stack** – Sprache, Runtime, Storage, Frameworks
2. **KI/LLM-Integration** – Modelle, Prompt-Architektur, Kosten
3. **Externe APIs & Datenquellen** – Welche APIs? Kosten? Rate Limits?
4. **Datenmodell & Persistenz** – Schema, Vektordatenbank, Memory-Layer
5. **Architektur & Deployment** – Lokal vs. Cloud, Skalierung
6. **Sicherheit & Datenschutz** – API-Keys, DSGVO, lokale Daten
7. **MVP-Abgrenzung** – Was ist Phase 1? Was kommt später?

---

## 1. VibeMarketer – KI-Marketing-Autobahn

### Konzept
Lokale Desktop-App (CLI + optional Web-UI). Nimmt Unternehmen/Produkt/Nische > recherchiert selbstständig > baut TAM auf > erstellt personalisierte Content-Kampagnen > steuert Outreach > trackt Replies > lernt aus Feedback. Obsidian-Vault als persistentes Gedächtnis.

### Was muss erforscht werden?

#### A) Technologie-Stack
- [ ] **Python vs. Node.js vs. Hybrid** – Python für KI/Scraping, Node für UI?
  - *Recherche:* Vergleich der Ökosysteme für LLM-Aufrufe, Web-Scraping, E-Mail-Versand
  - *Zu klären:* Einheitlicher Stack oder Polyglot mit IPC?
- [ ] **CLI-Framework** – Typer (Python) vs. Commander (Node) vs. Ink (React-CLI)?
  - *Recherche:* Beste DX für komplexe, mehrstufige CLI-Workflows
- [ ] **Optionale Web-UI** – FastAPI + HTMX vs. Next.js vs. Streamlit?
  - *Recherche:* Minimales Setup für Dashboard, das lokal läuft
- [ ] **Obsidian-Integration** – Direktes Markdown-Schreiben in Vault? Obsidian-API?
  - *Recherche:* Wie liest/schreibt man sicher in einen Obsidian-Vault? Gibt es Konflikte?
- [ ] **PDF-Generierung** – Puppeteer vs. WeasyPrint vs. Typst?
  - *Recherche:* Qualität, Geschwindigkeit, Docker-Abhängigkeiten

#### B) KI/LLM-Integration
- [ ] **Modell-Strategie** – Welches Modell für welche Aufgabe?
  - *Recherche:* DeepSeek vs. Gemini vs. lokales Modell (Ollama) für verschiedene Tasks
  - *Zu testen:* Content-Qualität, Geschwindigkeit, Kosten pro Task-Typ
- [ ] **Prompt-Architektur** – Wie strukturiert man Multi-Pass-Analyse?
  - *Recherche:* Chain-of-Thought, Tree-of-Thought, ReAct für Marketing-Workflows
  - *Design-Frage:* Wie granular sind die Prompts? Ein Mega-Prompt vs. viele kleine?
- [ ] **Token-Management** – Chunking-Strategie für lange Transkripte/Dokumente
  - *Recherche:* Optimale Chunk-Größe für Marketing-Content vs. technische Analyse
- [ ] **Cost-Tracking** – Wie misst und optimiert man API-Kosten?
  - *Recherche:* Tools für Token-Counting, Cost-Estimation, Budget-Limits

#### C) Externe APIs & Datenquellen
- [ ] **YouTube Transcript** – youtube-transcript-api (bereits genutzt). Stabilität?
  - *Recherche:* Gibt es Rate Limits? Alternativen?
- [ ] **LinkedIn-API / Scraping** – Für Lead-Recherche
  - *Recherche:* Offizielle API-Kosten, Proxycurl, Scraping-Legalität
  - *Kritisch:* DSGVO-Konformität bei automatisierter LinkedIn-Nutzung
- [ ] **Crunchbase / Unternehmensdaten** – API-Zugang?
  - *Recherche:* Kosten, Datenqualität, Alternativen (OpenCorporates, Kompass)
- [ ] **Website-Scraping** – Für Unternehmenswebsites
  - *Recherche:* Playwright vs. Firecrawl vs. Jina.ai Reader
  - *Zu klären:* Robots.txt-Respekt, Rate Limiting
- [ ] **E-Mail-Versand** – SMTP vs. SendGrid vs. Resend
  - *Recherche:* Zustellbarkeit, Kosten, API-Ergonomie
- [ ] **SmartLead / Instantly API** – Für Outreach-Automation
  - *Recherche:* API-Dokumentation, Limits, Kosten
  - *Frage:* Braucht man die überhaupt, oder reicht direkter SMTP?

#### D) Datenmodell & Persistenz
- [ ] **SQLite vs. PostgreSQL** – Lokal vs. Server-basiert
  - *Recherche:* Reicht SQLite für Tausende Leads? Wann braucht man Postgres?
- [ ] **Vektordatenbank** – ChromaDB vs. LanceDB vs. SQLite-vss
  - *Recherche:* Embedding-Dimension, Performance, keine externen Server
- [ ] **Schema-Design** – Leads, Kampagnen, Content-Stücke, Analytics-Events
  - *Design-Aufgabe:* ER-Diagramm für vollständige Marketing-Domain
- [ ] **Obsidian-Markdown-Format** – Wie strukturiert man Gedächtnis-Dateien?
  - *Recherche:* Best Practices für YAML-Frontmatter, Tags, Backlinks in Obsidian

#### E) Architektur & Deployment
- [ ] **Local-First vs. Hybrid** – Alles lokal oder optionaler Cloud-Sync?
  - *Design-Frage:* Wie synchronisiert man zwischen mehreren Rechnern?
- [ ] **Plugin-System** – Braucht VibeMarketer Plugins oder ist es monolithisch?
  - *Design-Entscheidung:* Wenn ja, wie? (vgl. FlowMarketer)
- [ ] **Cron/Scheduler** – Wiederkehrende Tasks (wöchentlicher Zyklus)
  - *Recherche:* System-Cron vs. In-App-Scheduler (APScheduler, node-cron)
- [ ] **Error-Handling & Retry** – Was passiert wenn eine API ausfällt?
  - *Recherche:* Circuit-Breaker-Pattern, Retry mit Backoff, Dead-Letter-Queue

#### F) Sicherheit & Datenschutz
- [ ] **API-Key-Management** – .env, Vault, System-Keychain?
  - *Recherche:* Sicherste lokale Speicherung von Secrets
- [ ] **DSGVO-Compliance** – Personenbezogene Daten lokal gespeichert?
  - *Recherche:* Anforderungen, Löschkonzepte, Dokumentation
- [ ] **E-Mail-Authentifizierung** – SPF, DKIM, DMARC für eigene Domain
  - *Recherche:* Setup-Guide, Testing-Tools

#### G) MVP-Abgrenzung
- **Phase 1 (MVP):** CLI-Tool das 1 Unternehmen recherchiert, Content erstellt, in Obsidian speichert. Kein Outreach, kein Analytics.
- **Phase 2:** TAM-Building, Lead-Scoring, E-Mail-Entwürfe.
- **Phase 3:** Automatisierter Versand, Reply-Tracking, Closed-Loop-Learning.

---

## 2. ContentForge – AI Content Engine

### Konzept
Fokus NUR auf Content-Erstellung. Topic rein > Blogposts, Social Posts, Email-Sequenzen, Landing Pages, Video-Skripte raus. Mit Wissensgraph der aus jedem Output lernt. Export als Markdown/HTML/JSON.

### Was muss erforscht werden?

#### A) Technologie-Stack
- [ ] **Sprachwahl** – Python (LLM-Ökosystem stark) vs. Node (Markdown-Tooling)?
  - *Recherche:* Bestes Markdown-Templating, HTML-Rendering
- [ ] **Template-Engine** – Jinja2 vs. Nunjucks vs. Handlebars für Content-Templates?
  - *Recherche:* Welches unterstützt Markdown + Frontmatter am besten?
- [ ] **Markdown-zu-HTML** – Marked vs. Remark vs. Python-Markdown?
  - *Recherche:* Erweiterbarkeit (Custom Renderer), Performance
- [ ] **Wissensgraph** – NetworkX vs. Neo4j vs. einfache JSON-Struktur?
  - *Recherche:* Was ist das minimale sinnvolle Setup für einen Content-Wissensgraph?

#### B) KI/LLM-Integration
- [ ] **Content-Typ-spezifische Prompts** – Blog vs. Social vs. Email vs. Landing Page
  - *Recherche:* Optimale Prompt-Länge, Tonalität, Struktur pro Typ
  - *Zu testen:* A/B-Testing von Prompt-Varianten
- [ ] **Consistency-Engine** – Wie bleibt die Brand-Voice über alle Outputs konsistent?
  - *Recherche:* System-Prompt vs. Few-Shot vs. Fine-Tuning
- [ ] **Multimodal Output** – Bilder (DALL-E, Stable Diffusion), Diagramme (Mermaid)
  - *Recherche:* Integration, Kosten, Qualität

#### C) Externe APIs & Datenquellen
- [ ] **Trend-Recherche** – Google Trends API, Twitter/X API, Reddit API?
  - *Recherche:* Was ist kostenlos nutzbar? Qualität der Trends?
- [ ] **SEO-Daten** – Ahrefs, SEMrush, Google Search Console?
  - *Recherche:* APIs, Kosten, Alternativen (DataForSEO)

#### D) Datenmodell & Persistenz
- [ ] **Content-Versionierung** – Git-basiert oder eigene Versionierung?
  - *Recherche:* Pro/Contra von Git für Content
- [ ] **Wissensgraph-Schema** – Topics, Entities, Relations, Confidence-Scores
  - *Design-Aufgabe:* Minimales, aber mächtiges Schema

#### E) MVP-Abgrenzung
- **Phase 1:** 1 Topic > 1 Blogpost + 3 Social Snippets. Markdown-Export.
- **Phase 2:** Multi-Format (Email, Landing Page, Script), Wissensgraph.
- **Phase 3:** Brand-Voice-Learning, SEO-Optimierung, Content-Kalender.

---

## 3. LeadBloom – Smart Lead Intelligence

### Konzept
Fokus NUR auf Lead-Intelligence & Outreach. Recherchiert Zielunternehmen > enriched Daten > KI-Scoring > personalisierte Anschreiben > steuert SmartLead/Instantly > A/B-Testing > Reply-Analyse.

### Was muss erforscht werden?

#### A) Technologie-Stack
- [ ] **Scraping-Framework** – Playwright vs. Puppeteer vs. Crawlee?
  - *Recherche:* Anti-Bot-Erkennung, Proxy-Rotation, Performance
- [ ] **Browser-Automation** – Headless vs. Headful für LinkedIn?
  - *Kritisch:* LinkedIn erkennt Bots aggressiv. Wie umgeht man das legal?
- [ ] **Queue-System** – BullMQ (Redis) vs. in-memory Queue?
  - *Recherche:* Braucht man Redis für Lead-Verarbeitung?

#### B) KI/LLM-Integration
- [ ] **Lead-Scoring-Modell** – Regelbasiert vs. ML vs. LLM-basiert?
  - *Recherche:* Was liefert die beste Genauigkeit für B2B-Leads?
- [ ] **Personalisierungs-Engine** – Wie generiert man echte Personalisierung, nicht nur {{Name}}?
  - *Recherche:* Icebreaker-Techniken, Research-basierte Anschreiben
- [ ] **Reply-Klassifikation** – Interested / Not Interested / Wrong Person / Auto-Reply
  - *Recherche:* LLM vs. klassischer Classifier. Trainingsdaten?

#### C) Externe APIs & Datenquellen
- [ ] **Unternehmensdaten-APIs** – Clearbit, Apollo, Hunter.io, Lusha?
  - *Recherche:* Kostenvergleich, Datenqualität, API-Limits
- [ ] **E-Mail-Finder** – Hunter.io vs. Snov.io vs. FindThatLead?
  - *Recherche:* Accuracy, Pricing
- [ ] **E-Mail-Verifikation** – ZeroBounce, NeverBounce, Emailable?
  - *Recherche:* Warum ist Verifikation nötig? Kosten? Integration?
- [ ] **SmartLead API** – Detaillierte API-Doku lesen
  - *Recherche:* Was kann die API? Campaign-Management, Stats, Webhooks?
- [ ] **Instantly API** – Vergleich mit SmartLead
  - *Recherche:* Feature-Matrix, Pricing

#### D) Datenmodell & Persistenz
- [ ] **Lead-Schema** – Company, Contact, Enrichment-Data, Scores, History
  - *Design-Aufgabe:* Normalisiertes Schema für B2B-Leads
- [ ] **Campaign-Schema** – Templates, Variants, Send-Queue, Results
  - *Design-Aufgabe:* State-Machine für E-Mail-Kampagnen

#### E) Sicherheit & Datenschutz
- [ ] **DSGVO bei Cold Outreach** – Berechtigtes Interesse? Opt-Out?
  - *Kritisch:* Rechtliche Prüfung notwendig. Wann ist Cold Outreach legal?
- [ ] **Daten-Minimierung** – Was MUSS gespeichert werden? Was DARF gespeichert werden?
  - *Recherche:* DSGVO-Artikel zu Lead-Daten

#### F) MVP-Abgrenzung
- **Phase 1:** CSV mit Unternehmensnamen > Anreicherung mit Basis-Daten > Scoring > Template-basierte Anschreiben.
- **Phase 2:** Automatisierte Recherche (Website-Scraping, News), Personalisierung.
- **Phase 3:** SmartLead/Instantly-Integration, A/B-Testing, Reply-Analyse, Closed Loop.

---

## 4. FlowMarketer – Modular Marketing OS

### Konzept
Plugin-basiertes System. Pods für Content, Research, Outreach, Analytics. Jeder Pod autark, aber gemeinsamer Memory-Layer (SQLite + Vektordatenbank). CLI + Web-Dashboard.

### Was muss erforscht werden?

#### A) Technologie-Stack
- [ ] **Plugin-Architektur** – Python Pluggy vs. Eigenbau vs. WASM-Plugins?
  - *Recherche:* Vergleich Plugin-Systeme. Welches ist am einfachsten für externe Entwickler?
- [ ] **IPC zwischen Pods** – gRPC vs. Redis Pub/Sub vs. Datei-basiert (Memory-Layer)?
  - *Recherche:* Braucht man überhaupt IPC, wenn alles über den Memory-Layer läuft?
- [ ] **Shared Memory Layer** – SQLite + ChromaDB/LanceDB als gemeinsame Schicht
  - *Recherche:* Schema-Design für Multi-Pod-Zugriff. Concurrency?
- [ ] **Web-Dashboard** – FastAPI + Jinja2 vs. Next.js vs. Streamlit?
  - *Recherche:* Was ist am schnellsten zu bauen? Was skaliert gedanklich?

#### B) KI/LLM-Integration
- [ ] **Prompt-Registry** – Wie teilen Pods Prompts? Zentrales Prompt-Management?
  - *Design-Frage:* Sollten Prompts versioniert und teilbar sein?
- [ ] **Model-Routing** – Welches Modell für welchen Pod?
  - *Recherche:* Kosten-Nutzen-Analyse pro Pod-Typ

#### C) Datenmodell & Persistenz
- [ ] **Universelles Event-Schema** – Alle Pods schreiben Events in den Memory-Layer
  - *Design-Aufgabe:* Event-Sourcing? CRUD? Hybrid?
- [ ] **Pod-Manifest-Format** – Wie deklariert ein Pod seine Fähigkeiten?
  - *Design-Aufgabe:* JSON-Schema für Pod-Manifeste

#### D) Architektur & Deployment
- [ ] **Pod-Discovery** – Wie findet das System installierte Pods?
  - *Recherche:* Dateisystem-basiert vs. Registry vs. Konfiguration
- [ ] **Pod-Lifecycle** – Install, Enable, Disable, Update, Remove
  - *Design-Aufgabe:* Lifecycle-State-Machine
- [ ] **Sandboxing** – Wie isoliert man Pods voneinander?
  - *Recherche:* Docker? Python venvs? Node workers?

#### E) MVP-Abgrenzung
- **Phase 1:** Core-System mit Memory-Layer + 1 Content-Pod + 1 Research-Pod. Kein Dashboard, nur CLI.
- **Phase 2:** Plugin-SDK, 2 weitere Pods, Web-Dashboard.
- **Phase 3:** Plugin-Marketplace, Community-Pods.

---

## Forschungs-Priorisierung (Was zuerst?)

### Block 1: Fundament-Legend (für ALLE Konzepte relevant)
1. **LLM-Modell-Vergleich** (DeepSeek vs. Gemini vs. Claude vs. lokale Modelle)
   - Kosten, Qualität, Geschwindigkeit pro Task-Typ
   - Prompt-Architektur-Best-Practices
2. **Python vs. Node.js Entscheidungsmatrix**
   - Da alle 4 Konzepte ähnliche Anforderungen haben, sollte diese Entscheidung einmalig fallen
3. **Lokale Persistenz-Strategie** (SQLite + Vektordatenbank)
4. **DSGVO-Baseline** für automatisierte Marketing-Tools

### Block 2: Konzept-spezifische Deep-Dives (nach Auswahl)
- **VibeMarketer:** Obsidian-Integration, E-Mail-Infrastruktur, SmartLead API
- **ContentForge:** Content-Templates, Wissensgraph-Schema, SEO-APIs
- **LeadBloom:** LinkedIn/Scraping-Legalität, E-Mail-Finder-APIs, Reply-Klassifikation
- **FlowMarketer:** Plugin-Architektur, Pod-Manifest-Design, Sandboxing

### Block 3: Prototyping (nach Block 2)
- Minimales CLI-Gerüst
- 1 End-to-End-Workflow (z.B. "Topic > Blogpost" für ContentForge)
- Prompt-Tuning mit echten Daten

---

## Geschätzte Forschungs-Zeit

| Block | Aufwand | Output |
|-------|---------|--------|
| Block 1 (Fundament) | 2-3 Tage | Tech-Stack-Entscheidung, Prompt-Templates, DB-Schema |
| Block 2 (Deep-Dive) | 3-5 Tage pro Konzept | API-Evaluation, rechtliche Prüfung, Architektur-Skizze |
| Block 3 (Prototyp) | 2-3 Tage | Lauffähiger MVP-Workflow |

**Gesamt für alle 4:** ~20-30 Arbeitstage parallele Recherche + Dokumentation, bevor Code geschrieben wird.

---

## Nächste Schritte

1. **Entscheidung:** Welches der 4 Konzepte? Oder Kombination?
2. **Block 1 starten:** Fundament-Recherche (LLM-Vergleich, Stack, Persistenz)
3. **Block 2 parallel:** Zwei Konzepte parallel deep-diven (Agent Manager Worktrees?)
4. **Forschungs-Output:** Pro Block ein Markdown-Dokument im `tasks/`-Ordner
