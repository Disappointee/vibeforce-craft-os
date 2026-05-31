'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Synchronizes vertical scrolling between a sidebar (table/tree) and
 * a Gantt chart so that rows stay aligned.
 *
 * Uses native DOM event listeners with requestAnimationFrame throttling
 * to avoid jitter from React re-render cycles.
 */
export function useGanttSync() {
    const sidebarRef = useRef<HTMLDivElement>(null);
    const ganttRef = useRef<HTMLDivElement>(null);
    const isSyncing = useRef(false);
    const rafId = useRef<number>(0);

    useEffect(() => {
        const sidebar = sidebarRef.current;
        const gantt = ganttRef.current;
        if (!sidebar || !gantt) return;

        let source: 'sidebar' | 'gantt' | null = null;

        const handleSidebarScroll = () => {
            if (isSyncing.current) return;
            source = 'sidebar';
            isSyncing.current = true;
            cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                if (ganttRef.current) {
                    ganttRef.current.scrollTop = sidebar.scrollTop;
                }
                isSyncing.current = false;
            });
        };

        const handleGanttScroll = () => {
            if (isSyncing.current) return;
            source = 'gantt';
            isSyncing.current = true;
            cancelAnimationFrame(rafId.current);
            rafId.current = requestAnimationFrame(() => {
                if (sidebarRef.current) {
                    sidebarRef.current.scrollTop = gantt.scrollTop;
                }
                isSyncing.current = false;
            });
        };

        sidebar.addEventListener('scroll', handleSidebarScroll, { passive: true });
        gantt.addEventListener('scroll', handleGanttScroll, { passive: true });

        return () => {
            sidebar.removeEventListener('scroll', handleSidebarScroll);
            gantt.removeEventListener('scroll', handleGanttScroll);
            cancelAnimationFrame(rafId.current);
        };
    }, []);

    /** Call when sidebar becomes visible / mounts to force re-bind if needed */
    const resync = useCallback(() => {
        // Force a small nudge to trigger scroll sync on both sides
        if (sidebarRef.current) {
            sidebarRef.current.scrollTop += 1;
            sidebarRef.current.scrollTop -= 1;
        }
    }, []);

    return { sidebarRef, ganttRef, resync };
}
