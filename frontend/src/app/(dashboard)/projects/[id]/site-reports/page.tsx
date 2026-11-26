import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  FileText,
  ChevronRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { getUserAuthPB, requireAuth } from '@/lib/pocketbase-server';
import { getSiteReportsByProjectAction } from '@/app/actions/craft/site-reports';
import { t } from '@/lib/i18n';
import type { ProjectRecord, SiteReportRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

interface SiteReportsPageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteReportsPage({ params }: SiteReportsPageProps) {
  await requireAuth();
  const pb = await getUserAuthPB();
  if (!pb) {
    redirect('/login');
  }

  const { id } = await params;

  let project: ProjectRecord | null = null;
  try {
    const rec = await pb.collection('projects').getOne(id);
    project = JSON.parse(JSON.stringify(rec)) as ProjectRecord;
  } catch {
    project = null;
  }

  if (!project) notFound();

  let reports: SiteReportRecord[] = [];
  try {
    reports = await getSiteReportsByProjectAction(id);
  } catch (err) {
    console.warn('[SiteReportsPage] Failed to fetch site reports:', err);
    reports = [];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zum Projekt
        </Link>
        <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Modul M007: VIBE Craft
        </span>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            {t('craft.site_report.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Bautagesberichte, Regieberichte & VOB-Aufmaße für {project.name}.
          </p>
        </div>

        <Link
          href={`/projects/${id}/site-reports/new`}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          {t('craft.site_report.new')}
        </Link>
      </div>

      {/* Report List */}
      {reports.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#121824]/50">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
            {t('craft.site_report.no_reports')}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
            Erstelle den ersten Bautagesbericht inklusive Vor-Ort-Signatur und VOB-Aufmaß.
          </p>
          <Link
            href={`/projects/${id}/site-reports/new`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400"
          >
            <Plus className="w-3.5 h-3.5" />
            Jetzt ersten Bericht erfassen
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-white/5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121824] shadow-sm overflow-hidden">
          {reports.map((rep) => {
            const isSigned = rep.status === 'signed';
            return (
              <div
                key={rep.id}
                className="p-5 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] transition-colors flex items-center justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      Bericht vom {new Date(rep.report_date).toLocaleDateString('de-DE')}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        isSigned
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {isSigned ? (
                        <ShieldCheck className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {isSigned
                        ? t('craft.site_report.status_signed')
                        : t('craft.site_report.status_draft')}
                    </span>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                    {rep.work_performed || 'Keine Tätigkeitsbeschreibung angegeben.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-gray-400">
                    {rep.weather && <span>Wetter: {rep.weather}</span>}
                    {rep.client_name && <span>Kunde: {rep.client_name}</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-teal-600 dark:text-teal-400 font-medium">
                    Details
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
