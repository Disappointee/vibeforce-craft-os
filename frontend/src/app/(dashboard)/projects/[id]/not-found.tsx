import Link from 'next/link';
import { Hammer, FolderKanban } from 'lucide-react';

export default function ProjectNotFound() {
  return (
    <div className="h-full min-h-[60vh] p-8 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-sm">
            <Hammer size={32} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Baustelle oder Projekt nicht gefunden
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Der angeforderte Datensatz existiert nicht mehr, wurde archiviert oder die Verlinkung ist ungültig.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/craft"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-sm transition-colors"
          >
            <Hammer size={16} />
            Zu den Baustellen
          </Link>
          <Link
            href="/projects"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border bg-card hover:bg-muted text-foreground transition-colors"
          >
            <FolderKanban size={16} />
            Zur Projektübersicht
          </Link>
        </div>
      </div>
    </div>
  );
}