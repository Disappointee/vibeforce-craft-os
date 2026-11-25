'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Command } from 'cmdk';
import {
    Search,
    Plus,
    Clock,
    LayoutDashboard,
    Settings,
    Users,
    FileText,
    ArrowRight,
    Building2,
    Timer,
    CheckSquare,
    BarChart3
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import { useUiStore } from '@/lib/store';
import { isCraftMode } from '@/config/app-mode';
import { filterProjectsByMode, filterTasksByMode } from '@/lib/data-isolation';

export function CommandPalette() {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<{ projects: any[], tasks: any[] }>({ projects: [], tasks: [] });
    const router = useRouter();

    // Toggle the menu when ⌘K is pressed
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const fetchResults = useCallback(async (query: string) => {
        try {
            const projectFilter = query
                ? pb.filter('name ~ {:q} || key ~ {:q}', { q: query })
                : '';
            const projectPromise = pb.collection('projects').getList(1, 8, {
                filter: projectFilter,
                sort: '-updated'
            });
            const taskPromise = query
                ? pb.collection('tasks').getList(1, 5, {
                    filter: pb.filter('title ~ {:q}', { q: query }),
                    sort: '-updated'
                })
                : Promise.resolve({ items: [] });

            const [projects, tasks] = await Promise.all([projectPromise, taskPromise]);

            setResults({
                projects: filterProjectsByMode(projects.items),
                tasks: filterTasksByMode(tasks.items as any[])
            });
        } catch (err) {
            console.error('Search failed:', err);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults(search);
        }, 200);
        return () => clearTimeout(timer);
    }, [search, fetchResults]);

    const runCommand = (command: () => void) => {
        setOpen(false);
        command();
    };

    const handleCreateTask = () => {
        useUiStore.getState().setTaskDialogOpen(true);
    };

    const handleCreateClient = async () => {
        router.push('/clients');
        toast.info('Kunde kann auf der Kunden-Seite erstellt werden');
    };

    const handleStartTimer = () => {
        router.push(isCraftMode() ? '/craft/time' : '/time');
        toast.info('Timer in der unteren Leiste verfügbar');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <Command
                className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/5"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') setOpen(false);
                }}
            >
                <div className="flex items-center border-b border-border px-4 h-14">
                    <Search className="mr-3 h-5 w-5 text-muted-foreground" />
                    <Command.Input
                        autoFocus
                        placeholder="Was suchst du? (Projekte, Aufgaben, Aktionen...)"
                        className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base"
                        value={search}
                        onValueChange={setSearch}
                    />
                    <div className="flex items-center gap-1 ml-2">
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-accent/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                            ESC
                        </kbd>
                    </div>
                </div>

                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                    <Command.Empty className="py-12 text-center text-sm text-muted-foreground">
                        Keine Ergebnisse gefunden.
                    </Command.Empty>

                    {/* Quick Actions */}
                    <Command.Group heading="Navigation" className="px-2 mb-2">
                        <CommandItem onSelect={() => runCommand(() => router.push('/'))}>
                            <LayoutDashboard className="mr-3 h-4 w-4 text-amber-500" />
                            <span>Dashboard</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/tasks'))}>
                            <CheckSquare className="mr-3 h-4 w-4 text-indigo-500" />
                            <span>Aufgaben</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push(isCraftMode() ? '/craft/time' : '/time'))}>
                            <Clock className="mr-3 h-4 w-4 text-amber-500" />
                            <span>{isCraftMode() ? 'Monteur-Stempeluhr' : 'Zeiterfassung'}</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/planner'))}>
                            <BarChart3 className="mr-3 h-4 w-4 text-amber-500" />
                            <span>Planer</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/projects'))}>
                            <FileText className="mr-3 h-4 w-4 text-amber-500" />
                            <span>Projekte</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/clients'))}>
                            <Building2 className="mr-3 h-4 w-4 text-blue-500" />
                            <span>Kunden</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(() => router.push('/team'))}>
                            <Users className="mr-3 h-4 w-4 text-purple-500" />
                            <span>Team</span>
                        </CommandItem>
                    </Command.Group>

                    {/* Actions */}
                    <Command.Group heading="Aktionen" className="px-2 mb-2">
                        <CommandItem onSelect={() => runCommand(handleStartTimer)}>
                            <Timer className="mr-3 h-4 w-4 text-amber-500" />
                            <span>Timer starten</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(handleCreateTask)}>
                            <Plus className="mr-3 h-4 w-4 text-indigo-500" />
                            <span>Aufgabe erstellen</span>
                        </CommandItem>
                        <CommandItem onSelect={() => runCommand(handleCreateClient)}>
                            <Building2 className="mr-3 h-4 w-4 text-blue-500" />
                            <span>Kunde anlegen</span>
                        </CommandItem>
                    </Command.Group>

                    {/* Dynamic Results */}
                    {results.projects.length > 0 && (
                        <Command.Group heading="Projekte" className="px-2 mb-2">
                            {results.projects.map((project) => (
                                <CommandItem key={project.id} onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}>
                                    <FileText className="mr-3 h-4 w-4 text-amber-500" />
                                    <div className="flex flex-col">
                                        <span>{project.name}</span>
                                        <span className="text-[10px] text-muted-foreground">{project.key}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </Command.Group>
                    )}

                    {results.tasks.length > 0 && (
                        <Command.Group heading="Aufgaben" className="px-2 mb-2">
                            {results.tasks.map((task) => (
                                <CommandItem key={task.id} onSelect={() => runCommand(() => router.push(`/tasks?id=${task.id}`))}>
                                    <ArrowRight className="mr-3 h-4 w-4 text-amber-500/50" />
                                    <span>{task.title}</span>
                                </CommandItem>
                            ))}
                        </Command.Group>
                    )}

                    <Command.Group heading="System" className="px-2">
                        <CommandItem onSelect={() => runCommand(() => router.push('/profile'))}>
                            <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                            <span>Profil & Einstellungen</span>
                        </CommandItem>
                    </Command.Group>
                </Command.List>

                <div className="flex items-center justify-between border-t border-border bg-background/50 px-4 py-3 text-[10px] text-muted-foreground font-medium">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-accent/50 px-1 font-mono">↵</kbd>
                            <span>Auswählen</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="rounded border border-border bg-accent/50 px-1 font-mono">↑↓</kbd>
                            <span>Navigieren</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary/50">
                        <Search className="h-3 w-3" />
                        <span>Vibeforce Craft OS</span>
                    </div>
                </div>
            </Command>
        </div>
    );
}

function CommandItem({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex items-center px-3 py-2.5 rounded-xl text-sm text-foreground aria-selected:bg-accent/50 aria-selected:text-white cursor-pointer transition-colors"
        >
            {children}
        </Command.Item>
    );
}
