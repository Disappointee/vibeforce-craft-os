'use client';

import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Loader2, Trash2, FileJson } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { ReportTemplateRecord, ReportTemplateConfig } from '@/lib/pocketbase-types';
import { toast } from 'sonner';
import { ReportFilterValues } from './ReportFilters';

interface SaveTemplateDialogProps {
    currentFilters: ReportFilterValues;
    onLoadTemplate: (filters: ReportFilterValues) => void;
}

export function SaveTemplateDialog({ currentFilters, onLoadTemplate }: SaveTemplateDialogProps) {
    const [open, setOpen] = useState(false);
    const [templates, setTemplates] = useState<ReportTemplateRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const fetchTemplates = async () => {
        setIsLoading(true);
        try {
            const result = await pb.collection('report_templates').getList(1, 50, {
                sort: '-created',
            });
            setTemplates(result.items as ReportTemplateRecord[]);
        } catch (error) {
            console.error('Failed to fetch templates:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchTemplates();
        }
    }, [open]);

    const handleSave = async () => {
        if (!templateName.trim()) {
            toast.error('Bitte gib einen Namen für die Vorlage ein');
            return;
        }

        setIsSaving(true);
        try {
            const config: ReportTemplateConfig = {
                dateFrom: currentFilters.dateFrom || undefined,
                dateTo: currentFilters.dateTo || undefined,
                projectIds: currentFilters.projectIds.length > 0 ? currentFilters.projectIds : undefined,
                userIds: currentFilters.userIds.length > 0 ? currentFilters.userIds : undefined,
                clientIds: currentFilters.clientIds.length > 0 ? currentFilters.clientIds : undefined,
                billableFilter: currentFilters.billableFilter !== 'all' ? currentFilters.billableFilter : undefined,
                groupBy: currentFilters.groupBy,
            };

            await pb.collection('report_templates').create({
                name: templateName.trim(),
                user: pb.authStore.record?.id,
                config: config,
            });

            toast.success('Vorlage gespeichert');
            setTemplateName('');
            fetchTemplates();
        } catch (error) {
            console.error('Failed to save template:', error);
            toast.error('Fehler beim Speichern der Vorlage');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLoad = (template: ReportTemplateRecord) => {
        const config = template.config as ReportTemplateConfig | undefined;
        if (!config) return;

        onLoadTemplate({
            dateFrom: config.dateFrom || '',
            dateTo: config.dateTo || '',
            projectIds: config.projectIds || [],
            userIds: config.userIds || [],
            clientIds: config.clientIds || [],
            billableFilter: config.billableFilter || 'all',
            groupBy: config.groupBy || 'project',
        });

        toast.success(`Vorlage "${template.name}" geladen`);
        setOpen(false);
    };

    const handleDelete = async (template: ReportTemplateRecord) => {
        try {
            await pb.collection('report_templates').delete(template.id);
            toast.success('Vorlage gelöscht');
            fetchTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            toast.error('Fehler beim Löschen der Vorlage');
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button variant="outline" size="sm">
                        <Save size={16} />
                        Vorlagen
                    </Button>
                }
            />
            <DialogContent className="bg-background border-border text-foreground sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-foreground">Auswertungsvorlagen</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Speichere deine aktuelle Filterkonfiguration oder lade eine gespeicherte Vorlage.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Save new template */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Neue Vorlage speichern</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Vorlagen-Name…"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="bg-card border-border flex-1"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSave();
                                }}
                            />
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !templateName.trim()}
                                size="sm"
                            >
                                {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Speichern
                            </Button>
                        </div>
                    </div>

                    {/* Saved templates list */}
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs uppercase tracking-wider">Gespeicherte Vorlagen</Label>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-4">
                                    <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                </div>
                            ) : templates.length === 0 ? (
                                <p className="text-muted-foreground text-sm py-2 text-center">
                                    Noch keine Vorlagen gespeichert
                                </p>
                            ) : (
                                templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-card transition-colors group"
                                    >
                                        <button
                                            onClick={() => handleLoad(template)}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            <FileJson size={14} className="text-indigo-400 shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-sm text-foreground truncate">{template.name}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {new Date(template.created).toLocaleDateString('de-DE')}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template)}
                                            className="p-1 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            title="Löschen"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter showCloseButton>
                    <span />
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
