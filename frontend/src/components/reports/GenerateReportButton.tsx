'use client';

import { useState, useEffect, useRef } from 'react';
import { FileText, Loader2, Download } from 'lucide-react';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';
import { generateTimeEntryReport, generateTimeEntryReportBlob, type ReportGenerationContext } from '@/lib/report-generator';
import type { TimeEntryReportRecord } from '@/lib/pocketbase-types';

interface GenerateReportButtonProps {
    context: ReportGenerationContext;
    size?: 'sm' | 'default' | 'lg';
    variant?: 'outline' | 'ghost';
    className?: string;
    onGenerated?: (report: TimeEntryReportRecord) => void;
}

export function GenerateReportButton({
    context,
    size = 'sm',
    variant = 'ghost',
    className,
    onGenerated,
}: GenerateReportButtonProps) {
    const [isGenerating, setIsGenerating] = useState(false);
    const [existingReportId, setExistingReportId] = useState<string | null>(null);
    const [isChecking, setIsChecking] = useState(true);
    const [collectionExists, setCollectionExists] = useState(true);
    const isCheckingRef = useRef(false);

    useEffect(() => {
        let cancelled = false;

        const checkExisting = async () => {
            if (isCheckingRef.current) return;
            isCheckingRef.current = true;

            try {
                const existing = await pb.collection('time_entry_reports').getList(1, 1, {
                    filter: pb.filter('time_entry = {:entryId}', { entryId: context.timeEntry.id }),
                });
                if (!cancelled && existing.items.length > 0) {
                    setExistingReportId(existing.items[0].id);
                }
            } catch (err: any) {
                if (!cancelled) {
                    if (err?.status === 404) {
                        setCollectionExists(false);
                    }
                }
            } finally {
                if (!cancelled) {
                    setIsChecking(false);
                }
                isCheckingRef.current = false;
            }
        };

        checkExisting();
        return () => { cancelled = true; };
    }, [context.timeEntry.id]);

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            const markdown = generateTimeEntryReport(context);
            const blob = generateTimeEntryReportBlob(markdown);
            const title = context.sessionTitle || `Report ${new Date().toLocaleDateString('de-DE')}`;
            const filename = `report_${context.timeEntry.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.md`;

            const formData = new FormData();
            formData.append('time_entry', context.timeEntry.id);
            formData.append('file', new File([blob], filename, { type: 'text/markdown' }), filename);
            formData.append('title', title);
            formData.append('size', String(blob.size));

            const created = await pb.collection('time_entry_reports').create(formData);
            setExistingReportId(created.id);
            toast.success('Report generiert');
            onGenerated?.(created as TimeEntryReportRecord);
        } catch (error: any) {
            if (error?.status === 404) {
                setCollectionExists(false);
                handleFallbackDownload();
            } else {
                console.error('Failed to generate report:', error);
                toast.error('Fehler beim Generieren des Reports');
            }
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFallbackDownload = () => {
        try {
            const markdown = generateTimeEntryReport(context);
            const blob = generateTimeEntryReportBlob(markdown);
            const filename = `report_${context.timeEntry.id.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.md`;
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success('Report lokal heruntergeladen');
        } catch {
            toast.error('Fehler beim Herunterladen');
        }
    };

    const handleDownload = async () => {
        if (!existingReportId) return;
        try {
            const record = await pb.collection('time_entry_reports').getOne(existingReportId);
            const fileUrl = pb.files.getUrl(record, (record as any).file);
            window.open(fileUrl, '_blank');
        } catch {
            toast.error('Fehler beim Herunterladen');
        }
    };

    if (isChecking) return null;

    if (existingReportId) {
        return (
            <Button
                size={size}
                variant="outline"
                className={className}
                onClick={handleDownload}
            >
                <FileText size={14} />
                Report ansehen
            </Button>
        );
    }

    if (!collectionExists) {
        return (
            <Button
                size={size}
                variant="outline"
                className={className}
                onClick={handleFallbackDownload}
                title="Report-Funktion ist im Aufbau — Download als Markdown"
            >
                <Download size={14} />
                Report download
            </Button>
        );
    }

    return (
        <Button
            size={size}
            variant={variant}
            className={className}
            onClick={handleGenerate}
            disabled={isGenerating}
        >
            {isGenerating ? (
                <Loader2 size={14} className="animate-spin" />
            ) : (
                <FileText size={14} />
            )}
            Report generieren
        </Button>
    );
}
