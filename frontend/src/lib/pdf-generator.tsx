'use client';

import React from 'react';
import {
    Document,
    Page,
    Text,
    View,
    Image,
    StyleSheet
} from '@react-pdf/renderer';

export interface TaskDetailEntry {
    date: string;
    taskName: string;
    note: string;
    durationHours: number;
    duration: string;
}

export interface ProjectDetailGroup {
    projectName: string;
    projectKey: string;
    clientName: string;
    projectTotalHours: number;
    projectTotalDuration: string;
    entries: TaskDetailEntry[];
}

export interface TaskDetailReportData {
    clientName: string;
    periodFrom: string;
    periodTo: string;
    generatedAt: string;
    logoUrl?: string;
    projects: ProjectDetailGroup[];
    grandTotalHours: number;
    grandTotalDuration: string;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        alignItems: 'flex-end',
    },
    logo: {
        maxHeight: 32,
        marginBottom: 8,
    },
    docTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    docSubtitle: {
        fontSize: 10,
        color: '#6b7280',
        marginTop: 2,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 24,
        marginTop: 16,
    },
    metaCol: {
        flexDirection: 'column',
    },
    metaLabel: {
        fontSize: 7,
        color: '#9ca3af',
        textTransform: 'uppercase',
        marginBottom: 2,
    },
    metaValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
    },

    projectSection: {
        marginBottom: 20,
    },
    projectHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
    },
    projectTitle: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#111827',
    },
    projectClient: {
        fontSize: 8,
        color: '#6b7280',
        marginTop: 1,
    },

    table: {
        width: '100%',
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#d1d5db',
        paddingVertical: 4,
        paddingHorizontal: 6,
    },
    tableHeaderCell: {
        fontSize: 7,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 4,
        paddingHorizontal: 6,
        alignItems: 'flex-start',
    },
    tableCell: {
        fontSize: 8,
        color: '#4b5563',
    },
    tableCellBold: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#111827',
    },
    tableCellMuted: {
        fontSize: 7,
        color: '#9ca3af',
    },
    colDate: { width: '14%' },
    colTask: { width: '28%' },
    colNote: { width: '42%' },
    colDuration: { width: '16%', textAlign: 'right' },

    projectFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingVertical: 4,
        paddingHorizontal: 6,
        borderTopWidth: 1,
        borderTopColor: '#d1d5db',
        marginBottom: 4,
    },
    projectFooterLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#374151',
        marginRight: 8,
    },
    projectFooterValue: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#111827',
        width: '16%',
        textAlign: 'right',
    },

    grandTotalSection: {
        marginTop: 10,
        paddingTop: 12,
        borderTopWidth: 2,
        borderTopColor: '#111827',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
    },
    grandTotalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    grandTotalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2563EB',
        width: '16%',
        textAlign: 'right',
    },

    emptyState: {
        padding: 40,
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 7,
        color: '#9ca3af',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 10,
    },
});

export const ReportDocument = ({ data }: { data: TaskDetailReportData }) => {
    const { clientName, periodFrom, periodTo, generatedAt, logoUrl, projects, grandTotalHours, grandTotalDuration } = data;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={styles.headerLeft}>
                            {logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:')) ? (
                                <Image style={styles.logo} src={logoUrl} />
                            ) : null}
                            <Text style={styles.docTitle}>Leistungsnachweis</Text>
                            <Text style={styles.docSubtitle}>Stundenauswertung</Text>
                            <View style={styles.metaRow}>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>Kunde</Text>
                                    <Text style={styles.metaValue}>{clientName}</Text>
                                </View>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>Zeitraum</Text>
                                    <Text style={styles.metaValue}>{periodFrom} – {periodTo}</Text>
                                </View>
                                <View style={styles.metaCol}>
                                    <Text style={styles.metaLabel}>Erstellt am</Text>
                                    <Text style={styles.metaValue}>{generatedAt}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {projects.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text>Keine Daten für den ausgewählten Zeitraum.</Text>
                    </View>
                ) : (
                    projects.map((project, pidx) => (
                        <View key={`${project.projectKey}-${pidx}`} style={styles.projectSection}>
                            <View style={styles.projectHeader}>
                                <View>
                                    <Text style={styles.projectTitle}>{project.projectKey} — {project.projectName}</Text>
                                    {project.clientName && project.clientName !== 'Kein Kunde' && projects.length > 1 ? (
                                        <Text style={styles.projectClient}>Kunde: {project.clientName}</Text>
                                    ) : null}
                                </View>
                            </View>

                            <View style={styles.table}>
                                <View style={styles.tableHeaderRow}>
                                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Datum</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colTask]}>Aufgabe</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colNote]}>Notiz</Text>
                                    <Text style={[styles.tableHeaderCell, styles.colDuration]}>Dauer</Text>
                                </View>

                                {project.entries.map((entry, eidx) => (
                                    <View key={`${project.projectKey}-e-${eidx}`} style={styles.tableRow}>
                                        <Text style={[styles.tableCell, styles.colDate]}>{entry.date}</Text>
                                        <Text style={[styles.tableCellBold, styles.colTask]}>{entry.taskName}</Text>
                                        <Text style={[styles.tableCellMuted, styles.colNote]}>
                                            {entry.note || '—'}
                                        </Text>
                                        <Text style={[styles.tableCell, styles.colDuration]}>{entry.duration}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.projectFooter}>
                                <Text style={styles.projectFooterLabel}>Summe {project.projectKey}</Text>
                                <Text style={styles.projectFooterValue}>{project.projectTotalDuration}</Text>
                            </View>
                        </View>
                    ))
                )}

                {/* Grand Total Footer */}
                {projects.length > 0 && (
                    <View style={styles.grandTotalSection}>
                        <Text style={styles.grandTotalLabel}>Gesamtsumme</Text>
                        <Text style={styles.grandTotalValue}>{grandTotalDuration}</Text>
                    </View>
                )}

                <Text style={styles.footer}>Erstellt mit Vibeforce Flow OS — {generatedAt}</Text>
            </Page>
        </Document>
    );
};

async function triggerBlobDownload(docElement: React.ReactElement, filename: string) {
    const { pdf } = await import('@react-pdf/renderer');
    const blob = await pdf(docElement as any).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

export async function downloadReportPDF(data: TaskDetailReportData): Promise<void> {
    const logoUrl = process.env.NEXT_PUBLIC_REPORT_LOGO_URL || '';
    const dateRange = data.periodFrom && data.periodTo
        ? `${data.periodFrom}_${data.periodTo}`
        : new Date().toISOString().split('T')[0];
    const filename = `stundenauswertung_${dateRange}.pdf`;

    await triggerBlobDownload(
        <ReportDocument data={{ ...data, logoUrl: data.logoUrl || logoUrl }} />,
        filename
    );
}
