import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FilePlus } from 'lucide-react';
import { withAdminPB, verifyUserSession } from '@/lib/pocketbase-server';
import { DailySiteReportForm } from '@/components/craft/DailySiteReportForm';
import { t } from '@/lib/i18n';
import type { ProjectRecord } from '@/lib/pocketbase-types';

interface NewSiteReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewSiteReportPage({ params }: NewSiteReportPageProps) {
  const user = await verifyUserSession();
  if (!user) notFound();

  const { id } = await params;

  const project = await withAdminPB(async (pb) => {
    try {
      const rec = await pb.collection('projects').getOne(id);
      return JSON.parse(JSON.stringify(rec)) as ProjectRecord;
    } catch {
      return null;
    }
  });

  if (!project) notFound();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href={`/projects/${id}/site-reports`}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zurück zur Übersicht
        </Link>
        <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
          Modul M007: VIBE Craft
        </span>
      </div>

      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
            <FilePlus className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Neuer Bautagesbericht
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Projekt: <span className="font-semibold text-gray-900 dark:text-white">{project.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Full Form */}
      <DailySiteReportForm projectId={id} />
    </div>
  );
}
