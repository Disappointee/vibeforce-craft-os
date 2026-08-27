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
import { BRANDING } from '@/lib/branding';

export interface BillingLineItem {
    id: string;
    date: string;
    taskName: string;
    projectKey: string;
    description: string;
    hours: number;
    hourlyRate: number;
    total: number;
    userName?: string;
}

export interface BillingSummary {
    projectId?: string;
    projectName: string;
    projectKey: string;
    clientName: string;
    clientAddress: string;
    invoiceNumber: string;
    invoiceDate: string;
    periodFrom: string;
    periodTo: string;
    lineItems: BillingLineItem[];
    subtotal: number;
    taxRate: number;
    taxAmount: number;
    total: number;
    notes?: string;
    companyName?: string;
    companyAddress?: string;
}

export interface TaskDetailEntry {
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

export interface ClientDetailGroup {
    clientName: string;
    projects: ProjectDetailGroup[];
    clientTotalDuration: string;
}

export interface TaskDetailReportData {
    clientName: string;
    periodFrom: string;
    periodTo: string;
    generatedAt: string;
    logoUrl?: string;
    clients: ClientDetailGroup[];
    grandTotalHours: number;
    grandTotalDuration: string;
}

export interface ReportRow {
    id: string;
    projectId?: string;
    projectName?: string;
    projectKey?: string;
    userName?: string;
    userEmail?: string;
    hours: number;
    billableHours: number;
    taskCount: number;
    budgetHours?: number;
}

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#1e293b',
        lineHeight: 1.5,
    },
    header: {
        marginBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    headerLeft: {
        width: '55%',
    },
    headerRight: {
        width: '40%',
        textAlign: 'right',
    },
    companyName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a',
        marginBottom: 4,
    },
    companyAddress: {
        fontSize: 8.5,
        color: '#64748b',
        lineHeight: 1.4,
    },
    docTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    metaLabel: {
        fontSize: 7.5,
        fontWeight: 'bold',
        color: '#94a3b8',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    metaValue: {
        fontSize: 9,
        color: '#0f172a',
        fontWeight: 'medium',
    },
    addressSection: {
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    addressLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#64748b',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    addressContent: {
        fontSize: 9.5,
        color: '#0f172a',
        lineHeight: 1.4,
    },
    table: {
        width: '100%',
        marginBottom: 20,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#2563eb',
        paddingVertical: 6,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    tableHeaderCell: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 8,
        textTransform: 'uppercase',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center',
    },
    tableCell: {
        fontSize: 8.5,
        color: '#334155',
    },
    tableCellBold: {
        fontSize: 8.5,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    tableCellDesc: {
        fontSize: 7.5,
        color: '#64748b',
        marginTop: 2,
    },
    colNo: { width: '6%' },
    colDate: { width: '14%' },
    colDetails: { width: '44%' },
    colHours: { width: '12%', textAlign: 'right' },
    colRate: { width: '12%', textAlign: 'right' },
    colTotal: { width: '12%', textAlign: 'right' },
    
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginBottom: 20,
    },
    totalsBox: {
        width: '45%',
        backgroundColor: '#f8fafc',
        padding: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    totalRowLabel: {
        fontSize: 8.5,
        color: '#64748b',
    },
    totalRowValue: {
        fontSize: 8.5,
        fontWeight: 'medium',
        color: '#0f172a',
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#cbd5e1',
        paddingTop: 6,
        marginTop: 4,
    },
    totalRowFinalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#0f172a',
    },
    totalRowFinalValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#2563eb',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 6,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    summaryItem: {
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 7.5,
        color: '#64748b',
        textTransform: 'uppercase',
    },
    summaryValue: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 2,
    },
    notesBox: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#f1f5f9',
        borderRadius: 6,
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 2,
        textTransform: 'uppercase',
    },
    notesText: {
        fontSize: 8,
        color: '#64748b',
    },
    footer: {
        position: 'absolute',
        bottom: 24,
        left: 40,
        right: 40,
        fontSize: 7.5,
        color: '#94a3b8',
        textAlign: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 8,
    },
});

// ──────────────────────────────────────────────
// Document 1: Leistungsnachweis (Service Record)
// ──────────────────────────────────────────────
export const ServiceRecordDocument = ({
    projectName,
    projectKey,
    clientName,
    periodFrom,
    periodTo,
    lineItems,
    totalHours,
    totalAmount,
    companyName = BRANDING.name,
    companyAddress = 'Vibeforce Operations & Management',
    notes,
}: {
    projectName: string;
    projectKey: string;
    clientName?: string;
    periodFrom: string;
    periodTo: string;
    lineItems: BillingLineItem[];
    totalHours: number;
    totalAmount: number;
    companyName?: string;
    companyAddress?: string;
    notes?: string;
}) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.companyName}>{companyName}</Text>
                    <Text style={styles.companyAddress}>{companyAddress}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.docTitle}>Leistungsnachweis</Text>
                    <Text style={styles.metaLabel}>PROJEKT</Text>
                    <Text style={styles.metaValue}>{projectName} ({projectKey})</Text>
                    {clientName && (
                        <>
                            <Text style={styles.metaLabel}>KUNDE</Text>
                            <Text style={styles.metaValue}>{clientName}</Text>
                        </>
                    )}
                    <Text style={styles.metaLabel}>ZEITRAUM</Text>
                    <Text style={styles.metaValue}>{periodFrom} – {periodTo}</Text>
                </View>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Datum</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDetails]}>Leistung</Text>
                    <Text style={[styles.tableHeaderCell, styles.colHours]}>Stunden</Text>
                    <Text style={[styles.tableHeaderCell, styles.colRate]}>Satz</Text>
                    <Text style={[styles.tableHeaderCell, styles.colTotal]}>Betrag</Text>
                </View>

                {lineItems.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
                        <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
                        <View style={styles.colDetails}>
                            <Text style={styles.tableCellBold}>{item.taskName}</Text>
                            {item.description ? <Text style={styles.tableCellDesc}>{item.description}</Text> : null}
                        </View>
                        <Text style={[styles.tableCell, styles.colHours]}>{item.hours.toFixed(1)}h</Text>
                        <Text style={[styles.tableCell, styles.colRate]}>{item.hourlyRate.toFixed(2)} €</Text>
                        <Text style={[styles.tableCellBold, styles.colTotal]}>{item.total.toFixed(2)} €</Text>
                    </View>
                ))}
            </View>

            <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Gesamtstunden</Text>
                    <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Positionen</Text>
                    <Text style={styles.summaryValue}>{lineItems.length}</Text>
                </View>
                <View style={styles.summaryItem}>
                    <Text style={styles.summaryLabel}>Gesamtbetrag</Text>
                    <Text style={[styles.summaryValue, { color: '#059669' }]}>{totalAmount.toFixed(2)} €</Text>
                </View>
            </View>

            {notes ? (
                <View style={styles.notesBox}>
                    <Text style={styles.notesTitle}>Bemerkungen</Text>
                    <Text style={styles.notesText}>{notes}</Text>
                </View>
            ) : null}

            <Text style={styles.footer}>Dieser Leistungsnachweis wurde automatisch mit {BRANDING.name} erstellt.</Text>
        </Page>
    </Document>
);

// ──────────────────────────────────────────────
// Document 2: Rechnung (Invoice)
// ──────────────────────────────────────────────
export const InvoiceDocument = ({ summary }: { summary: BillingSummary }) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.companyName}>{summary.companyName || BRANDING.name}</Text>
                    <Text style={styles.companyAddress}>{summary.companyAddress || 'Vibeforce Operations & Management'}</Text>
                </View>
                <View style={styles.headerRight}>
                    <Text style={styles.docTitle}>RECHNUNG</Text>
                    <Text style={styles.metaLabel}>RECHNUNGSNUMMER</Text>
                    <Text style={styles.metaValue}>{summary.invoiceNumber}</Text>
                    <Text style={styles.metaLabel}>DATUM</Text>
                    <Text style={styles.metaValue}>{summary.invoiceDate}</Text>
                    <Text style={styles.metaLabel}>LEISTUNGSZEITRAUM</Text>
                    <Text style={styles.metaValue}>{summary.periodFrom} – {summary.periodTo}</Text>
                </View>
            </View>

            <View style={styles.addressSection}>
                <Text style={styles.addressLabel}>Rechnungsempfänger</Text>
                <Text style={styles.addressContent}>
                    <Text style={{ fontWeight: 'bold' }}>{summary.clientName}</Text>
                    {summary.clientAddress ? `\n${summary.clientAddress}` : ''}
                </Text>
            </View>

            <View style={styles.table}>
                <View style={styles.tableHeaderRow}>
                    <Text style={[styles.tableHeaderCell, styles.colNo]}>#</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDate]}>Datum</Text>
                    <Text style={[styles.tableHeaderCell, styles.colDetails]}>Leistungsbeschreibung</Text>
                    <Text style={[styles.tableHeaderCell, styles.colHours]}>Stunden</Text>
                    <Text style={[styles.tableHeaderCell, styles.colRate]}>Einzel</Text>
                    <Text style={[styles.tableHeaderCell, styles.colTotal]}>Gesamt</Text>
                </View>

                {summary.lineItems.map((item, idx) => (
                    <View key={idx} style={styles.tableRow}>
                        <Text style={[styles.tableCell, styles.colNo]}>{idx + 1}</Text>
                        <Text style={[styles.tableCell, styles.colDate]}>{item.date}</Text>
                        <View style={styles.colDetails}>
                            <Text style={styles.tableCellBold}>{item.projectKey} — {item.taskName}</Text>
                            {item.description ? <Text style={styles.tableCellDesc}>{item.description}</Text> : null}
                        </View>
                        <Text style={[styles.tableCell, styles.colHours]}>{item.hours.toFixed(1)}h</Text>
                        <Text style={[styles.tableCell, styles.colRate]}>{item.hourlyRate.toFixed(2)} €</Text>
                        <Text style={[styles.tableCellBold, styles.colTotal]}>{item.total.toFixed(2)} €</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalsContainer}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalRowLabel}>Nettobetrag</Text>
                        <Text style={styles.totalRowValue}>{summary.subtotal.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalRowLabel}>MwSt. ({(summary.taxRate * 100).toFixed(0)}%)</Text>
                        <Text style={styles.totalRowValue}>{summary.taxAmount.toFixed(2)} €</Text>
                    </View>
                    <View style={styles.totalRowFinal}>
                        <Text style={styles.totalRowFinalLabel}>Gesamtbetrag</Text>
                        <Text style={styles.totalRowFinalValue}>{summary.total.toFixed(2)} €</Text>
                    </View>
                </View>
            </View>

            {summary.notes ? (
                <View style={styles.notesBox}>
                    <Text style={styles.notesTitle}>Zahlungsbedingungen & Hinweise</Text>
                    <Text style={styles.notesText}>{summary.notes}</Text>
                </View>
            ) : null}

            <Text style={styles.footer}>Zahlbar innerhalb von 14 Tagen nach Erhalt dieser Rechnung. Erstellt mit {BRANDING.name}.</Text>
        </Page>
    </Document>
);

// ──────────────────────────────────────────────
// Helpers for Client Downloads
// ──────────────────────────────────────────────
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

export async function printServiceRecord(props: {
    projectName: string;
    projectKey: string;
    clientName?: string;
    periodFrom: string;
    periodTo: string;
    lineItems: BillingLineItem[];
    totalHours: number;
    totalAmount: number;
    companyName?: string;
    companyAddress?: string;
    notes?: string;
}) {
    const doc = <ServiceRecordDocument {...props} />;
    await triggerBlobDownload(doc, `Leistungsnachweis_${props.projectKey}_${props.periodFrom}_${props.periodTo}.pdf`);
}

export async function printInvoice(summary: BillingSummary) {
    const doc = <InvoiceDocument summary={summary} />;
    await triggerBlobDownload(doc, `Rechnung_${summary.invoiceNumber}.pdf`);
}

export async function downloadReportPDF(data: TaskDetailReportData) {
    // Generate standard summary report
    const lineItems: BillingLineItem[] = [];
    for (const c of data.clients) {
        for (const p of c.projects) {
            for (const e of p.entries) {
                lineItems.push({
                    id: Math.random().toString(),
                    date: data.generatedAt.split('T')[0],
                    taskName: e.taskName,
                    projectKey: p.projectKey,
                    description: e.note,
                    hours: e.durationHours,
                    hourlyRate: 100,
                    total: e.durationHours * 100,
                });
            }
        }
    }
    const doc = (
        <ServiceRecordDocument
            projectName={data.clientName || 'Gesamtbericht'}
            projectKey="REPORT"
            clientName={data.clientName}
            periodFrom={data.periodFrom}
            periodTo={data.periodTo}
            lineItems={lineItems}
            totalHours={data.grandTotalHours}
            totalAmount={data.grandTotalHours * 100}
        />
    );
    await triggerBlobDownload(doc, `Stundenbericht_${data.periodFrom}_${data.periodTo}.pdf`);
}
