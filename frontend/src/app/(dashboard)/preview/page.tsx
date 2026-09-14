'use client';

import { useState } from 'react';
import {
  ChevronDown, ChevronRight, Search, Calendar, Clock,
  X, Plus, Check, List, LayoutGrid, GripVertical, Circle,
  AlertTriangle, ArrowLeft, ArrowRight, Menu, MoreHorizontal,
  Sun, Moon, Filter, Users, Settings, Home, BarChart3,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// TYPOGRAPHY TOKENS
// ─────────────────────────────────────────────────────────────
const styles = {
  pageTitle: 'text-3xl font-bold text-foreground mb-2',
  pageSub: 'text-sm text-muted-foreground mb-8',
  sectionTitle: 'text-xl font-semibold text-foreground mb-1',
  sectionDesc: 'text-xs text-muted-foreground mb-4',
  card: 'rounded-xl border border-border bg-card p-5',
  cardTitle: 'text-sm font-semibold text-foreground mb-3',
  badge: 'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
  btn: 'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all active:scale-[0.97]',
  label: 'text-xs text-muted-foreground mb-1 block',
  select: 'w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30',
  input: 'w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50',
};

// ─────────────────────────────────────────────────────────────
// A2: CHIP-LEISTE – 3 Varianten
// ─────────────────────────────────────────────────────────────
const chips = ['Alle', 'Offen', 'In Arbeit', 'Review', 'Erledigt', 'Archiv', 'Dringend', 'Geplant'];

function ChipHorizontalScroll() {
  return (
    <div className="overflow-x-auto scrollbar-none pb-1">
      <div className="flex gap-2 min-w-max">
        {chips.map(c => (
          <button key={c} className={`${styles.badge} ${c === 'Alle' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'} whitespace-nowrap flex-shrink-0`}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}

function ChipWrapShowMore() {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? chips : chips.slice(0, 4);
  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(c => (
        <button key={c} className={`${styles.badge} ${c === 'Alle' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          {c}
        </button>
      ))}
      {chips.length > 4 && (
        <button onClick={() => setShowAll(!showAll)} className={`${styles.badge} bg-background border border-dashed border-border text-muted-foreground hover:text-foreground`}>
          {showAll ? 'Weniger' : `+${chips.length - 4}`}
        </button>
      )}
    </div>
  );
}

function ChipProgressiveDisclosure() {
  const [active, setActive] = useState('Alle');
  return (
    <div className="flex flex-wrap gap-2">
      {chips.slice(0, 4).map(c => (
        <button key={c} onClick={() => setActive(c)}
          className={`${styles.badge} ${active === c ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
          {c}
        </button>
      ))}
      <div className="relative group">
        <button className={`${styles.badge} bg-background border border-border text-muted-foreground hover:text-foreground`}>
          <MoreHorizontal size={12} /> Mehr
        </button>
        <div className="absolute top-full left-0 mt-1 z-10 hidden group-hover:block bg-popover border border-border rounded-lg shadow-lg p-2 min-w-[140px]">
          {chips.slice(4).map(c => (
            <button key={c} onClick={() => setActive(c)}
              className="block w-full text-left px-3 py-1.5 text-sm rounded-md hover:bg-accent text-foreground">
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// B1: VIOLETTES PANEL – 3 Varianten
// ─────────────────────────────────────────────────────────────
function PanelBottomSheet() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)} className={`${styles.btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
        <Menu size={14} /> Panel öffnen
      </button>
      {open && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border rounded-t-2xl p-5 pb-8 animate-in slide-in-from-bottom">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Aktionen</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
            </div>
            <div className="space-y-2">
              {['Aufgabe erstellen', 'Datei hochladen', 'Kommentar hinzufügen', 'Status ändern'].map(a => (
                <button key={a} className="w-full text-left px-4 py-3 rounded-xl hover:bg-accent text-sm text-foreground transition-colors">
                  {a}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PanelActionSheet() {
  return (
    <div className="space-y-1 max-w-[250px]">
      {['Aufgabe erstellen', 'Datei hochladen', 'Kommentar hinzufügen', 'Status ändern'].map((a, i) => (
        <button key={a}
          className={`w-full text-left px-4 py-2.5 text-sm rounded-xl transition-colors
            ${i === 0 ? 'bg-primary/10 text-primary font-medium' : 'text-foreground hover:bg-accent'}`}>
          {a}
        </button>
      ))}
    </div>
  );
}

function PanelAccordion() {
  const [open, setOpen] = useState<string | null>(null);
  const items = {
    'Aufgaben': 'Erstelle und verwalte Aufgaben in deinen Projekten.',
    'Dateien': 'Lade Dokumente, Bilder und andere Dateien hoch.',
    'Kommentare': 'Diskutiere mit deinem Team zu Aufgaben.',
    'Status': 'Ändere den Fortschrittsstatus deiner Aufgaben.',
  };
  return (
    <div className="space-y-1 max-w-[280px]">
      {Object.entries(items).map(([title, desc]) => (
        <div key={title} className="border border-border rounded-xl overflow-hidden">
          <button onClick={() => setOpen(open === title ? null : title)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors">
            {title}
            <ChevronDown size={14} className={`text-muted-foreground transition-transform ${open === title ? 'rotate-180' : ''}`} />
          </button>
          {open === title && (
            <div className="px-4 pb-3 text-xs text-muted-foreground">{desc}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// B3: TABELLE AUF MOBILE – 3 Varianten
// ─────────────────────────────────────────────────────────────
const tableData = [
  { proj: 'Web Relaunch', task: 'Design Draft', status: 'In Arbeit', prio: 'Hoch', assignee: 'Robin' },
  { proj: 'SEO Kampagne', task: 'Keyword Analyse', status: 'Offen', prio: 'Mittel', assignee: 'Anna' },
  { proj: 'Social Ads', task: 'Anzeigen erstellen', status: 'Review', prio: 'Hoch', assignee: 'Max' },
  { proj: 'Tracking', task: 'Dashboard Setup', status: 'Erledigt', prio: 'Niedrig', assignee: 'Robin' },
];

const statusColor = (s: string) =>
  s === 'Erledigt' ? 'text-green-400 bg-green-500/10' :
  s === 'In Arbeit' ? 'text-blue-400 bg-blue-500/10' :
  s === 'Review' ? 'text-amber-400 bg-amber-500/10' :
  'text-muted-foreground bg-muted';

function TableCardView() {
  return (
    <div className="space-y-2">
      {tableData.map((row, i) => (
        <div key={i} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted-foreground bg-background px-1.5 py-0.5 rounded">{row.proj}</span>
            <span className={`${styles.badge} ${statusColor(row.status)}`}>{row.status}</span>
          </div>
          <p className="text-sm font-medium text-foreground">{row.task}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Priorität: {row.prio}</span>
            <span>{row.assignee}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TablePrioritized() {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Aufgabe</th>
              <th className="text-left py-2 px-2 text-muted-foreground font-medium text-xs">Status</th>
              <th className="text-right py-2 px-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">Prio</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
                <td className="py-2.5 px-2">
                  <span className="text-xs text-muted-foreground block">{row.proj}</span>
                  <span className="text-sm text-foreground">{row.task}</span>
                </td>
                <td className="py-2.5 px-2">
                  <span className={`${styles.badge} ${statusColor(row.status)}`}>{row.status}</span>
                </td>
                <td className="py-2.5 px-2 text-right text-xs text-muted-foreground hidden sm:table-cell">{row.prio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableHorizontalScroll() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[400px]">
        <thead>
          <tr className="border-b border-border">
            {['Projekt', 'Aufgabe', 'Status', 'Priorität', 'Zuständig'].map(h => (
              <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium text-xs whitespace-nowrap first:sticky first:left-0 first:bg-card first:z-10">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-accent/30 transition-colors">
              <td className="py-2.5 px-3 text-xs text-muted-foreground sticky left-0 bg-card">{row.proj}</td>
              <td className="py-2.5 px-3 text-sm text-foreground whitespace-nowrap">{row.task}</td>
              <td className="py-2.5 px-3"><span className={`${styles.badge} ${statusColor(row.status)}`}>{row.status}</span></td>
              <td className="py-2.5 px-3 text-xs text-muted-foreground">{row.prio}</td>
              <td className="py-2.5 px-3 text-xs text-foreground">{row.assignee}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// B2: COLLAPSIBLE PANEL (Single-Solution)
// ─────────────────────────────────────────────────────────────
function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-foreground hover:bg-accent/50 transition-colors">
        <span className="font-medium">{title}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-4 pb-4 text-xs text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// C2: WOCHENTAG-LABELS – 3 Varianten
// ─────────────────────────────────────────────────────────────
const weekdays = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

function DayLabelsIntl() {
  const [vp, setVp] = useState(375);
  const fmt = (w: string) => {
    const date = new Date(2026, 4, 11 + weekdays.indexOf(w));
    return date.toLocaleDateString('de-DE', {
      weekday: vp < 400 ? 'narrow' : vp < 600 ? 'short' : 'long'
    } as Intl.DateTimeFormatOptions);
  };
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input type="range" min={320} max={800} value={vp} onChange={e => setVp(Number(e.target.value))}
          className="flex-1 accent-indigo-500" />
        <span className="text-xs text-muted-foreground font-mono w-12 text-right">{vp}px</span>
      </div>
      <div className="grid grid-cols-7 gap-1" style={{ maxWidth: vp }}>
        {weekdays.map(w => {
          const date = new Date(2026, 4, 11 + weekdays.indexOf(w));
          const label = date.toLocaleDateString('de-DE', {
            weekday: vp < 400 ? 'narrow' : vp < 600 ? 'short' : 'long'
          } as Intl.DateTimeFormatOptions);
          return (
            <div key={w} className="text-center py-2 rounded-lg bg-muted/50 text-xs text-foreground font-medium">
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DayLabelsCQ() {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-2">Container Query steuert die Kürzung automatisch:</p>
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'M', full: 'Montag', w: 40 },
          { label: 'Mo', full: 'Montag', w: 50 },
          { label: 'Mo.', full: 'Montag', w: 60 },
          { label: 'Montag', full: 'Montag', w: 90 },
        ].map(d => (
          <div key={d.w}
            className={`rounded-lg text-center text-xs font-medium text-foreground py-1.5 border border-border transition-all`}
            style={{ width: d.w }}>
            <span className="block sm:hidden">{d.label}</span>
            <span className="hidden sm:block">{d.full}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">→ Responsive Breakpoint: <code className="bg-muted px-1 rounded">sm (640px)</code></p>
    </div>
  );
}

function DayLabelsFixed() {
  return (
    <div className="grid grid-cols-7 gap-1 max-w-[375px]">
      {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
        <div key={d} className="text-center py-2 rounded-lg bg-muted/50 text-xs text-foreground font-medium">
          {d}
        </div>
      ))}
      <p className="col-span-7 text-[10px] text-muted-foreground text-center mt-1">Desktop: Montag, Dienstag, …</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// D1: ZEITFELDER – 3 Varianten
// ─────────────────────────────────────────────────────────────
function TimeFieldsStacked() {
  return (
    <div className="space-y-3 max-w-[280px]">
      <div className="space-y-1">
        <label className={styles.label}>Startzeit</label>
        <input type="time" defaultValue="09:00" className={styles.input} />
      </div>
      <div className="space-y-1">
        <label className={styles.label}>Endzeit</label>
        <input type="time" defaultValue="17:00" className={styles.input} />
      </div>
    </div>
  );
}

function TimeFieldsSideBySide() {
  return (
    <div className="flex gap-3 max-w-[320px]">
      <div className="flex-1 space-y-1">
        <label className={styles.label}>Start</label>
        <input type="time" defaultValue="09:00" className={styles.input} />
      </div>
      <div className="flex items-center pt-5 text-muted-foreground">
        <ArrowRight size={14} />
      </div>
      <div className="flex-1 space-y-1">
        <label className={styles.label}>Ende</label>
        <input type="time" defaultValue="17:00" className={styles.input} />
      </div>
    </div>
  );
}

function TimeFieldsNative() {
  return (
    <div className="space-y-2 max-w-[300px]">
      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-end">
        <div className="space-y-1">
          <label className={styles.label}>Von</label>
          <input type="time" defaultValue="09:00" className={styles.input} />
        </div>
        <span className="text-muted-foreground pb-2">—</span>
        <div className="space-y-1">
          <label className={styles.label}>Bis</label>
          <input type="time" defaultValue="17:00" className={styles.input} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
        <Clock size={12} />
        Dauer: 8h 0m
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// D2: GANTT MOBILE – 3 Varianten
// ─────────────────────────────────────────────────────────────
function TimelineList() {
  const projects = [
    { name: 'Website Relaunch', start: '12.05.', end: '28.05.', tasks: ['Design-Entwurf', 'Development', 'Testing'] },
    { name: 'SEO Kampagne', start: '01.05.', end: '30.06.', tasks: ['Keyword-Analyse'] },
  ];
  return (
    <div className="space-y-3 max-w-[320px]">
      {projects.map((p, i) => (
        <CollapsibleSection key={i} title={`${p.name}  ${p.start}–${p.end}`}>
          <div className="space-y-1 mt-2">
            {p.tasks.map((t, j) => (
              <div key={j} className="flex items-center gap-2 py-1">
                <Circle size={6} className="fill-current text-indigo-400" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      ))}
    </div>
  );
}

function CalendarWidget() {
  const [month, setMonth] = useState(5);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const firstDay = 4; // Thursday
  return (
    <div className="max-w-[320px]">
      <div className="flex items-center justify-between mb-2">
        <button className="text-muted-foreground hover:text-foreground"><ArrowLeft size={14} /></button>
        <span className="text-sm font-medium text-foreground">Mai 2026</span>
        <button className="text-muted-foreground hover:text-foreground"><ArrowRight size={14} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} className="text-[10px] text-muted-foreground py-1">{d}</div>
        ))}
        {Array.from({ length: firstDay - 1 }).map((_, i) => <div key={`e${i}`} />)}
        {days.map(d => (
          <button key={d}
            className={`text-xs py-1.5 rounded-lg transition-colors
              ${d === 14 ? 'bg-primary text-primary-foreground font-bold' : 'text-foreground hover:bg-accent'}`}>
            {d}
          </button>
        ))}
      </div>
    </div>
  );
}

function DesktopOnly() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center max-w-[320px]">
      <BarChart3 size={24} className="mx-auto text-muted-foreground mb-2" />
      <p className="text-sm font-medium text-foreground">Planer nur auf Desktop verfügbar</p>
      <p className="text-xs text-muted-foreground mt-1">Öffne diese Seite auf einem größeren Bildschirm für die Gantt-Ansicht.</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// E1: ID STATT NAME (Single-Solution)
// ─────────────────────────────────────────────────────────────
function UserSelectCorrect() {
  const users = [
    { id: 'abc123', name: 'Robin Lehnebach', email: 'robin@example.com' },
    { id: 'def456', name: 'Anna Müller', email: 'anna@example.com' },
    { id: 'ghi789', name: null, email: 'max@example.com' },
  ];
  const [selected, setSelected] = useState('');
  const displayName = (u: typeof users[0]) => u.name || u.email || u.id;
  return (
    <div className="space-y-2 max-w-[280px]">
      <label className={styles.label}>Verantwortlich</label>
      <select value={selected} onChange={e => setSelected(e.target.value)} className={styles.select}>
        <option value="">Nicht zugewiesen</option>
        {users.map(u => (
          <option key={u.id} value={u.id}>
            ✅ {displayName(u)} {/* Display = lesbarer Name */}
          </option>
        ))}
      </select>
      {selected && (
        <p className="text-xs text-emerald-400 flex items-center gap-1">
          <Check size={12} /> Gespeichert als ID: <code className="bg-muted px-1 rounded">{selected}</code>, angezeigt wird: <strong>{displayName(users.find(u => u.id === selected)!)}
        </strong></p>
      )}
      <p className="text-[10px] text-amber-400 flex items-center gap-1">
        <AlertTriangle size={10} /> FALSCH: <code className="bg-muted px-1 rounded">abc123</code> statt Name
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// F1: VIOLETT KONTRAST – 3 Varianten
// ─────────────────────────────────────────────────────────────
function ColorDarkerViolet() {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#5B21B6', color: 'white' }}>
        Dunkles Violett #5B21B6
      </div>
      <div className="rounded-xl px-4 py-3 text-sm font-medium" style={{ background: '#7C3AED', color: 'white' }}>
        Mittel #7C3AED
      </div>
      <div className="rounded-xl px-4 py-3 text-sm font-medium border border-border" style={{ background: '#EDE9FE', color: '#5B21B6' }}>
        Hell #EDE9FE
      </div>
      <div className="rounded-xl px-3 py-2 text-xs flex items-center gap-1 bg-muted">
        <Check size={12} className="text-green-400" /> WCAG AA ✅
      </div>
    </div>
  );
}

function ColorReplaceIndigo() {
  return (
    <div className="flex flex-wrap gap-3">
      <div className="rounded-xl px-4 py-3 text-sm font-medium bg-indigo-600 text-white">
        Indigo #533afd
      </div>
      <div className="rounded-xl px-4 py-3 text-sm font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
        Indigo hell
      </div>
      <div className="rounded-xl px-4 py-3 text-sm font-medium bg-indigo-100 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-100">
        Indigo Kontrast
      </div>
      <p className="text-xs text-muted-foreground">→ Nutzt existierende Indigo-Palette aus dem Design System</p>
    </div>
  );
}

function ColorWithIcon() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: '#F3E8FF', color: '#7E22CE', border: '1px solid #D8B4FE' }}>
          <Circle size={8} className="fill-[#7E22CE]" />
          Violett + Icon
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
          <AlertTriangle size={10} />
          Gelb + Icon (Kontrast 11.5:1)
        </span>
      </div>
      <p className="text-xs text-muted-foreground">→ Farbe NIE alleinige Informationsquelle — immer + Icon/Symbol</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// A1 / C1: GLOBALE CSS-FIXES (Single-Solution)
// ─────────────────────────────────────────────────────────────
function GlobalFixDemo() {
  return (
    <div className="space-y-4 max-w-[360px]">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-1">Vorher (Overflow):</p>
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-3">
          <div className="overflow-visible whitespace-nowrap text-sm text-foreground">
            Diese sehr lange Texteingabe läuft über den Containerrand hinaus und verbreitert die Seite
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-1">Nachher (max-w-full + break-words):</p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="max-w-full break-words text-sm text-foreground">
            Diese sehr lange Texteingabe läuft über den Containerrand hinaus und verbreitert die Seite
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-2">Label mit Kontrast (WCAG AA ≥4.5:1):</p>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">✅ Sichtbares Label</label>
          <input type="text" placeholder="Bitte auswählen..." className={styles.input} />
          <p className="text-[10px] text-muted-foreground">+ Focus Ring + Placeholder + Touch-Feedback</p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground mb-2">Gleichmäßiges Datum (4-Punkt-Spacing):</p>
        <div className="flex items-center gap-3 text-sm">
          <Calendar size={14} className="text-muted-foreground flex-shrink-0" />
          <span className="text-foreground tabular-nums">14.05.2026</span>
          <span className="text-muted-foreground">—</span>
          <span className="text-foreground tabular-nums">28.05.2026</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────
const categories = [
  {
    id: 'a2',
    title: 'A2: Chip-Leiste zu breit',
    desc: 'Eine horizontale Chip-Leiste ist auf Mobile breiter als der Viewport. Drei Lösungsvarianten.',
    variants: [
      { name: 'Horizontal-Scroll', comp: <ChipHorizontalScroll /> },
      { name: 'Wrap + Show More', comp: <ChipWrapShowMore /> },
      { name: 'Progressive Disclosure', comp: <ChipProgressiveDisclosure /> },
    ],
  },
  {
    id: 'b1',
    title: 'B1: Violettes Panel ersetzen',
    desc: 'Ein violettes Panel ist auf Mobile ungeeignet. Alternative Darstellungsformen.',
    variants: [
      { name: 'Bottom Sheet', comp: <PanelBottomSheet /> },
      { name: 'Action Sheet', comp: <PanelActionSheet /> },
      { name: 'Accordion', comp: <PanelAccordion /> },
    ],
  },
  {
    id: 'b3',
    title: 'B3: Tabelle auf Mobile',
    desc: 'Tabellen mit vielen Spalten sind auf Mobile zu breit. Drei Darstellungsvarianten.',
    variants: [
      { name: 'Card View', comp: <TableCardView /> },
      { name: 'Priorisierte Spalten', comp: <TablePrioritized /> },
      { name: 'Horizontal-Scroll + Sticky', comp: <TableHorizontalScroll /> },
    ],
  },
  {
    id: 'c2',
    title: 'C2: Wochentag-Labels kürzen',
    desc: 'Voll ausgeschriebene Wochentage passen nicht auf Mobile. Drei Kürzungsstrategien.',
    variants: [
      { name: 'Intl-Formater (Viewport)', comp: <DayLabelsIntl /> },
      { name: 'CSS Container Queries', comp: <DayLabelsCQ /> },
      { name: 'Feste Abkürzung', comp: <DayLabelsFixed /> },
    ],
  },
  {
    id: 'd1',
    title: 'D1: Zeitfelder überlappend',
    desc: 'Start- und Endzeit-Felder überlappen auf Mobile. Drei Layout-Varianten.',
    variants: [
      { name: 'Untereinander (Stacked)', comp: <TimeFieldsStacked /> },
      { name: 'Nebeneinander', comp: <TimeFieldsSideBySide /> },
      { name: 'Native Inputs + Dauer', comp: <TimeFieldsNative /> },
    ],
  },
  {
    id: 'd2',
    title: 'D2: Gantt auf Mobile',
    desc: 'Der Gantt-Chart ist auf Mobile unbenutzbar. Drei Alternativen.',
    variants: [
      { name: 'Timeline-Liste', comp: <TimelineList /> },
      { name: 'Calendar Widget', comp: <CalendarWidget /> },
      { name: 'Nur Desktop', comp: <DesktopOnly /> },
    ],
  },
  {
    id: 'f1',
    title: 'F1: Violett-Kontrast',
    desc: 'Violette Elemente haben zu wenig Kontrast. Drei Lösungsansätze.',
    variants: [
      { name: 'Dunklere Palette', comp: <ColorDarkerViolet /> },
      { name: 'Durch Indigo ersetzen', comp: <ColorReplaceIndigo /> },
      { name: 'Farbe + Icon', comp: <ColorWithIcon /> },
    ],
  },
  {
    id: 'pro',
    title: '💎 Gemini Pro: Architectural Refinements',
    desc: 'Erweiterte UX-Paradigmen für den dev2-Build: Fluid Typography, Pulsing Affordance & Glassmorphism.',
    variants: [
      { 
        name: 'Liquid Typography', 
        comp: (
          <div className="space-y-4">
            <div className="p-3 border border-border rounded-lg">
              <p className="text-[10px] text-muted-foreground mb-2">Standard (text-sm):</p>
              <p className="text-sm">Dieser Text hat eine feste Größe von 14px.</p>
            </div>
            <div className="p-3 border border-indigo-500/30 bg-indigo-500/5 rounded-lg">
              <p className="text-[10px] text-indigo-400 mb-2">Gemini Liquid (text-liquid-base):</p>
              <p className="text-liquid-base">Dieser Text atmet mit dem Viewport (14px-16px fließend).</p>
            </div>
          </div>
        )
      },
      { 
        name: 'Pulsing Affordance', 
        comp: (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className={styles.label}>Pflichtfeld (Leer)</label>
              <div className="pulse-affordance rounded-lg">
                <input type="text" placeholder="Hier tippen..." className={styles.input} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">→ Zieht den Fokus sanft auf leere, notwendige Inputs.</p>
          </div>
        )
      },
      { 
        name: 'Glassmorphism', 
        comp: (
          <div className="relative h-32 w-full rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-teal-500 p-4">
            <div className="glass-premium absolute inset-4 rounded-lg flex items-center justify-center text-white text-xs font-medium">
              Elevated Glass Layer
            </div>
          </div>
        )
      },
    ],
  },
];

export default function PreviewPage() {
  const [activeTab, setActiveTab] = useState<string>('a2');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className={styles.pageTitle}>🎨 UX/UI Lösungs-Preview</h1>
        <p className={styles.pageSub}>
          Alle Lösungsvarianten aus dem BUILD-Masterplan zum direkten Vergleich.
          Wähle eine Kategorie aus und vergleiche die Optionen.
        </p>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {categories.map(cat => (
            <button key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`${styles.btn} text-xs ${activeTab === cat.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {cat.title.split(':')[0]}
            </button>
          ))}
        </div>

        {/* Active Category */}
        {categories.filter(c => c.id === activeTab).map(cat => (
          <div key={cat.id}>
            <h2 className={styles.sectionTitle}>{cat.title}</h2>
            <p className={styles.sectionDesc}>{cat.desc}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cat.variants.map((v, i) => (
                <div key={i} className={styles.card}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <h3 className={styles.cardTitle}>{v.name}</h3>
                  </div>
                  <div className="preview-content">
                    {v.comp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Single-Solution Section */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className={styles.sectionTitle}>✅ Single-Solution Fixes (direkt implementiert)</h2>
          <p className={styles.pageSub}>Diese Lösungen sind eindeutig und wurden bereits im Masterplan dokumentiert.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>E1: User-ID statt Name</h3>
              <UserSelectCorrect />
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>A1 / C1 / C3 / B2: Globale Fixes</h3>
              <GlobalFixDemo />
            </div>
          </div>
          {/* B2 Collapsible extra */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>B2: Collapsible Panel</h3>
              <CollapsibleSection title="Projektdetails" defaultOpen={true}>
                Hier können Projektdetails, Aufgaben und Einstellungen platzsparend dargestellt werden. Ein Klick auf den Header klappt den Inhalt auf oder zu.
              </CollapsibleSection>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>B2: Weitere Section</h3>
              <CollapsibleSection title="Team-Mitglieder">
                Liste aller Teammitglieder mit Rollen und Berechtigungen. Diese Section ist standardmäßig zugeklappt.
              </CollapsibleSection>
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>B2: Einstellungen</h3>
              <CollapsibleSection title="Erweiterte Einstellungen">
                Optionen für Benachrichtigungen, Integrationen und API-Zugriff.
              </CollapsibleSection>
            </div>
          </div>
        </div>

        {/* Validation Summary */}
        <div className="mt-12 pt-8 border-t border-border">
          <h2 className={styles.sectionTitle}>📋 Validierungs-Checkliste</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {[
              '320px: Kein horizontales Scrolling',
              '375px: Touch-Targets ≥44px',
              '768px: Tabelle↔Cards Layoutwechsel',
              'Dark Mode: Kontrast ≥4.5:1',
              'Console: Keine Overflow-Warnungen',
              'Datenfelder: Keine IDs als Display',
            ].map(item => (
              <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Circle size={6} className="fill-muted-foreground" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
