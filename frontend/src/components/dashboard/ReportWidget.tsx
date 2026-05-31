'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BarChart3, TrendingUp, DollarSign, Receipt, ChevronRight, FileJson, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { pb } from '@/lib/pocketbase';
import type { ReportTemplateRecord } from '@/lib/pocketbase-types';

interface PresetAction {
  icon: typeof BarChart3;
  label: string;
  description: string;
}

const PRESETS: PresetAction[] = [
  { icon: BarChart3, label: 'Monatliche Übersicht', description: 'Nach Monat / Mitarbeiter' },
  { icon: TrendingUp, label: 'Erfasst vs. geplant', description: 'Budget-Prüfung' },
  { icon: DollarSign, label: 'Abrechenbarkeit', description: 'Nur abrechenbare Zeiten' },
];

export function DashboardReportWidget() {
  const router = useRouter();
  const [templates, setTemplates] = useState<ReportTemplateRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const result = await pb.collection('report_templates').getList(1, 3, {
          sort: '-created',
        });
        setTemplates(result.items as ReportTemplateRecord[]);
      } catch {
        // Templates are optional — fail silently
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  return (
    <Card className="border-border bg-card/40 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-indigo-400" />
          <CardTitle className="text-foreground text-base font-semibold">
            Berichte & Auswertungen
          </CardTitle>
        </div>
        <Link
          href="/reports"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          Alle Auswertungen
          <ChevronRight size={14} />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {PRESETS.map((preset, idx) => {
            const Icon = preset.icon;
            return (
              <button
                key={idx}
                onClick={() => router.push('/reports')}
                className="p-3 rounded-xl bg-card/60 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-all text-left group"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 w-fit mb-2 group-hover:scale-110 transition-transform">
                  <Icon size={16} />
                </div>
                <div className="text-sm font-medium text-white leading-tight">{preset.label}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{preset.description}</div>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full bg-muted rounded-lg" />
          </div>
        ) : templates.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
              Gespeicherte Vorlagen
            </p>
            <div className="space-y-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => router.push('/reports')}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/20 transition-colors text-left"
                >
                  <FileJson size={14} className="text-indigo-400 shrink-0" />
                  <span className="text-sm text-foreground truncate">{template.name}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                    {new Date(template.created).toLocaleDateString('de-DE')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
