import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FilePlus } from 'lucide-react';
import { withAdminPB, getUserAuthPB, requireAuth } from '@/lib/pocketbase-server';
import { DailySiteReportForm } from '@/components/craft/DailySiteReportForm';
import type { ProjectRecord } from '@/lib/pocketbase-types';

export const dynamic = 'force-dynamic';

interface NewSiteReportPageProps {
  params: Promise<{ id: string }>;
}

export default async function NewSiteReportPage({ params }: NewSiteReportPageProps) {
  await requireAuth();
  const userPb = await getUserAuthPB();
  if (!userPb) {
    redirect('/login');
  }

  const { id } = await params;

  let project: ProjectRecord | null = null;
  try {
    project = await withAdminPB(async (pb) => {
      const rec = await pb.collection('projects').getOne(id);
      return JSON.parse(JSON.stringify(rec)) as ProjectRecord;
    });
  } catch {
    try {
      const rec = await userPb.collection('projects').getOne(id);
      project = JSON.parse(JSON.stringify(rec)) as ProjectRecord;
    } catch {
      project = null;
    }
  }

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
