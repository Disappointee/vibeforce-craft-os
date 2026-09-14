'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Timer, Layers, HardHat } from 'lucide-react';
import type { ProjectRecord } from '@/lib/pocketbase-types';
import { MonteurTimeClock } from '@/components/craft/MonteurTimeClock';

interface MonteurTimeClockClientProps {
  initialProjects: ProjectRecord[];
}

export function MonteurTimeClockClient({
  initialProjects,
}: MonteurTimeClockClientProps) {
  return (
    <div className="w-full space-y-4">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <Link
          href="/craft"
          className="hover:text-foreground inline-flex items-center gap-1.5 transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Zurück zur Handwerks-Zentrale</span>
        </Link>
        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
          Vibeforce Craft OS · Stufe 3 Terminal
        </span>
      </div>

      {/* Main Monteur-Terminal */}
      <MonteurTimeClock projects={initialProjects} />
    </div>
  );
}
