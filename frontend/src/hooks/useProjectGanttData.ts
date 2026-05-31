'use client';

import { useEffect, useState, useCallback } from 'react';
import { pb } from '@/lib/pocketbase';
import type { TaskRecord, ClientRecord } from '@/lib/pocketbase-types';
import { formatGanttDate as formatDate, statusToProgress, buildCustomClass, type GanttTask, type GanttProjectGroup } from '@/lib/gantt-utils';

export type { GanttTask, GanttProjectGroup };

export interface ProjectGanttData {
    tasks: GanttTask[];
    rawTasks: TaskRecord[];
    groups: GanttProjectGroup[];
    clientMap: Record<string, ClientRecord>;
    taskStatusMap: Record<string, string>;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

export function useProjectGanttData(projectId: string): ProjectGanttData {
    const [tasks, setTasks] = useState<GanttTask[]>([]);
    const [rawTasks, setRawTasks] = useState<TaskRecord[]>([]);
    const [groups, setGroups] = useState<GanttProjectGroup[]>([]);
    const [taskStatusMap, setTaskStatusMap] = useState<Record<string, string>>({});
    const [clientMap, setClientMap] = useState<Record<string, ClientRecord>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!projectId || projectId.length < 15 || projectId.startsWith('[')) return;

        setIsLoading(true);
        setError(null);

        try {
            const [project, clientsResult] = await Promise.all([
                pb.collection('projects').getOne(projectId),
                pb.collection('clients').getFullList({ sort: 'name' }),
            ]);

            const cMap: Record<string, ClientRecord> = {};
            for (const c of clientsResult as ClientRecord[]) {
                cMap[c.id] = c;
            }
            setClientMap(cMap);

            const tasksResult = await pb.collection('tasks').getList(1, 200, {
                filter: pb.filter('project = {:id}', { id: projectId }),
                sort: 'start_date',
                expand: 'project,assignees',
            });
            const raw = tasksResult.items as TaskRecord[];
            setRawTasks(raw);

            const ganttTasks: GanttTask[] = [];
            for (const t of raw) {
                const startRaw = t.start_date || t.created;
                const endRaw = t.due_date;

                const start = formatDate(startRaw);
                if (!start) continue;

                let end = formatDate(endRaw);
                if (!end) {
                    const d = new Date(start);
                    d.setDate(d.getDate() + 3);
                    end = formatDate(d);
                }

                const ganttTask: GanttTask = {
                    id: t.id,
                    name: t.title || 'Unbenannte Aufgabe',
                    start,
                    end,
                    progress: statusToProgress(t.status),
                    dependencies: t.parent_task || '',
                    custom_class: buildCustomClass(t),
                };

                ganttTasks.push(ganttTask);
            }

            const validTaskIds = new Set(ganttTasks.map(t => t.id));
            for (const t of ganttTasks) {
                if (t.dependencies && !validTaskIds.has(t.dependencies)) {
                    t.dependencies = '';
                }
            }

            setTasks(ganttTasks);

            const statusMap: Record<string, string> = {};
            for (const t of raw) {
                statusMap[t.id] = t.status;
            }
            setTaskStatusMap(statusMap);

            const pName = (project as any).name || 'Projekt';
            const pKey = (project as any).key || '';
            setGroups(ganttTasks.length > 0
                ? [{ projectId, projectName: pName, projectKey: pKey, tasks: ganttTasks }]
                : []
            );
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Unbekannter Fehler';
            console.error('[useProjectGanttData]', err);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return { tasks, rawTasks, groups, clientMap, taskStatusMap, isLoading, error, refresh: fetchData };
}
