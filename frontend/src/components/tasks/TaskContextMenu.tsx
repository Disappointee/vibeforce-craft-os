'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MoreVertical, Timer, UserCheck, ExternalLink, Link, Trash2 } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { TaskRecord, TaskStatus, TaskPriority } from '@/lib/pocketbase-types';
import { toast } from 'sonner';
import { useTimerStore } from '@/lib/store';
import { updateTaskAction, deleteTaskAction } from '@/app/actions/tasks';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskContextMenuProps {
    task: TaskRecord;
    onViewDetails: (taskId: string) => void;
    onUpdated: () => void;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
    { value: 'todo', label: 'Offen' },
    { value: 'in_progress', label: 'In Arbeit' },
    { value: 'review', label: 'Prüfung' },
    { value: 'done', label: 'Erledigt' },
];

const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
    { value: 'acute', label: 'Akut' },
    { value: 'high', label: 'Hoch' },
    { value: 'medium', label: 'Mittel' },
    { value: 'low', label: 'Niedrig' },
];

export function TaskContextMenu({ task, onViewDetails, onUpdated }: TaskContextMenuProps) {
    const router = useRouter();
    const { startTimer } = useTimerStore();
    const [users, setUsers] = useState<any[]>([]);

    useEffect(() => {
        pb.collection('users').getFullList({ sort: 'name' })
            .then(res => setUsers(res))
            .catch(err => console.error('Failed to load users for assignee select:', err));
    }, []);

    const handleStartTimer = async () => {
        try {
            await startTimer(task.id, task.title);
            toast.success(`Timer gestartet für: ${task.title}`);
        } catch {
            toast.error('Timer konnte nicht gestartet werden');
        }
    };

    const handleCopyLink = () => {
        const url = `${window.location.origin}/tasks?taskId=${task.id}`;
        navigator.clipboard.writeText(url);
        toast.success('Link in Zwischenablage kopiert');
    };

    const handleDeleteTask = async () => {
        try {
            await deleteTaskAction(task.id);
            toast.success('Aufgabe gelöscht');
            router.refresh();
            onUpdated();
        } catch {
            toast.error('Fehler beim Löschen der Aufgabe');
        }
    };

    const handleAssigneeChange = async (userId: string) => {
        const currentAssignees = Array.isArray(task.assignees)
            ? task.assignees
            : (task.assignees ? [task.assignees] : []);
        const isAssigned = currentAssignees.includes(userId);
        const newAssignees = isAssigned
            ? currentAssignees.filter((id: string) => id !== userId)
            : [...currentAssignees, userId];

        try {
            await updateTaskAction(task.id, { assignees: newAssignees });
            toast.success('Zuständigkeit geändert');
            router.refresh();
            onUpdated();
        } catch {
            toast.error('Zuständigkeit konnte nicht geändert werden');
        }
    };

    const handleStatusChange = async (newStatus: TaskStatus) => {
        if (newStatus === task.status) return;
        try {
            await updateTaskAction(task.id, { status: newStatus });
            toast.success(`Status auf „${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}" geändert`);
            router.refresh();
            onUpdated();
        } catch {
            toast.error('Status konnte nicht geändert werden');
        }
    };

    const handlePriorityChange = async (newPriority: TaskPriority) => {
        if (newPriority === task.priority) return;
        try {
            await updateTaskAction(task.id, { priority: newPriority });
            toast.success(`Priorität auf „${PRIORITY_OPTIONS.find(p => p.value === newPriority)?.label}" geändert`);
            router.refresh();
            onUpdated();
        } catch {
            toast.error('Priorität konnte nicht geändert werden');
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-accent-foreground transition-opacity focus:opacity-100 data-popup-open:opacity-100"
                onClick={(e) => e.stopPropagation()}
            >
                <MoreVertical size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="end"
                className="w-48 bg-popover border-border"
                onClick={(e) => e.stopPropagation()}
            >
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails(task.id); }}>
                    <ExternalLink size={14} className="mr-2" />
                    Details öffnen
                </DropdownMenuItem>

                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCopyLink(); }}>
                    <Link size={14} className="mr-2" />
                    Link kopieren
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        Status ändern
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border-border">
                        {STATUS_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handleStatusChange(opt.value); }}
                                disabled={task.status === opt.value}
                                className={task.status === opt.value ? 'opacity-50' : ''}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        Priorität ändern
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border-border">
                        {PRIORITY_OPTIONS.map((opt) => (
                            <DropdownMenuItem
                                key={opt.value}
                                onClick={(e) => { e.stopPropagation(); handlePriorityChange(opt.value); }}
                                disabled={task.priority === opt.value}
                                className={task.priority === opt.value ? 'opacity-50' : ''}
                            >
                                {opt.label}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartTimer(); }}>
                    <Timer size={14} className="mr-2" />
                    Zeit erfassen
                </DropdownMenuItem>

                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <UserCheck size={14} className="mr-2" />
                        <span>Zuständigkeit ändern</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="bg-popover border-border max-h-56 overflow-y-auto">
                        {users.map((u) => {
                            const isAssigned = Array.isArray(task.assignees)
                                ? task.assignees.includes(u.id)
                                : (task.assignees === u.id);
                            return (
                                <DropdownMenuItem
                                    key={u.id}
                                    onClick={(e) => { e.stopPropagation(); handleAssigneeChange(u.id); }}
                                    className="flex items-center justify-between"
                                >
                                    <span>{u.name || u.email}</span>
                                    {isAssigned && <span className="text-[10px] bg-primary text-black font-semibold px-1.5 py-0.5 rounded">Ja</span>}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={(e) => { e.stopPropagation(); handleDeleteTask(); }}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                >
                    <Trash2 size={14} className="mr-2 text-red-400" />
                    Aufgabe löschen
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
