'use client';

import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import type { TaskRecord, ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';
import { formatGanttDate as formatDate, statusToProgress, buildCustomClass, type GanttTask, type GanttProjectGroup } from '@/lib/gantt-utils';

export type { GanttTask, GanttProjectGroup };

export interface GanttData {
    /** Flat list passed to frappe‑gantt */
    tasks: GanttTask[];
    /** Raw TaskRecord[] for Kanban/ListView */
    rawTasks: TaskRecord[];
    /** Grouped by project for the sidebar tree */
    groups: GanttProjectGroup[];
    /** Lookup maps */
    projectMap: Record<string, ProjectRecord>;
    userMap: Record<string, UserRecord>;
    clientMap: Record<string, ClientRecord>;
    projectClientMap: Record<string, string>;
    /** Task id → status mapping for DOM post-processing in GanttView */
    taskStatusMap: Record<string, string>;
    /** Loading / error state */
    isLoading: boolean;
    error: string | null;
    /** Refresh function */
    refresh: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useGanttData(): GanttData {
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [rawTasks, setRawTasks] = useState<TaskRecord[]>([]);
    const [groups, setGroups] = useState<GanttProjectGroup[]>([]);
    const [projectMap, setProjectMap] = useState<Record<string, ProjectRecord>>({});
    const [userMap, setUserMap] = useState<Record<string, UserRecord>>({});
    const [taskStatusMap, setTaskStatusMap] = useState<Record<string, string>>({});
    const [clientMap, setClientMap] = useState<Record<string, ClientRecord>>({});
    const [projectClientMap, setProjectClientMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Fetch projects + clients
            const [projectsResult, clientsResult] = await Promise.all([
                pb.collection('projects').getList(1, 100, {
                    sort: 'name',
                    expand: 'client',
                }),
                pb.collection('clients').getList(1, 100, { sort: 'name' }),
            ]);
            const projects = projectsResult.items as ProjectRecord[];
            const pMap: Record<string, ProjectRecord> = {};
            const pcMap: Record<string, string> = {};
            for (const p of projects) {
                pMap[p.id] = p;
                pcMap[p.id] = (p as any).client || '';
            }
            setProjectMap(pMap);
            setProjectClientMap(pcMap);

            const clients = clientsResult.items as ClientRecord[];
            const cMap: Record<string, ClientRecord> = {};
            for (const c of clients) {
                cMap[c.id] = c;
            }
            setClientMap(cMap);

            // 2. Fetch users (getFullList to ensure all users are available for member lookup)
            const users = await pb.collection('users').getFullList({ sort: 'name' }) as UserRecord[];
            const uMap: Record<string, UserRecord> = {};
            for (const u of users) {
                uMap[u.id] = u;
            }
            setUserMap(uMap);

            // 3. Fetch tasks (all, including done – so the gantt shows full timeline)
            const tasksResult = await pb.collection('tasks').getList(1, 200, {
                sort: 'start_date',
                expand: 'project,assignees',
            });
            const rawTasks = tasksResult.items as TaskRecord[];
            setRawTasks(rawTasks);

            // 4. Transform into GanttTask[]
            const ganttTasks: GanttTask[] = [];
            const groupMap: Record<string, GanttTask[]> = {};

            for (const t of rawTasks) {
                // Ensure we have at least a fallback date
                const startRaw = t.start_date || t.created;
                const endRaw = t.due_date;

                const start = formatDate(startRaw);
                if (!start) continue; // Skip if still invalid

                let end = formatDate(endRaw);
                
                // If no end date or end date is invalid, default to start + 3 days
                if (!end) {
                    const d = new Date(start);
                    d.setDate(d.getDate() + 3);
                    end = formatDate(d);
                }

                // Final safety: Ensure end >= start
                const startDateObj = new Date(start);
                const endDateObj = new Date(end);
                const finalEnd = endDateObj < startDateObj ? start : end;

                const ganttTask: GanttTask = {
                    id: t.id,
                    name: t.title || 'Unbenannte Aufgabe',
                    start,
                    end: finalEnd,
                    progress: statusToProgress(t.status),
                    dependencies: t.parent_task || '',
                    custom_class: buildCustomClass(t),
                };

                ganttTasks.push(ganttTask);

                // Group by project
                const pid = t.project;
                if (!groupMap[pid]) groupMap[pid] = [];
                groupMap[pid].push(ganttTask);
            }

            setTasks(ganttTasks);

            // Build task id → status map for GanttView DOM post-processing
            const statusMap: Record<string, string> = {};
            for (const t of rawTasks) {
                statusMap[t.id] = t.status;
            }
            setTaskStatusMap(statusMap);

            // 5. Build groups
            const gGroups: GanttProjectGroup[] = projects
                .filter((p) => groupMap[p.id] && groupMap[p.id].length > 0)
                .map((p) => ({
                    projectId: p.id,
                    projectName: p.name,
                    projectKey: p.key,
                    tasks: groupMap[p.id],
                }));

            // 6. Validate dependencies: frappe-gantt crashes if a dependency
            //    references a task ID not present in the current tasks array
            const validTaskIds = new Set(ganttTasks.map(t => t.id));
            for (const t of ganttTasks) {
                if (t.dependencies && !validTaskIds.has(t.dependencies)) {
                    t.dependencies = '';
                }
            }

            setGroups(gGroups);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
            console.error('[useGanttData]', err);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { tasks, rawTasks, groups, projectMap, userMap, clientMap, projectClientMap, taskStatusMap, isLoading, error, refresh: fetchData };
}
