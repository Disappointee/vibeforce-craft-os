'use client';

import { useState } from 'react';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TimeEntryRecord } from '@/lib/pocketbase-types';
import { toast } from 'sonner';
import { pb } from '@/lib/pocketbase';
import { buildStundenreportInput, formatHoursHM } from '@/lib/stundenreport-utils';

interface TimeExportButtonProps {
    entries: TimeEntryRecord[];
}

export function TimeExportButton({ entries }: TimeExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false);

    const getDateRange = () => {
        const dates = entries
            .map(entry => entry.date || entry.created.split('T')[0])
            .filter(Boolean)
            .sort();
        if (dates.length === 0) return new Date().toISOString().split('T')[0];
        const first = dates[0];
        const last = dates[dates.length - 1];
        return first === last ? first : `${first}_bis_${last}`;
    };

    const handlePDFExport = async () => {
        if (entries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }

        const reportData = buildStundenreportInput(entries);

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Bitte Pop-ups für diese Seite erlauben');
            return;
        }
        printWindow.document.write('<html><body style="font-family:sans-serif;padding:40px;text-align:center;color:#666;"><p>Report wird generiert…</p></body></html>');

        try {
            setIsExporting(true);

            const res = await fetch('/api/reports/stundenreport-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reportData),
            });

            if (!res.ok) {
                throw new Error(`API error: ${res.status}`);
            }

            const contentType = res.headers.get('content-type') || '';

            if (contentType.includes('application/pdf')) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                printWindow.location.href = url;
                toast.success('Stundenzettel (PDF) generiert');
            } else {
                const html = await res.text();
                printWindow.document.open();
                printWindow.document.write(html);
                printWindow.document.close();
            }
        } catch (error) {
            printWindow.close();
            console.error('PDF export error:', error);
            toast.error('Fehler beim PDF-Export');
        } finally {
            setIsExporting(false);
        }
    };

    const handleCSVExport = () => {
        if (entries.length === 0) {
            toast.error('Keine Daten zum Exportieren vorhanden');
            return;
        }

        try {
            setIsExporting(true);

            const headers = ['Datum', 'Kunde', 'Projekt', 'Mitarbeiter', 'Tätigkeit', 'Beschreibung', 'Dauer'].join(',');

            const lines = entries.map(entry => {
                const task = (entry as any).expand?.task;
                const project = task?.expand?.project;
                const client = project?.expand?.client;
                const user = (entry as any).expand?.user || pb.authStore.record;
                const hours = (entry.duration_minutes || 0) / 60;

                const dateObj = entry.date ? new Date(entry.date) : new Date(entry.created);
                const formattedDate = dateObj.toLocaleDateString('de-DE');

                const escapeCSV = (val: string) => {
                    const clean = val.replace(/"/g, '""');
                    return clean.includes(',') || clean.includes('\n') || clean.includes('"') ? `"${clean}"` : clean;
                };

                return [
                    formattedDate,
                    escapeCSV(client?.name || 'Kein Kunde'),
                    escapeCSV(project ? `${project.key} - ${project.name}` : 'Kein Projekt'),
                    escapeCSV(user?.name || user?.email || 'Mitarbeiter'),
                    escapeCSV(task?.title || 'Keine Aufgabe'),
                    escapeCSV(entry.description || ''),
                    formatHoursHM(hours)
                ].join(',');
            });

            const csvContent = [headers, ...lines].join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `zeiterfassung_${getDateRange()}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success('CSV-Export erfolgreich');
        } catch (error) {
            console.error('CSV export error:', error);
            toast.error('Fehler beim CSV-Export');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button variant="outline" size="sm" className="h-9" disabled={isExporting || entries.length === 0}>
                        <Download size={16} />
                        {isExporting ? 'Exportiere...' : 'Export'}
                    </Button>
                }
            />
            <DropdownMenuContent
                align="end"
                className="bg-background border-border text-foreground min-w-[240px]"
            >
                <DropdownMenuItem
                    onClick={() => handlePDFExport()}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted"
                >
                    <FileText size={16} className="text-red-400" />
                    <span>PDF (Leistungsnachweis)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={handleCSVExport}
                    className="flex items-center gap-2 cursor-pointer hover:bg-muted focus:bg-muted"
                >
                    <FileSpreadsheet size={16} className="text-emerald-400" />
                    <span>CSV exportieren</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
