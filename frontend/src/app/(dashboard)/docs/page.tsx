'use client';

import {
  BookOpen,
  CheckSquare,
  Clock,
  Building2,
  Users,
  Keyboard,
  HelpCircle,
  Layers,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserCheck,
  BellRing,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function DocsPage() {
  const shortcuts = [
    {
      section: 'Globale Tastenkürzel',
      items: [
        { key: 'Alt+T / Option+T', description: 'Neue Aufgabe schnell erstellen' },
        { key: 'Alt+P / Option+P', description: 'Neues Projekt anlegen' },
        { key: 'Alt+Z / Option+Z', description: 'Zeiterfassung öffnen (Schnellmenü)' },
        { key: 'Alt+C / Option+C', description: 'Neuen Kunden anlegen' },
        { key: 'Ctrl+K / Cmd+K', description: 'Command-Palette / Globale Suche öffnen' },
        { key: '/', description: 'Header-Suche fokussieren' },
      ],
    },
    {
      section: 'Command-Palette & Navigation',
      items: [
        { key: 'Tab', description: 'Filter-Tabs und Felder wechseln' },
        { key: 'Pfeiltasten ↑ ↓', description: 'In Listen & Dropdowns navigieren' },
        { key: 'Enter', description: 'Auswählen oder Formular absenden' },
        { key: 'Esc', description: 'Dialoge & Sidebars schließen' },
      ],
    },
    {
      section: 'Slash-Befehle (im Aufgaben- & Schnelleingabe-Feld)',
      items: [
        { key: '/8h  /30m', description: 'Dauer oder Schätzung festlegen' },
        { key: '/23.05.26', description: 'Fälligkeitsdatum festlegen' },
        { key: '/abrechenbar', description: 'Aufgabe/Zeit als abrechenbar markieren' },
        { key: '/prio', description: 'Priorität auf "Hoch" setzen' },
        { key: '//beschreibung', description: 'Aufgabenbeschreibung anhängen' },
        { key: '/#tagname', description: 'Tag oder Kategorie zuweisen' },
      ],
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <BookOpen size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Benutzer-Handbuch & Hilfe
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Offizielle Dokumentation von Vibeforce Flow OS. Hier findest du alle Funktionen, Workflows, Abrechnungsregeln und Best Practices.
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="konzept" className="w-full">
          <TabsList className="bg-card/60 border border-border p-1 rounded-xl flex flex-wrap gap-1">
            <TabsTrigger value="konzept" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Layers size={14} /> Schnelleinstieg & Konzept
            </TabsTrigger>
            <TabsTrigger value="zeit" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Clock size={14} /> Zeiterfassung & Dual-Duration
            </TabsTrigger>
            <TabsTrigger value="workflow" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Sliders size={14} /> Profil & Workflow-Präferenzen
            </TabsTrigger>
            <TabsTrigger value="aufgaben" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <CheckSquare size={14} /> Aufgaben & Checklisten
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Users size={14} /> Team & Lead-Hierarchie
            </TabsTrigger>
            <TabsTrigger value="rbac" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <ShieldCheck size={14} /> Sicherheit & Rollen (RBAC)
            </TabsTrigger>
            <TabsTrigger value="projekte" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Building2 size={14} /> Kunden, Verträge & Budgets
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <Keyboard size={14} /> Shortcuts
            </TabsTrigger>
          </TabsList>

          {/* 1. Konzept & Schnelleinstieg */}
          <TabsContent value="konzept" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  Das Grundprinzip: Die 4-Stufen-Hierarchie
                </CardTitle>
                <CardDescription>
                  Damit keine Stunden verloren gehen und alle Budgets stimmen, baut Vibeforce Flow OS auf einer klaren logischen Kette auf.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Stufe 1</Badge>
                    <h3 className="font-bold text-foreground text-sm">Kunde</h3>
                    <p className="text-xs text-muted-foreground">Auftraggeber mit Vertragsstunden, Stundensatz & Abrechnungs-Takt.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Stufe 2</Badge>
                    <h3 className="font-bold text-foreground text-sm">Projekt</h3>
                    <p className="text-xs text-muted-foreground">Projektrahmen mit Gesamtbudget, Terminplan & Zyklus.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Stufe 3</Badge>
                    <h3 className="font-bold text-foreground text-sm">Aufgabe</h3>
                    <p className="text-xs text-muted-foreground">Konkrete Arbeitspakete mit Bearbeiter, Priorität & Checkliste.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Stufe 4</Badge>
                    <h3 className="font-bold text-foreground text-sm">Zeiterfassung</h3>
                    <p className="text-xs text-muted-foreground">Reale Arbeitszeit (`duration_minutes`) & abgerechnete Zeit (`billable_minutes`).</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground flex items-center gap-2">
                    <HelpCircle size={16} className="text-indigo-400" />
                    Wie hängen die Daten automatisch zusammen?
                  </h4>
                  <p>
                    Wenn du eine Stoppuhr für eine Aufgabe startest, weiß das System sofort, zu welchem <strong>Projekt</strong> und zu welchem <strong>Kunden</strong> diese Zeit gehört. Auch der Abrechnungstakt und die Abrechenbarkeit werden automatisch vom Kunden bzw. Projekt vererbt.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Zeiterfassung & Dual-Duration */}
          <TabsContent value="zeit" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <Timer size={20} className="text-indigo-400" />
                  Dual-Duration Zeiterfassung & Billing-Engine
                </CardTitle>
                <CardDescription>
                  Rechtssichere Trennung von HR-Arbeitszeit und vertraglicher Kunden-Abrechnung.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <Clock size={16} className="text-emerald-400" />
                      1. Reale Arbeitszeit (`duration_minutes`)
                    </h3>
                    <p className="text-xs">
                      Dokumentiert die <strong>exakte, minutengenaue Stempelzeit</strong> (minus Pausen). Diese Zeit ist unverfälscht und dient als rechtliche Grundlage für Arbeitszeitkonten, Lohnabrechnung und Auslastungsanalysen.
                    </p>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <Sparkles size={16} className="text-indigo-400" />
                      2. Abrechenbare Kundenzeit (`billable_minutes`)
                    </h3>
                    <p className="text-xs">
                      Wird automatisch anhand der vertraglichen Rundungsregeln des Kunden/Projekts berechnet und bildet die Grundlage für Rechnungsstellung und Stundennachweise.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground text-base">Unterstützte Abrechnungstakte</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <strong>0m (Exakt):</strong> Minutengenaue Abrechnung (1:1).
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <strong>5-Minuten-Takt:</strong> Runder Takt für Feinstruktur.
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-indigo-400 font-medium">
                      <strong>6-Minuten-Takt (0,1h):</strong> Branchenstandard für Dezimalstunden.
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <strong>10-Minuten-Takt:</strong> Klassischer Beratertakt.
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <strong>15-Minuten-Takt:</strong> Viertelstunden-Takt (0,25h).
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/40 border border-border/40">
                      <strong>30-Minuten-Takt:</strong> Halbstundentakt (0,5h).
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-semibold text-foreground text-sm">Timer Auto-Cap (Sicherheitsbegrenzung)</h4>
                    <p className="text-xs">
                      Verhindert versehentlich über Nacht laufende Stoppuhren. Überschreitet eine Zeiterfassung die im Admin-Bereich definierte Maximallaufzeit (Standard: 8 Stunden), wird sie automatisch gestoppt und gedeckelt.
                    </p>
                  </div>
                  <div className="space-y-2 p-4 rounded-xl bg-card border border-border">
                    <h4 className="font-semibold text-foreground text-sm">Inaktivitäts-Heartbeat</h4>
                    <p className="text-xs">
                      Wenn der Rechner inaktiv war oder die Stoppuhr über längere Zeit ohne Benutzerinteraktion läuft, erscheint ein Bestätigungsdialog, um die Zeit anzupassen oder zu verwerfen.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Profil & Workflow-Präferenzen */}
          <TabsContent value="workflow" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <Sliders size={20} className="text-indigo-400" />
                  Persönliche Arbeitsplatz-Präferenzen (`/profile`)
                </CardTitle>
                <CardDescription>
                  Jeder Benutzer kann seine persönliche Arbeitsumgebung flexibel konfigurieren.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base">Standard-Aufgabenansicht</h3>
                    <p className="text-xs">
                      Lege fest, ob du beim Öffnen von Aufgaben (`/tasks`) standardmäßig das <strong>Kanban-Board</strong>, die <strong>Tabellen-Liste</strong> oder die <strong>Timeline</strong> sehen möchtest.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base">Standard-Abrechenbarkeit</h3>
                    <p className="text-xs">
                      Bestimmt, ob neue manuelle Zeiteinträge oder gestartete Timer per Default als "Abrechenbar" vorbelegt werden sollen.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base">UI-Dichte (Layout-Kompaktheit)</h3>
                    <p className="text-xs">
                      Wähle zwischen <em>Komfortabel</em> (mehr Weißraum) und <em>Kompakt</em> (höhere Informationsdichte für Power-User).
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <BellRing size={16} className="text-amber-400" />
                      E-Mail-Sammelfrequenz
                    </h3>
                    <p className="text-xs">
                      Steuere, wie oft du über Projektaktivitäten und Aufgabenänderungen informiert wirst: <em>Sofort</em>, <em>Stündliche Zusammenfassung</em>, <em>Täglicher Digest</em> oder <em>Deaktiviert</em>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Aufgaben & Checklisten */}
          <TabsContent value="aufgaben" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Aufgaben, Kanban-Board & Mikroschritte</CardTitle>
                <CardDescription>So steuerst du deine täglichen Aufgaben effizient und übersichtlich.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <CheckSquare size={18} className="text-indigo-400" />
                      Aufgaben-Ansichten
                    </h3>
                    <ul className="space-y-2 text-xs list-disc list-inside">
                      <li><strong>Board-Ansicht (Kanban):</strong> Verschiebe Aufgaben per Drag-and-Drop zwischen <em>Offen</em>, <em>In Arbeit</em>, <em>Prüfung</em> und <em>Erledigt</em>.</li>
                      <li><strong>Listen-Ansicht:</strong> Kompakte Tabelle mit Zyklen-Gruppierung und Spaltensortierung.</li>
                      <li><strong>Filterleiste:</strong> Filtere sofort nach Status, Priorität, Projekt, Bearbeiter oder Kunde.</li>
                    </ul>
                  </div>

                  <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <Layers size={18} className="text-teal-400" />
                      Unteraufgaben vs. Checklisten
                    </h3>
                    <ul className="space-y-2 text-xs list-disc list-inside">
                      <li><strong>Unteraufgaben (Subtasks):</strong> Komplexe Teilaufgaben mit eigenem Bearbeiter, Fälligkeitsdatum und buchbaren Zeiten.</li>
                      <li><strong>Checklisten-Punkte:</strong> Einfache To-Do-Haken innerhalb der Aufgabe zur Selbstkontrolle mit dynamischem Fortschrittsbalken.</li>
                    </ul>
                  </div>
                </div>

                {/* Detaillierter Zyklen-Bereich */}
                <div className="p-5 rounded-2xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                      <Layers size={18} />
                    </div>
                    <h3 className="font-bold text-foreground text-base">
                      Projekt-Zyklen (Cycles, Phasen & Sprints)
                    </h3>
                  </div>

                  <p className="text-xs leading-relaxed">
                    Das <strong>Zyklen-System</strong> teilt komplexe Kundenprojekte in iterierbare Phasen oder feste Zeithorizonte ein (z. B. 2-Wochen-Sprints oder Meilensteine wie <em>Setup</em>, <em>Umsetzung</em>, <em>Rollout</em>).
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <strong className="text-foreground">1. Zyklus-Zuordnung</strong>
                      <p>Jedes Projekt besitzt eine aktuelle Zyklusnummer (`cycle_number`, z.B. <code>Zyklus #0</code> für die Initialisierungsphase). Alle zugehörigen Aufgaben werden diesem Zyklus automatisch zugeordnet.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <strong className="text-foreground">2. Button „Zyklen“</strong>
                      <p>Der Toggle-Button oben rechts schaltet die Gruppenansicht ein/aus. Bei aktiver Zyklen-Ansicht werden alle Aufgaben nach Projekt und Zyklus gebündelt.</p>
                    </div>
                    <div className="p-3 rounded-xl bg-card border border-border space-y-1">
                      <strong className="text-foreground">3. Zyklus-Fortschritt</strong>
                      <p>Der Badge (z. B. <code>Zyklus #0 · 4 Aufgaben</code>) zeigt auf einen Blick den aktuellen Aufgabenstand der jeweiligen Iteration, ohne dass man die Übersicht verliert.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5. Team & Lead-Hierarchie */}
          <TabsContent value="team" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <UserCheck size={20} className="text-indigo-400" />
                  Team, Lead-Zuweisung & Auslastung (`/team`)
                </CardTitle>
                <CardDescription>Mitarbeiterführung, feste Admin-Zuordnung und Kapazitätsplanung.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <UserCheck size={18} className="text-indigo-400" />
                      Feste Admin- / Lead-Zuweisung (`supervisor`)
                    </h3>
                    <p className="text-xs">
                      Jeder Mitarbeiter kann in der Benutzerverwaltung (`/admin/users`) einem festen Admin oder Manager zugewiesen werden. Dies bildet die disziplinarische oder fachliche Führungsstruktur ab.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-card border border-border space-y-3">
                    <h3 className="font-semibold text-foreground text-base flex items-center gap-2">
                      <Users size={18} className="text-teal-400" />
                      Filter "Mein Team"
                    </h3>
                    <p className="text-xs">
                      Teamleads und Admins können im Workload-Dashboard mit einem Klick zwischen <em>Alle Mitarbeiter</em> und <em>Mein Team</em> wechseln, um sofort die Auslastung der eigenen Mitarbeiter zu sehen.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                  <h3 className="font-semibold text-foreground text-sm">Workload- & Kapazitätsberechnung</h3>
                  <p className="text-xs">
                    Das System vergleicht gebuchte Ist-Stunden und geschätzte Plan-Aufgaben mit den vertraglichen Wochenstunden (`weekly_hours_target`, z.B. 40h) und signalisiert Überlastung farblich: 
                    <span className="text-emerald-400 font-medium ml-1">Grün (&lt;50%)</span>, 
                    <span className="text-amber-400 font-medium ml-1">Gelb (50–80%)</span>, 
                    <span className="text-red-400 font-medium ml-1">Rot (&gt;80%)</span>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 5b. Sicherheit & Rollenmatrix (RBAC) */}
          <TabsContent value="rbac" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-400" />
                  Rollenmatrix, Berechtigungen & RBAC-Sicherheit
                </CardTitle>
                <CardDescription>
                  Detaillierte Übersicht über Rollen-Rechte, Zugriffsebenen und Schutz vor Privilege Escalation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-red-500/10 text-red-400 border-red-500/20">Administrator</Badge>
                    <h3 className="font-bold text-foreground text-sm">Vollzugriff & Systemverwaltung</h3>
                    <p className="text-xs">
                      Voller Zugriff auf Benutzerverwaltung (`/admin/users`), Systemeinstellungen (`/admin/settings`), SMTP-Konfiguration, Festlegung von Stundensätzen und Rollenvergabe.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20">Manager / Lead</Badge>
                    <h3 className="font-bold text-foreground text-sm">Team- & Projektleitung</h3>
                    <p className="text-xs">
                      Einsicht in Team-Workloads (`Mein Team`), Projektanlage, Budgetüberwachung und Aufgabenkoordination für zugewiesene Mitarbeiter.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Mitarbeiter / Employee</Badge>
                    <h3 className="font-bold text-foreground text-sm">Operative Arbeit & Zeiterfassung</h3>
                    <p className="text-xs">
                      Bearbeitung eigener Aufgaben, Buchung von Arbeitszeiten, Profil-Präferenzen. Kein Zugriff auf Admin-Routen, Rollenänderungen oder Systemeinstellungen.
                    </p>
                  </div>
                </div>

                <div className="space-y-3 p-4 rounded-xl bg-card border border-border">
                  <h3 className="font-semibold text-foreground text-base">Mehrstufiges Sicherheitskonzept (Zero Trust)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <strong className="text-foreground">1. Edge & Middleware Protection:</strong>
                      <p>Alle `/admin/*` Aufrufe werden bereits vor dem Rendern via Next.js Edge-Middleware geprüft und unautorisierte Aufrufe sofort auf `/tasks` umgeleitet.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <strong className="text-foreground">2. Server Action Guard:</strong>
                      <p>Jede mutierende Server-Aktion validiert die Session serverseitig (`verifyUserSession`) und lehnt Manipulationen mit `403 - Keine Berechtigung` ab.</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-1">
                      <strong className="text-foreground">3. PocketBase DB-Hooks:</strong>
                      <p>Datenbank-Hooks verhindern direkte API-Manipulationen an sensiblen Feldern (`role`, `supervisor`, `verified`) durch Nicht-Admins.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 6. Kunden & Projekte */}
          <TabsContent value="projekte" className="space-y-6 mt-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <CardTitle className="text-xl text-foreground">Kunden, Verträge & Projektbudgets (360°)</CardTitle>
                <CardDescription>Verwalte Auftraggeber, vertragliche Kontingente und Stundensätze.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-muted-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base">Kundenverwaltung (`/clients`)</h3>
                    <p className="text-xs">
                      Pflege Ansprechpartner, Auftragsvolumen, monatliche/gesamte Stundenkontingente, Vertragslaufzeiten sowie kundenspezifische Abrechnungstakte.
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-card border border-border space-y-2">
                    <h3 className="font-semibold text-foreground text-base">Projekte & Planer (`/projects`, `/planner`)</h3>
                    <p className="text-xs">
                      Überwachung von Projektbudgets (Stunden & Betrag), Projekt-Zyklen und Zeitplan-Visualisierung im Gantt-Chart.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 7. Shortcuts */}
          <TabsContent value="shortcuts" className="space-y-6 mt-6">
            {shortcuts.map((section) => (
              <Card key={section.section} className="border-border bg-card/40">
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Keyboard size={18} className="text-primary" />
                    {section.section}
                  </h2>
                  <div className="space-y-3">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-foreground">{item.description}</span>
                        <kbd className="inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-accent/50 px-2 font-mono text-xs font-medium text-muted-foreground">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground py-6 border-t border-border/40">
          <p className="font-medium text-foreground">Vibeforce Flow OS — Handbuch & Dokumentation</p>
          <p className="mt-1">Support & Hilfe: support@vibeforce-flow.de</p>
        </div>
      </div>
    </div>
  );
}
