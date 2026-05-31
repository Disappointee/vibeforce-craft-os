export interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress: number;
    dependencies: string;
    custom_class: string;
}

export interface GanttProjectGroup {
    projectId: string;
    projectName: string;
    projectKey: string;
    tasks: GanttTask[];
}

export function formatGanttDate(dateVal: string | Date | undefined): string {
    if (!dateVal) return '';
    if (typeof dateVal === 'string') {
        const match = dateVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    }
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) return '';
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export function statusToProgress(status: string): number {
    switch (status) {
        case 'todo': return 0;
        case 'in_progress': return 35;
        case 'review': return 70;
        case 'done': return 100;
        default: return 0;
    }
}

export function buildCustomClass(task: { priority: string }): string {
    return `gantt-priority-${task.priority}`;
}
