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

export interface BillingLineItem {
    date: string;
    taskName: string;
    projectKey: string;
    description: string;
    hours: number;
    hourlyRate: number;
    total: number;
}

export interface BillingSummary {
    companyName: string;
    companyAddress: string;
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
}

// -------------------------------------------------------------
// Stylesheet matching Vibeforce's professional, clean corporate style
// -------------------------------------------------------------
const styles = StyleSheet.create({
    page: {
        padding: 45,
        fontFamily: 'Helvetica',
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingBottom: 20,
    },
    headerLeft: {
        flex: 1,
    },
    headerRight: {
        textAlign: 'right',
        alignItems: 'flex-end',
    },
    logo: {
        maxHeight: 35,
        marginBottom: 10,
    },
    companyName: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#111827',
    },
    companyAddress: {
        fontSize: 8,
        color: '#6b7280',
        marginTop: 2,
    },
    docTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        letterSpacing: -0.5,
    },
    metaLabel: {
        fontSize: 8,
        color: '#9ca3af',
        marginTop: 4,
    },
    metaValue: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#111827',
    },
    addressSection: {
        marginBottom: 25,
    },
    addressLabel: {
        fontSize: 8,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        color: '#9ca3af',
        marginBottom: 4,
    },
    addressContent: {
        fontSize: 9,
        color: '#374151',
        lineHeight: 1.4,
    },
    // Table Styles
    table: {
        width: '100%',
        marginTop: 15,
    },
    tableHeaderRow: {
        flexDirection: 'row',
        backgroundColor: '#f9fafb',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingVertical: 6,
        paddingHorizontal: 8,
    },
    tableHeaderCell: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#4b5563',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        paddingVertical: 6,
        paddingHorizontal: 8,
        alignItems: 'center',
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
    tableCellDesc: {
        fontSize: 7,
        color: '#9ca3af',
        marginTop: 1,
    },
    // Invoice totals
    totalsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 20,
    },
    totalsBox: {
        width: 180,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    totalRowLabel: {
        fontSize: 8,
        color: '#6b7280',
    },
    totalRowValue: {
        fontSize: 8,
        color: '#374151',
        textAlign: 'right',
    },
    totalRowFinal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderTopWidth: 1,
        borderTopColor: '#111827',
        marginTop: 4,
    },
    totalRowFinalLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#111827',
    },
    totalRowFinalValue: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#3b82f6',
        textAlign: 'right',
    },
    // Service Record Summary
    summaryRow: {
        flexDirection: 'row',
        gap: 25,
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    summaryItem: {
        flexDirection: 'column',
    },
    summaryLabel: {
        fontSize: 8,
        color: '#6b7280',
    },
    summaryValue: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 2,
    },
    // Notes & Info
    notesBox: {
        marginTop: 30,
        padding: 12,
        backgroundColor: '#f9fafb',
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    notesTitle: {
        fontSize: 8,
        fontWeight: 'bold',
        color: '#4b5563',
        marginBottom: 3,
    },
    notesText: {
        fontSize: 8,
        color: '#6b7280',
        lineHeight: 1.4,
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 45,
        right: 45,
        textAlign: 'center',
        fontSize: 7,
        color: '#9ca3af',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
        paddingTop: 10,
    },
    // Specific table columns
    colNo: { width: '6%' },
    colDate: { width: '12%' },
    colDetails: { width: '52%' },
    colHours: { width: '10%', textAlign: 'right' },
    colRate: { width: '10%', textAlign: 'right' },
    colTotal: { width: '10%', textAlign: 'right' },
    
    // Reports Columns
    colReportProj: { width: '35%' },
    colReportUser: { width: '25%' },
    colReportHours: { width: '10%', textAlign: 'right' },
    colReportBillable: { width: '10%', textAlign: 'right' },
    colReportTasks: { width: '10%', textAlign: 'right' },
    colReportBudget: { width: '10%', textAlign: 'right' },
});

// Helper for rendering logo safely
const renderLogo = (logoUrl?: string) => {
    if (logoUrl && (logoUrl.startsWith('http') || logoUrl.startsWith('data:'))) {
        return <Image style={styles.logo} src={logoUrl} />;
    }
    return null;
};

// -------------------------------------------------------------
// Component 1: Service Record PDF Document (Leistungsnachweis)
// -------------------------------------------------------------
interface ServiceRecordDocumentProps {
    projectName: string;
    projectKey: string;
    clientName?: string;
    periodFrom: string;
    periodTo: string;
    lineItems: BillingLineItem[];
    totalHours: number;
    totalAmount: number;
    logoUrl?: string;
    companyName: string;
    companyAddress: string;
    notes?: string;
}

export const ServiceRecordDocument = ({
    projectName,
    projectKey,
    clientName,
    periodFrom,
    periodTo,
    lineItems,
    totalHours,
    totalAmount,
    logoUrl,
    companyName,
    companyAddress,
    notes
}: ServiceRecordDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {renderLogo(logoUrl)}
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
                    <Text style={styles.metaLabel}>DATUM</Text>
                    <Text style={styles.metaValue}>{new Date().toLocaleDateString('de-DE')}</Text>
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
                        <Text style={[styles.tableCell, styles.colRate]}>{item.hourlyRate.toFixed(2)}€</Text>
                        <Text style={[styles.tableCellBold, styles.colTotal]}>{item.total.toFixed(2)}€</Text>
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
                    <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{totalAmount.toFixed(2)}€</Text>
                </View>
            </View>

            {notes ? (
                <View style={styles.notesBox}>
                    <Text style={styles.notesTitle}>Bemerkungen</Text>
                    <Text style={styles.notesText}>{notes}</Text>
                </View>
            ) : null}

            <Text style={styles.footer}>Dieser Leistungsnachweis wurde automatisch mit Vibeforce Flow OS erstellt.</Text>
        </Page>
    </Document>
);

// -------------------------------------------------------------
// Component 2: Invoice PDF Document (Rechnung)
// -------------------------------------------------------------
interface InvoiceDocumentProps {
    summary: BillingSummary;
    logoUrl?: string;
}

export const InvoiceDocument = ({ summary, logoUrl }: InvoiceDocumentProps) => (
    <Document>
        <Page size="A4" style={styles.page}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    {renderLogo(logoUrl)}
                    <Text style={styles.companyName}>{summary.companyName}</Text>
                    <Text style={styles.companyAddress}>{summary.companyAddress}</Text>
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
                    {"\n"}{summary.clientAddress}
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
                        <Text style={[styles.tableCell, styles.colRate]}>{item.hourlyRate.toFixed(2)}€</Text>
                        <Text style={[styles.tableCellBold, styles.colTotal]}>{item.total.toFixed(2)}€</Text>
                    </View>
                ))}
            </View>

            <View style={styles.totalsContainer}>
                <View style={styles.totalsBox}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalRowLabel}>Nettobetrag</Text>
                        <Text style={styles.totalRowValue}>{summary.subtotal.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalRowLabel}>MwSt. ({(summary.taxRate * 100).toFixed(0)}%)</Text>
                        <Text style={styles.totalRowValue}>{summary.taxAmount.toFixed(2)}€</Text>
                    </View>
                    <View style={styles.totalRowFinal}>
                        <Text style={styles.totalRowFinalLabel}>Gesamtbetrag</Text>
                        <Text style={styles.totalRowFinalValue}>{summary.total.toFixed(2)}€</Text>
                    </View>
                </View>
            </View>

            {summary.notes ? (
                <View style={styles.notesBox}>
                    <Text style={styles.notesTitle}>Zahlungsbedingungen & Hinweise</Text>
                    <Text style={styles.notesText}>{summary.notes}</Text>
                </View>
            ) : null}

            <Text style={styles.footer}>Zahlbar innerhalb von 14 Tagen nach Erhalt dieser Rechnung. Erstellt mit Vibeforce Flow OS.</Text>
        </Page>
    </Document>
);


// -------------------------------------------------------------
// Component 3: Stundenauswertung Report Document (for ExportButton)
// -------------------------------------------------------------
interface ReportRow {
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

interface ReportDocumentProps {
    rows: ReportRow[];
    groupBy: 'project' | 'user' | 'both';
    dateFrom?: string;
    dateTo?: string;
    logoUrl?: string;
}

export const ReportDocument = ({
    rows,
    groupBy,
    dateFrom,
    dateTo,
    logoUrl
}: ReportDocumentProps) => {
    const totalHours = rows.reduce((s, r) => s + r.hours, 0);
    const totalBillable = rows.reduce((s, r) => s + r.billableHours, 0);

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        {renderLogo(logoUrl)}
                        <Text style={styles.companyName}>Vibeforce GmbH</Text>
                        <Text style={styles.companyAddress}>Zeitauswertung und Controlling</Text>
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.docTitle}>Stundenauswertung</Text>
                        {dateFrom && dateTo ? (
                            <>
                                <Text style={styles.metaLabel}>ZEITRAUM</Text>
                                <Text style={styles.metaValue}>{dateFrom} – {dateTo}</Text>
                            </>
                        ) : null}
                        <Text style={styles.metaLabel}>DATUM</Text>
                        <Text style={styles.metaValue}>{new Date().toLocaleDateString('de-DE')}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    <View style={styles.tableHeaderRow}>
                        {groupBy !== 'user' && <Text style={[styles.tableHeaderCell, styles.colReportProj]}>Projekt</Text>}
                        {groupBy !== 'project' && <Text style={[styles.tableHeaderCell, styles.colReportUser]}>Mitarbeiter</Text>}
                        <Text style={[styles.tableHeaderCell, styles.colReportHours]}>Stunden</Text>
                        <Text style={[styles.tableHeaderCell, styles.colReportBillable]}>Abrechenbar</Text>
                        <Text style={[styles.tableHeaderCell, styles.colReportTasks]}>Tasks</Text>
                        <Text style={[styles.tableHeaderCell, styles.colReportBudget]}>Budget %</Text>
                    </View>

                    {rows.map((row, idx) => (
                        <View key={idx} style={styles.tableRow}>
                            {groupBy !== 'user' && (
                                <Text style={[styles.tableCellBold, styles.colReportProj]}>
                                    {row.projectKey || ''} - {row.projectName || ''}
                                </Text>
                            )}
                            {groupBy !== 'project' && (
                                <Text style={[styles.tableCell, styles.colReportUser]}>
                                    {row.userName || row.userEmail || ''}
                                </Text>
                            )}
                            <Text style={[styles.tableCell, styles.colReportHours]}>{row.hours.toFixed(1)}h</Text>
                            <Text style={[styles.tableCellBold, styles.colReportBillable, { color: '#3b82f6' }]}>
                                {row.billableHours.toFixed(1)}h
                            </Text>
                            <Text style={[styles.tableCell, styles.colReportTasks]}>{row.taskCount}</Text>
                            <Text style={[styles.tableCell, styles.colReportBudget]}>
                                {row.budgetHours ? `${((row.hours / row.budgetHours) * 100).toFixed(0)}%` : '—'}
                            </Text>
                        </View>
                    ))}
                </View>

                <View style={styles.summaryRow}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Gesamtstunden</Text>
                        <Text style={styles.summaryValue}>{totalHours.toFixed(1)}h</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Abrechenbar</Text>
                        <Text style={[styles.summaryValue, { color: '#3b82f6' }]}>{totalBillable.toFixed(1)}h</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Einträge</Text>
                        <Text style={styles.summaryValue}>{rows.length}</Text>
                    </View>
                </View>

                <Text style={styles.footer}>Erstellt mit Vibeforce Flow OS</Text>
            </Page>
        </Document>
    );
};

// -------------------------------------------------------------
// Client Side Download Action Triggers (Using dynamic imports)
// -------------------------------------------------------------

// Helper to download any PDF blob
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

export async function printInvoice(summary: BillingSummary): Promise<void> {
    const logoUrl = process.env.NEXT_PUBLIC_REPORT_LOGO_URL || '';
    const filename = `RECHNUNG_${summary.invoiceNumber}.pdf`;
    await triggerBlobDownload(<InvoiceDocument summary={summary} logoUrl={logoUrl} />, filename);
}

export async function printServiceRecord(params: {
    projectName: string;
    projectKey: string;
    clientName?: string;
    periodFrom: string;
    periodTo: string;
    lineItems: BillingLineItem[];
    totalHours: number;
    totalAmount: number;
    notes?: string;
}): Promise<void> {
    const logoUrl = process.env.NEXT_PUBLIC_REPORT_LOGO_URL || '';
    const companyName = process.env.NEXT_PUBLIC_COMPANY_NAME || 'Vibeforce GmbH';
    const companyAddress = process.env.NEXT_PUBLIC_COMPANY_ADDRESS || '';
    const filename = `LEISTUNGSNACHWEIS_${params.projectKey}.pdf`;

    await triggerBlobDownload(
        <ServiceRecordDocument
            {...params}
            logoUrl={logoUrl}
            companyName={companyName}
            companyAddress={companyAddress}
        />,
        filename
    );
}

export async function downloadReportPDF(
    rows: ReportRow[],
    groupBy: 'project' | 'user' | 'both',
    dateFrom?: string,
    dateTo?: string
): Promise<void> {
    const logoUrl = process.env.NEXT_PUBLIC_REPORT_LOGO_URL || '';
    const dateRange = dateFrom && dateTo ? `${dateFrom}_${dateTo}` : new Date().toISOString().split('T')[0];
    const filename = `stundenauswertung_${dateRange}.pdf`;

    await triggerBlobDownload(
        <ReportDocument
            rows={rows}
            groupBy={groupBy}
            dateFrom={dateFrom}
            dateTo={dateTo}
            logoUrl={logoUrl}
        />,
        filename
    );
}
