'use client';

import { BookOpen, Keyboard, FolderGit2, CheckSquare, Clock, Users, Building2, FileText, Zap, MousePointerClick } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DocsPage() {
  const sections = [
    {
      icon: BookOpen,
      title: 'Erste Schritte',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Anmeldung</h3>
            <p className="text-sm text-muted-foreground">Melde dich unter vibeforce-flow-os.vercel.app mit deiner E-Mail und deinem Passwort an. Nach der ersten Anmeldung empfehlen wir, dein Passwort zu ändern.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Das Dashboard</h3>
            <p className="text-sm text-muted-foreground">Das Dashboard ist deine Startseite mit KPIs, aktiven Projekten, offenen Aufgaben und den letzten Zeiteinträgen.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Navigation</h3>
            <p className="text-sm text-muted-foreground">Die linke Sidebar enthält alle Hauptbereiche: Dashboard, Projekte, Aufgaben, Planer, Zeiterfassung, Kunden, Team und Reports. Oben rechts findest du die globale Suche (<kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground">/</kbd>), Dark-Mode-Toggle und Benutzer-Menü.</p>
          </div>
        </div>
      )
    },
    {
      icon: FolderGit2,
      title: 'Projekte',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Projekt erstellen</h3>
            <p className="text-sm text-muted-foreground mb-2">Über <strong>Projekte → Neues Projekt</strong> oder <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground">Alt+P</kbd> öffnest du den Projekt-Dialog.</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li><strong>Name</strong> — Der Projektname</li>
              <li><strong>Kürzel</strong> — 2–5 Zeichen (z. B. „KLOS", eindeutig)</li>
              <li><strong>Kunde</strong> — Optional, für Kundenprojekte</li>
              <li><strong>Status</strong> — Aktiv, Pausiert, Abgeschlossen</li>
              <li><strong>Budget</strong> — Stunden & Geld, Deadline, Team</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Projekt-Detailseite</h3>
            <p className="text-sm text-muted-foreground">Klicke auf ein Projekt für die Detailansicht mit Übersicht, Gantt-Chart, Tasks und Zeiteinträgen.</p>
          </div>
        </div>
      )
    },
    {
      icon: CheckSquare,
      title: 'Aufgaben (Tasks)',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Task erstellen</h3>
            <p className="text-sm text-muted-foreground mb-2">Über <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground">Alt+T</kbd> oder den „+ Task"-Button:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li><strong>Priorität</strong> — Acute (rot), High (orange), Medium (blau), Low (grau)</li>
              <li><strong>Status</strong> — To-Do → In Bearbeitung → Review → Erledigt</li>
              <li><strong>Typ</strong> — Development, Design, SEO, SEA, Social Ads, Content, Tracking, Consulting</li>
              <li><strong>Zuständig</strong> — Task an Teammitglied zuweisen</li>
            </ul>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Checklisten</h3>
            <p className="text-sm text-muted-foreground">Innerhalb eines Tasks kannst du Checklisten mit Teilaufgaben anlegen und abhaken.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Task-Abhängigkeiten</h3>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li><strong>depends_on</strong> — Task B startet erst, wenn Task A erledigt ist</li>
              <li><strong>blocks</strong> — Task A blockiert Task B</li>
              <li><strong>relates_to</strong> — Tasks sind thematisch verbunden</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Clock,
      title: 'Zeiterfassung',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Stunden buchen</h3>
            <p className="text-sm text-muted-foreground mb-2">Über <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground">Alt+Z</kbd> oder den Timer in der unteren Leiste:</p>
            <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
              <li>Task auswählen</li>
              <li>Start- und Endzeit eingeben (oder Dauer in Minuten)</li>
              <li>Beschreibung hinzufügen</li>
              <li>Abrechenbar an-/abwählen</li>
              <li>Speichern</li>
            </ol>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Zeitübersicht</h3>
            <p className="text-sm text-muted-foreground">Unter <strong>Zeiterfassung</strong> filterbar nach Datum, Projekt, Kunde — mit Summen und CSV-Export.</p>
          </div>
        </div>
      )
    },
    {
      icon: Building2,
      title: 'Kunden (CRM)',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Kunde anlegen</h3>
            <p className="text-sm text-muted-foreground mb-2">Über <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[11px] font-medium text-muted-foreground">Alt+C</kbd> oder <strong>Kunden → Neuer Kunde</strong>:</p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
              <li><strong>Stundensatz</strong> — Basis für automatische Abrechnung</li>
              <li><strong>Rahmenvertrag</strong> — Laufzeit, Budget, Monatskontingent</li>
              <li><strong>Betreuer & Beobachter</strong> — Team-Zugriffsrechte</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Zap,
      title: 'Planer & Gantt-Chart',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Der <strong>Planer</strong> visualisiert alle Projekte im Gantt-Chart mit Drag & Drop, Abhängigkeits-Pfeilen und Ressourcenansicht.</p>
        </div>
      )
    },
    {
      icon: Users,
      title: 'Team & Auslastung',
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Unter <strong>Team</strong> siehst du alle Mitglieder mit Rolle, Expertise, aktuellen Tasks und Kapazitätsauslastung.</p>
        </div>
      )
    },
    {
      icon: FileText,
      title: 'Reporting & Export',
      content: (
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Stundenreport</h3>
            <p className="text-sm text-muted-foreground">Unter <strong>Zeitauswertungen</strong> filterbar nach Zeitraum, Projekt, Kunde, Mitarbeiter. Gruppierung und Summenzeile. Export als PDF oder CSV.</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground mb-2">Report-Templates</h3>
            <p className="text-sm text-muted-foreground">Speichere häufige Konfigurationen als Template (z. B. „Wochenbericht", „Monatsabrechnung").</p>
          </div>
        </div>
      )
    },
  ];

  const shortcuts = [
    { section: 'Global', items: [
      { key: 'Alt+T / Option+T', description: 'Neue Aufgabe erstellen' },
      { key: 'Alt+P / Option+P', description: 'Neues Projekt anlegen' },
      { key: 'Alt+Z / Option+Z', description: 'Zeiterfassung öffnen' },
      { key: 'Alt+C / Option+C', description: 'Neuen Kunden anlegen' },
      { key: 'Ctrl+K / Cmd+K', description: 'Command-Palette öffnen' },
      { key: '/', description: 'Header-Suche fokussieren' },
    ]},
    { section: 'Command-Palette', items: [
      { key: 'Tab', description: 'Filter-Tabs wechseln' },
      { key: '↑ ↓ Pfeiltasten', description: 'Navigieren' },
      { key: 'Enter', description: 'Auswählen' },
      { key: 'Esc', description: 'Schließen' },
    ]},
    { section: 'Slash-Befehle (im Task-Input)', items: [
      { key: '/8h /30m', description: 'Dauer festlegen' },
      { key: '/23.05.26', description: 'Datum festlegen' },
      { key: '/abrechenbar', description: 'Als abrechenbar markieren' },
      { key: '/prio', description: 'Hohe Priorität setzen' },
      { key: '//beschreibung', description: 'Beschreibung hinzufügen' },
      { key: '/#tagname', description: 'Tag zuweisen' },
    ]},
  ];

  const additional = [
    {
      icon: MousePointerClick,
      title: 'Dark Mode & Night Shift',
      description: 'Dark Mode über den Sonne/Mond-Button oben rechts. Night Shift (Blaulichtfilter) über das Menü in der unteren Leiste.'
    },
    {
      icon: Zap,
      title: 'Benachrichtigungen',
      description: 'Die Glocke oben rechts zeigt: Task-Zuweisungen, Deadlines, Kommentare, @Erwähnungen und Status-Änderungen. Klicke zum Öffnen.'
    },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <BookOpen size={32} className="text-primary" />
            Handbuch — Vibeforce Flow OS
          </h1>
          <p className="text-muted-foreground mt-2">
            Alles, was du über Vibeforce Flow OS wissen musst — von der ersten Anmeldung bis zum Report-Export.
          </p>
        </div>

        {sections.map((section) => (
          <Card key={section.title} className="border-border bg-card/40">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <section.icon size={20} className="text-primary shrink-0" />
                {section.title}
              </h2>
              {section.content}
            </CardContent>
          </Card>
        ))}

        <Card className="border-border bg-card/40">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
              <Keyboard size={20} className="text-primary shrink-0" />
              Tastatur-Shortcuts
            </h2>
            <div className="space-y-6">
              {shortcuts.map((section) => (
                <div key={section.section}>
                  <h3 className="text-sm font-semibold text-primary uppercase tracking-[0.06em] mb-3">{section.section}</h3>
                  <div className="space-y-2">
                    {section.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-foreground">{item.description}</span>
                        <kbd className="inline-flex h-6 select-none items-center gap-1 rounded border border-border bg-accent/50 px-2 font-mono text-xs font-medium text-muted-foreground shrink-0">
                          {item.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {additional.map((item) => (
          <Card key={item.title} className="border-border bg-card/40">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <item.icon size={20} className="text-primary shrink-0" />
                {item.title}
              </h2>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </CardContent>
          </Card>
        ))}

        <div className="text-center text-sm text-muted-foreground py-8 border-t border-border">
          <p className="font-medium">Fragen oder Unterstützung?</p>
          <p className="mt-1">
            <a href="mailto:support@vibeforce-flow.de" className="text-primary hover:underline">support@vibeforce-flow.de</a>
            {' '}&middot;{' '}+49 30 12345678
          </p>
          <p className="mt-4 text-xs">Vibeforce Flow OS &copy; 2026 Vibeforce One</p>
        </div>
      </div>
    </div>
  );
}
