'use client';

import { FileText, Keyboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function DocsPage() {
  const shortcuts = [
    {
      section: 'Global',
      items: [
        { key: 'Alt+T / Option+T', description: 'Neue Aufgabe erstellen' },
        { key: 'Alt+P / Option+P', description: 'Neues Projekt anlegen' },
        { key: 'Alt+Z / Option+Z', description: 'Zeiterfassung offnen (Schnellaktionen)' },
        { key: 'Alt+C / Option+C', description: 'Neuen Kunden anlegen' },
        { key: 'Ctrl+K / Cmd+K', description: 'Command-Palette offnen' },
        { key: '/', description: 'Header-Suche fokussieren' },
      ],
    },
    {
      section: 'Command-Palette',
      items: [
        { key: 'Tab', description: 'Filter-Tabs wechseln' },
        { key: 'Pfeiltasten', description: 'Navigieren' },
        { key: 'Enter', description: 'Auswahlen' },
        { key: 'Esc', description: 'Schliessen' },
      ],
    },
    {
      section: 'Slash-Befehle (im Aufgaben-/Timer-Input)',
      items: [
        { key: '/8h /30m', description: 'Dauer festlegen' },
        { key: '/23.05.26', description: 'Datum festlegen' },
        { key: '/abrechenbar', description: 'Als abrechenbar markieren' },
        { key: '/prio', description: 'Hohe Prioritat setzen' },
        { key: '//beschreibung', description: 'Beschreibung hinzufugen' },
        { key: '/#tagname', description: 'Tag zuweisen' },
      ],
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Keyboard size={32} className="text-primary" />
            Tastatur-Shortcuts & Hilfe
          </h1>
          <p className="text-muted-foreground mt-2">
            Vibeforce Flow OS ist fur schnelles, tastaturgesteuertes Arbeiten optimiert.
            Hier findest du alle Shortcuts und Slash-Befehle.
          </p>
        </div>

        {shortcuts.map((section) => (
          <Card key={section.section} className="border-border bg-card/40">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <FileText size={18} className="text-primary" />
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

        <div className="text-center text-sm text-muted-foreground py-8">
          <p>Vollstandige Dokumentation folgt in einer spateren Version.</p>
          <p className="mt-1">Bei Fragen: support@vibeforce.de</p>
        </div>
      </div>
    </div>
  );
}
