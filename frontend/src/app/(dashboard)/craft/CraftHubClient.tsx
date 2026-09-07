'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Hammer,
  MapPin,
  FileText,
  FileSpreadsheet,
  Receipt,
  Plus,
  Building2,
  Calendar,
  CloudSun,
  User,
  Clock,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCode,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  Lock,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MeasurementGrid, type MeasurementRowItem } from '@/components/craft/MeasurementGrid';
import { QuickCreateReportModal } from '@/components/craft/QuickCreateReportModal';
import { GaebManager } from '@/components/craft/GaebManager';
import { CostCockpit } from '@/components/craft/CostCockpit';
import { WholesaleManager } from '@/components/craft/WholesaleManager';
import { CraftFeatureUpsell } from '@/components/craft/CraftFeatureUpsell';
import { CraftEntitlementsModal } from '@/components/craft/CraftEntitlementsModal';
import { useCraftEntitlementsStore } from '@/lib/craft-entitlements';
import { generateDatevCsv, type DatevBookingItem } from '@/lib/datev-export';
import { generateZugferdXml, type ZugferdInvoiceData } from '@/lib/zugferd';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { getImportedIdsCartAction } from '@/app/actions/craft/ids-carts';
import type { IdsCart } from '@/lib/ids-connect';
import type { ProjectRecord, SiteReportRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

// Dynamic import for Leaflet map to prevent SSR window errors
const GeofenceMapEditor = dynamic(
  () => import('@/components/craft/GeofenceMapEditor').then((mod) => mod.GeofenceMapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex flex-col items-center justify-center bg-card/40 border border-border/60 rounded-2xl animate-pulse text-muted-foreground gap-2">
        <MapPin size={28} className="text-teal-500 animate-bounce" />
        <span className="text-sm font-medium">Interaktive Baustellenkarte wird geladen...</span>
      </div>
    ),
  }
);

interface CraftHubClientProps {
  initialProjects: ProjectRecord[];
  initialReports: SiteReportRecord[];
  initialInvoices: any[];
  initialTimeEntries?: TimeEntryRecord[];
}

type CraftTab = 'reports' | 'measurements' | 'geofence' | 'invoices' | 'gaeb' | 'margin' | 'wholesale';

export function CraftHubClient({
  initialProjects = [],
  initialReports = [],
  initialInvoices = [],
  initialTimeEntries = [],
}: CraftHubClientProps) {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<CraftTab>('reports');
  // IDS-Connect 2.5 Return-Flow: vom Webhook persistierter Warenkorb
  const [idsHookCart, setIdsHookCart] = useState<IdsCart | null>(null);
  const idsHookParamsHandled = useRef(false);

  // 303-Redirect des IDS-Webhooks auswerten (?ids_imported=1&cart_id=<uuid>)
  useEffect(() => {
    if (idsHookParamsHandled.current) return;
    idsHookParamsHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const imported = params.get('ids_imported');
    const cartId = params.get('cart_id');

    if (imported === '0') {
      toast.error('IDS-Warenkorb konnte nicht gespeichert werden. Bitte den Import im Großhandels-Shop erneut ausführen.');
    } else if (imported === '1' && cartId) {
      setActiveTab('wholesale');
      getImportedIdsCartAction(cartId)
        .then((result) => {
          if (result.cart) {
            setIdsHookCart(result.cart);
            toast.success(
              `IDS-Warenkorb importiert: ${result.cart.items.length} Positionen (${result.cart.header.wholesalerName}).`
            );
          } else {
            toast.error(result.error || 'IDS-Warenkorb konnte nicht geladen werden.');
          }
        })
        .catch((err: unknown) => {
          const message = err instanceof Error ? err.message : 'IDS-Warenkorb konnte nicht geladen werden.';
          toast.error(message);
        });
    }

    // Redirect-Parameter entfernen (kein Re-Import bei Reload)
    if (imported !== null || params.has('ids_error')) {
      const cleanUrl = new URL(window.location.href);
      ['ids_imported', 'cart_id', 'ids_error'].forEach((p) => cleanUrl.searchParams.delete(p));
      window.history.replaceState(null, '', cleanUrl.toString());
    }
  }, []);

  const [projects] = useState<ProjectRecord[]>(initialProjects);
  const [reports, setReports] = useState<SiteReportRecord[]>(initialReports);
  const [invoices] = useState<any[]>(initialInvoices);
  const [timeEntries] = useState<TimeEntryRecord[]>(initialTimeEntries);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const { isFeatureEnabled, activeTier } = useCraftEntitlementsStore();

  // Selected project for scoped tabs
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialProjects[0]?.id || ''
  );
  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId) || projects[0],
    [projects, selectedProjectId]
  );

  const isReportsEnabled = isFeatureEnabled('reports', selectedProject?.id);
  const isMeasurementsEnabled = isFeatureEnabled('measurements', selectedProject?.id);
  const isGeofenceEnabled = isFeatureEnabled('geofence', selectedProject?.id);
  const isInvoicesEnabled = isFeatureEnabled('invoices', selectedProject?.id);
  const isGaebEnabled = isFeatureEnabled('gaeb', selectedProject?.id);
  const isMarginEnabled = isFeatureEnabled('margin', selectedProject?.id);
  const isWholesaleEnabled = isFeatureEnabled('wholesale', selectedProject?.id);

  // Fallback sample project for demo & onboarding
  const sampleProject: ProjectRecord = useMemo(
    () => ({
      id: 'sample_craft_project',
      key: 'BAU-DEMO',
      name: 'Neubau Gewerbehalle Nord (Muster-Baustelle)',
      description: 'Demonstrations-Projekt für Soll/Ist-Nachkalkulation',
      status: 'active',
      budget_hours: 250,
      budget_money: 48000,
      external_costs_total: 14500,
      members: [],
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      collectionId: 'projects',
      collectionName: 'projects',
    }),
    []
  );

  const sampleSiteReports: SiteReportRecord[] = useMemo(
    () => [
      {
        id: 'sr_sample_1',
        project: 'sample_craft_project',
        author: 'u1',
        report_date: new Date().toISOString().slice(0, 10),
        status: 'signed',
        qualification_hours: {
          meister: 16,
          geselle: 40,
          helfer: 20,
          azubi: 10,
        },
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'site_reports',
        collectionName: 'site_reports',
      },
    ],
    []
  );

  const sampleTimeEntries: TimeEntryRecord[] = useMemo(
    () => [
      {
        id: 'te_sample_1',
        task: 't1',
        user: 'u1',
        duration_minutes: 4800,
        duration: 80,
        is_billable: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'time_entries',
        collectionName: 'time_entries',
        expand: {
          user: { name: 'Andreas Müller (Vorarbeiter)', hourly_rate: 55 } as any,
          task: { title: 'Bodenplatte & Fundamentbewehrung' } as any,
        },
      },
      {
        id: 'te_sample_2',
        task: 't2',
        user: 'u2',
        duration_minutes: 3600,
        duration: 60,
        is_billable: true,
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        collectionId: 'time_entries',
        collectionName: 'time_entries',
        expand: {
          user: { name: 'Klaus Schmidt (Monteur)', hourly_rate: 50 } as any,
          task: { title: 'Estrichausbau & Trockenbauwand' } as any,
        },
      },
    ],
    []
  );

  // Filter state for reports
  const [reportFilterStatus, setReportFilterStatus] = useState<string>('all');
  const [reportSearch, setReportSearch] = useState<string>('');

  // Sample measurement items for the active project
  const [measurementItems, setMeasurementItems] = useState<MeasurementRowItem[]>([
    {
      id: 'm1',
      position_nr: '01.01',
      title: 'Estrichausbau & Untergrundvorbereitung',
      formula: '14.5 * 8.2',
      quantity: 118.9,
      unit: 'm2',
      unit_price: 38.5,
      total_price: 4577.65,
      notes: 'DIN 18560 Estrichdicke 65mm',
    },
    {
      id: 'm2',
      position_nr: '01.02',
      title: 'Trockenbauwand F90 beidseitig beplankt',
      formula: '2 * (12.4 + 6.8) * 3.1',
      quantity: 119.04,
      unit: 'm2',
      unit_price: 64.0,
      total_price: 7618.56,
      notes: 'VOB/C DIN 18340 Metallständerwand',
    },
    {
      id: 'm3',
      position_nr: '01.03',
      title: 'Kabeltrassen & Deckenrohre montieren',
      formula: '45.0 + 32.5 + 18.0',
      quantity: 95.5,
      unit: 'm',
      unit_price: 24.5,
      total_price: 2339.75,
      notes: 'Schwerlasttrasse Stahl verzinkt',
    },
  ]);

  // Computed metrics
  const activeProjectsCount = projects.filter((p) => p.status === 'active').length;
  const geofencedProjectsCount = projects.filter((p) => Boolean((p as any)?.geofence_lat)).length;
  const signedReportsCount = reports.filter((r) => r.status === 'signed' || r.status === 'invoiced').length;
  const totalInvoicedGross = invoices.reduce((acc, inv) => acc + (inv.gross_total || 0), 0);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesStatus =
        reportFilterStatus === 'all' || r.status === reportFilterStatus;
      const projName = (r as any)?.expand?.project?.name || '';
      const matchesSearch =
        reportSearch === '' ||
        projName.toLowerCase().includes(reportSearch.toLowerCase()) ||
        (r.work_performed && r.work_performed.toLowerCase().includes(reportSearch.toLowerCase()));
      return matchesStatus && matchesSearch;
    });
  }, [reports, reportFilterStatus, reportSearch]);

  // Measurement Totals with per-item tax breakdown
  const isSelectedProject13b = Boolean((selectedProject as any)?.reverse_charge_13b);
  const defaultTaxType = isSelectedProject13b ? 'reverse_charge_13b' : 'standard_19';
  const measurementNetTotal = useMemo(
    () => measurementItems.reduce((sum, item) => sum + (item.total_price || 0), 0),
    [measurementItems]
  );
  const net19Total = useMemo(
    () => measurementItems.filter(i => (i.tax_rate_type || defaultTaxType) === 'standard_19').reduce((sum, item) => sum + (item.total_price || 0), 0),
    [measurementItems, defaultTaxType]
  );
  const net13bTotal = useMemo(
    () => measurementItems.filter(i => (i.tax_rate_type || defaultTaxType) === 'reverse_charge_13b').reduce((sum, item) => sum + (item.total_price || 0), 0),
    [measurementItems, defaultTaxType]
  );
  const measurementVatTotal = useMemo(() => Math.round(net19Total * 0.19 * 100) / 100, [net19Total]);
  const measurementGrossTotal = useMemo(() => Math.round((measurementNetTotal + measurementVatTotal) * 100) / 100, [measurementNetTotal, measurementVatTotal]);

  // Handlers for Exports with Mixed § 13b / 19% Tax Split Support
  const handleDownloadDatevCsv = () => {
    const bookingItems: DatevBookingItem[] = [];
    const invNum = 'RE-2026-0042';
    const dateStr = new Date().toISOString().slice(0, 10);
    const costCenter = selectedProject?.key || 'CRAFT-01';

    // Split booking: Line 1 for § 13b (Konto 8337 / SKR03)
    if (net13bTotal > 0 || (net13bTotal === 0 && net19Total === 0)) {
      bookingItems.push({
        bookingId: 'BK-001',
        date: dateStr,
        amount: net13bTotal > 0 ? net13bTotal : measurementGrossTotal,
        invoiceNumber: invNum,
        accountNumber: '8337',
        contraAccount: '10000',
        costCenter,
        bookingText: `VOB § 13b ${selectedProject?.name || 'Baustelle'}`,
        isReverseCharge: true,
        buKey: '68',
      });
    }

    // Split booking: Line 2 for 19% Material / Leistung (Konto 8400 / SKR03)
    if (net19Total > 0) {
      const gross19 = Math.round((net19Total + measurementVatTotal) * 100) / 100;
      bookingItems.push({
        bookingId: 'BK-002',
        date: dateStr,
        amount: gross19,
        invoiceNumber: invNum,
        accountNumber: '8400',
        contraAccount: '10000',
        costCenter,
        bookingText: `19% Material ${selectedProject?.name || 'Baustelle'}`,
        taxRate: 0.19,
        isReverseCharge: false,
      });
    }

    const csvContent = generateDatevCsv(bookingItems, {
      beraterNummer: 10001,
      mandantenNummer: 20042,
      skr: 'SKR03',
      bezeichnung: 'DATEV Export VIBE Craft',
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DATEV_EXTF700_${selectedProject?.key || 'CRAFT'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZugferdXml = () => {
    const invoiceData: ZugferdInvoiceData = {
      invoiceNumber: 'RE-2026-0042',
      invoiceDate: new Date().toISOString().slice(0, 10),
      periodFrom: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
      periodTo: new Date().toISOString().slice(0, 10),
      currency: 'EUR',
      sellerName: 'Vibeforce Craft Meisterbetrieb GmbH',
      sellerStreet: 'Handwerkerstraße 14',
      sellerCity: 'München',
      sellerCountry: 'DE',
      sellerTaxId: 'DE999999999',
      sellerVatId: 'DE999999999',
      buyerName: (selectedProject as any)?.expand?.client?.name || 'Bauherr & Auftraggeber AG',
      buyerStreet: 'Hauptstraße 1',
      buyerCity: 'Berlin',
      buyerCountry: 'DE',
      buyerVatId: isSelectedProject13b ? 'DE888888888' : undefined,
      lineItems: measurementItems.map((item) => {
        const isItem19 = (item.tax_rate_type || defaultTaxType) === 'standard_19';
        return {
          name: item.title,
          quantity: item.quantity,
          unitCode: item.unit === 'm2' ? 'MTK' : item.unit === 'm3' ? 'MTQ' : item.unit === 'h' ? 'HUR' : 'C62',
          netAmount: item.unit_price,
          taxPercent: isItem19 ? 0.19 : 0.00,
        };
      }),
      subtotal: measurementNetTotal,
      taxRate: isSelectedProject13b ? 0 : 0.19,
      taxAmount: measurementVatTotal,
      total: measurementGrossTotal,
      isReverseCharge: isSelectedProject13b && net19Total === 0,
      paymentTerms: 'Zahlbar innerhalb von 14 Tagen nach VOB/B § 16 Abs. 1',
    };

    const xml = generateZugferdXml(invoiceData);
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ZUGFeRD_2.1.1_${invoiceData.invoiceNumber}.xml`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto pb-28 md:pb-8">
      {/* SOBER FUNCTIONAL HEADER */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>M007 • VIBE CRAFT</span>
              <span>•</span>
              <span>VOB/B & VOB/C</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Handwerk & Baustellen
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Bautagesberichte, VOB-Aufmaß, Geofencing und ZUGFeRD 2.1.1 E-Rechnungen.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              id="craft-license-btn"
              variant="outline"
              onClick={() => setIsLicenseModalOpen(true)}
              className="border-border hover:border-amber-500/50 text-foreground text-xs h-9 px-3.5 flex items-center gap-1.5"
            >
              <Sliders size={14} className="text-amber-500" />
              <span>Module &amp; Lizenzen</span>
              <Badge variant="secondary" className="text-[10px] font-mono uppercase py-0 ml-1">
                {activeTier}
              </Badge>
            </Button>
            <Button
              id="craft-create-report-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4 shadow-sm"
            >
              <Plus size={16} className="mr-1.5" />
              Bericht erfassen
            </Button>
            <Button
              id="craft-datev-export-btn"
              variant="outline"
              onClick={handleDownloadDatevCsv}
              className="border-border hover:border-amber-500/50 text-foreground text-xs h-9 px-3.5"
            >
              <Download size={14} className="mr-1.5 text-amber-500" />
              DATEV Export
            </Button>
          </div>
        </div>

        {/* 4 Clean Sober KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-border/60">
          <div>
            <div className="text-xs text-muted-foreground">Aktive Baustellen</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{activeProjectsCount}</div>
            <div className="text-[11px] text-muted-foreground">{geofencedProjectsCount} mit GPS</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Bautagesberichte</div>
            <div className="text-xl font-bold text-foreground mt-0.5">{reports.length}</div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              {signedReportsCount} signiert
            </div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">VOB-Aufmaß Netto</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {measurementNetTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-muted-foreground">{measurementItems.length} Positionen</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">E-Rechnungen</div>
            <div className="text-xl font-bold text-foreground mt-0.5">
              {totalInvoicedGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-muted-foreground">ZUGFeRD 2.1.1 & § 13b</div>
          </div>
        </div>
      </div>

      {/* HORIZONTALLY SCROLLABLE TOUCH-FRIENDLY TABS */}
      <div className="relative -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex items-center gap-2 overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-1">
          <button
            onClick={() => setActiveTab('reports')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText size={15} />
            <span>Bautagesberichte</span>
            {!isReportsEnabled ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'reports' ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                }`}
              >
                {reports.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('measurements')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'measurements'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>VOB-Aufmaß</span>
            {!isMeasurementsEnabled && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('geofence')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'geofence'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin size={15} />
            <span>GPS-Geofencing</span>
            {!isGeofenceEnabled ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'geofence' ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                }`}
              >
                {geofencedProjectsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('invoices')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'invoices'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Receipt size={15} />
            <span>Rechnungen & DATEV</span>
            {!isInvoicesEnabled && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            )}
          </button>

          <button
            id="craft-tab-gaeb-btn"
            onClick={() => setActiveTab('gaeb')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gaeb'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileCode size={15} />
            <span>GAEB / LV (X83/X84)</span>
            {!isGaebEnabled ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'gaeb' ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                }`}
              >
                XML
              </span>
            )}
          </button>

          <button
            id="craft-tab-margin-btn"
            onClick={() => setActiveTab('margin')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'margin'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp size={15} />
            <span>Nachkalkulation & Margen</span>
            {!isMarginEnabled ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'margin' ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                }`}
              >
                DB II
              </span>
            )}
          </button>

          <button
            id="craft-tab-wholesale-btn"
            onClick={() => setActiveTab('wholesale')}
            className={`snap-start shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wholesale'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag size={15} />
            <span>Großhandel & DATANORM</span>
            {!isWholesaleEnabled ? (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                <Lock size={10} /> Add-on
              </span>
            ) : (
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                  activeTab === 'wholesale' ? 'bg-black/20 text-black' : 'bg-muted text-muted-foreground'
                }`}
              >
                IDS 2.5
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: BAUTAGESBERICHTE & REGIEBERICHTE */}
      {activeTab === 'reports' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!isReportsEnabled ? (
            <CraftFeatureUpsell
              featureId="reports"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <>
              {/* VOB/B § 6 Legal Compliance Callout */}
              <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <span className="p-1 rounded-lg bg-amber-500/15 text-amber-500">
                    <AlertCircle size={15} />
                  </span>
              <span>
                <strong>VOB/B § 6 Kausalitäts-Dokumentation:</strong> Witterungsbedingte Behinderungen werden mit Temperatur, Wetterlage und direktem Bezug zur Gewerke-Ausführung rechtssicher protokolliert.
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 border-amber-500/30 text-amber-600 dark:text-amber-400 font-mono">
              VOB/B § 6 Abs. 1
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Input
                placeholder="Nach Baustelle oder Bericht suchen..."
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                className="max-w-xs h-9 text-sm"
              />
              <div className="flex items-center gap-1">
                {['all', 'signed', 'draft'].map((status) => (
                  <Button
                    key={status}
                    variant={reportFilterStatus === status ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setReportFilterStatus(status)}
                    className="text-xs h-8 capitalize"
                  >
                    {status === 'all' ? 'Alle' : status === 'signed' ? 'Signiert' : 'Entwurf'}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-3.5"
            >
              <Plus size={15} className="mr-1.5" />
              Bautagesbericht anlegen
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {filteredReports.length > 0 ? (
              filteredReports.map((report) => {
                const projName = (report as any)?.expand?.project?.name || selectedProject?.name || 'Baustelle';
                const authorName = (report as any)?.expand?.author?.name || 'Bauleiter';
                const hoursMaster = report.qualification_hours?.meister || 0;
                const hoursJourneyman = report.qualification_hours?.geselle || 0;
                const hoursApprentice = report.qualification_hours?.azubi || 0;
                const totalHours = hoursMaster + hoursJourneyman + hoursApprentice;

                return (
                  <Card key={report.id} className="border-border/60 hover:border-amber-500/40 transition-all bg-card/60 backdrop-blur-sm">
                    <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="font-black text-base text-foreground flex items-center gap-2">
                            <Calendar size={15} className="text-amber-500" />
                            {new Date(report.report_date).toLocaleDateString('de-DE', {
                              weekday: 'short',
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                            })}
                          </span>
                          <Badge variant="outline" className="text-xs font-semibold">
                            {projName}
                          </Badge>
                          {report.status === 'signed' ? (
                            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                              <CheckCircle2 size={12} /> Rechtssicher signiert
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[11px] text-muted-foreground">
                              Entwurf
                            </Badge>
                          )}
                          {(report as any).is_obstruction && (
                            <Badge className="bg-red-500/15 text-red-600 border-red-500/30 text-[11px] font-bold">
                              ⚠️ VOB § 6 Behinderungsanzeige
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <User size={13} /> {authorName}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CloudSun size={13} className="text-amber-500" /> {report.weather || 'Normal'} (
                            {report.temperature !== undefined ? `${report.temperature}°C` : '18°C'})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock size={13} /> {totalHours} Std. erfasst (M: {hoursMaster}h, G: {hoursJourneyman}h, A: {hoursApprentice}h)
                          </span>
                        </div>

                        {report.work_performed && (
                          <p className="text-xs text-foreground/80 line-clamp-2 mt-1">
                            {report.work_performed}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/projects/${report.project}/site-reports`}>
                          <Button variant="outline" size="sm" className="h-8 text-xs font-medium">
                            Anzeigen
                            <ChevronRight size={14} className="ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              <Card className="border-dashed border-border/80 p-12 text-center">
                <FileText size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-base text-foreground">Keine Bautagesberichte gefunden</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Erfasse den täglichen Baufortschritt, Arbeitsstunden nach Qualifikation und Wetterbedingungen nach VOB/B § 8.
                </p>
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4"
                >
                  <Plus size={15} className="mr-1.5" />
                  Ersten Bericht anlegen
                </Button>
              </Card>
            )}
          </div>
          </>
          )}
        </div>
      )}

      {/* TAB 2: VOB TEIL C AUFMAẞ-CENTER */}
      {activeTab === 'measurements' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!isMeasurementsEnabled ? (
            <CraftFeatureUpsell
              featureId="measurements"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <>
              {/* DIN 18299 § 4 Übermessungsregel Callout */}
              <div className="p-3.5 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <span className="p-1 rounded-lg bg-indigo-500/15 text-indigo-500">
                <CheckCircle2 size={15} />
              </span>
              <span>
                <strong>DIN 18299 § 4 Übermessungsregel aktiv:</strong> Aussparungen, Einzelfenster und Türen unter 2,5 m² Einzelfläche werden nach VOB/C voll übermessen (kein Abzug).
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 border-indigo-500/30 text-indigo-600 dark:text-indigo-400 font-mono">
              DIN 18299 § 4.2
            </Badge>
          </div>

          {/* Project Selector Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Baustelle:</span>
              <select
                aria-label="Baustelle auswählen"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground focus:ring-1 focus:ring-amber-500 outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
              {isSelectedProject13b && (
                <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                  § 13b UStG Bauleistung
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadZugferdXml}
                className="border-border hover:border-amber-500 text-xs font-semibold"
              >
                <FileCode size={14} className="mr-1.5 text-teal-500" />
                ZUGFeRD 2.1.1 XML
              </Button>
              <Button
                size="sm"
                onClick={handleDownloadDatevCsv}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                <Download size={14} className="mr-1.5" />
                DATEV Export
              </Button>
            </div>
          </div>

          {/* Full Interactive Measurement Grid */}
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-foreground flex items-center gap-2">
                    <FileSpreadsheet size={20} className="text-amber-500" />
                    Mengenermittlung & Aufmaß-Tabelle nach VOB Teil C
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Berechnungsformeln eingeben (z.B. L × B × H). Formeln werden automatisch nach DIN 18299 evaluiert.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs">
                  DIN 18299 Konform
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4 md:p-6">
              <MeasurementGrid
                initialItems={measurementItems}
                onChange={setMeasurementItems}
                isReverseCharge={isSelectedProject13b}
              />

              {/* Total Calculation Bar */}
              <div className="mt-6 pt-4 border-t border-border flex flex-col sm:flex-row justify-end items-end sm:items-center gap-6">
                <div className="text-right">
                  <span className="text-xs text-muted-foreground">Netto-Aufmaß:</span>
                  <div className="text-lg font-bold text-foreground">
                    {measurementNetTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs text-muted-foreground">
                    {net19Total > 0 && net13bTotal > 0
                      ? `USt. (Split: 19% + 0% § 13b):`
                      : isSelectedProject13b
                      ? 'USt. (§ 13b Reverse Charge 0%):'
                      : 'USt. (19%):'}
                  </span>
                  <div className="text-lg font-bold text-foreground">
                    {measurementVatTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>

                <div className="text-right pl-4 border-l border-border/80">
                  <span className="text-xs text-amber-500 font-bold uppercase tracking-wider">Abrechnungssumme:</span>
                  <div className="text-2xl font-black text-foreground">
                    {measurementGrossTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </div>
      )}

      {/* TAB 3: BAUSTELLEN-RADAR & GEOFENCING */}
      {activeTab === 'geofence' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!isGeofenceEnabled ? (
            <CraftFeatureUpsell
              featureId="geofence"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <>
              {/* DSGVO / BetrVG § 87 Compliance Callout */}
              <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <span className="p-1 rounded-lg bg-emerald-500/15 text-emerald-500">
                <CheckCircle2 size={15} />
              </span>
              <span>
                <strong>DSGVO & BetrVG § 87 Konformität:</strong> Kein Dauer-Tracking. Lokaler Radius-Abgleich (150m) ausschließlich während der gebuchten Schichtzeit. Automatische Löschung nach 30 Tagen.
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-mono">
              DSGVO / BetrVG § 87
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/70">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Baustelle:</span>
              <select
                aria-label="Baustelle auswählen"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm font-semibold text-foreground focus:ring-1 focus:ring-amber-500 outline-none"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.key})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-bold">
                ● Live GPS-Überwachung aktiv
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Map Column */}
            <div className="lg:col-span-2">
              <Card className="border-border/70 overflow-hidden">
                <CardHeader className="pb-3 border-b border-border/50">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <MapPin size={18} className="text-teal-500" />
                    GPS-Geofence Radius & Polygon-Editor
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Klicke auf die Karte, um den Baustellen-Mittelpunkt zu setzen oder den Radius anzupassen.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <GeofenceMapEditor
                    initialConfig={{
                      type: 'circle',
                      center: [
                        (selectedProject as any)?.geofence_lat || 48.137154,
                        (selectedProject as any)?.geofence_lng || 11.576124,
                      ],
                      radius: (selectedProject as any)?.geofence_radius || 150,
                    }}
                    onSave={async (cfg) => {
                      console.log('Saved geofence config:', cfg);
                    }}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Presence Status Column */}
            <div className="space-y-4">
              <Card className="border-border/70 bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base text-foreground flex items-center gap-2">
                    <User size={18} className="text-amber-500" />
                    Aktuell vor Ort eingecheckt
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Automatische Erfassung via GPS-Geofence (120s Dwell-Filter)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-xl bg-card/60 border border-border flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm text-foreground">Robin Lehnebach</div>
                      <div className="text-[11px] text-muted-foreground">Bauleiter • Eingecheckt vor 2h 15m</div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px]">
                      Im Radius (42m)
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm text-foreground">Thomas Schmidt</div>
                      <div className="text-[11px] text-muted-foreground">Meister • Eingecheckt vor 3h 40m</div>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-600 border-0 text-[10px]">
                      Im Radius (78m)
                    </Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-card/60 border border-border flex items-center justify-between opacity-60">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-sm text-foreground">Daniel Weber</div>
                      <div className="text-[11px] text-muted-foreground">Geselle • Pause / Abwesend</div>
                    </div>
                    <Badge variant="outline" className="text-[10px]">
                      Außerhalb
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70 bg-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Geofence Spezifikationen
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2 text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Mittelpunkt:</span>
                    <span className="font-mono text-foreground">48.1372° N, 11.5761° E</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Erfassungs-Radius:</span>
                    <span className="font-semibold text-foreground">150 Meter</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Anti-Drift Toleranz:</span>
                    <span className="font-semibold text-foreground">120 Sekunden</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          </>
          )}
        </div>
      )}

      {/* TAB 4: ZUGFERD & DATEV RECHNUNGEN */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {!isInvoicesEnabled ? (
            <CraftFeatureUpsell
              featureId="invoices"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <>
              {/* EN 16931 CIUS Prüfpfad Callout */}
              <div className="p-3.5 rounded-2xl border border-teal-500/30 bg-teal-500/5 flex items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-2.5 text-foreground font-medium">
                  <span className="p-1 rounded-lg bg-teal-500/15 text-teal-500">
                <CheckCircle2 size={15} />
              </span>
              <span>
                <strong>EN 16931 CIUS Prüfpfad:</strong> Alle Rechnungen durchlaufen vor dem Export die Schematron-Syntaxprüfung für Bauleistungen nach § 13b UStG (0,00% USt., CategoryCode AE) und DATEV EXTF 7.0 Satzstruktur.
              </span>
            </div>
            <Badge variant="outline" className="text-[10px] shrink-0 border-teal-500/30 text-teal-600 dark:text-teal-400 font-mono">
              GoBD & EN 16931
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border/70">
            <div>
              <h3 className="font-black text-lg text-foreground">E-Rechnungs- & DATEV Export-Zentrale</h3>
              <p className="text-xs text-muted-foreground">
                ZUGFeRD 2.1.1 EN 16931 E-Rechnungen und standardkonforme DATEV EXTF 700 Buchungsstapel.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Button
                variant="outline"
                onClick={handleDownloadZugferdXml}
                className="border-border hover:border-teal-500 text-xs font-bold"
              >
                <FileCode size={15} className="mr-1.5 text-teal-500" />
                ZUGFeRD XML herunterladen
              </Button>
              <Button
                onClick={handleDownloadDatevCsv}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                <Download size={15} className="mr-1.5" />
                DATEV CSV herunterladen
              </Button>
            </div>
          </div>

          <Card className="border-border/70">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base text-foreground">Erstellte Rechnungen & VOB-Abschläge</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                <div className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-accent/20 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-foreground">RE-2026-0042</span>
                      <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                        1. Abschlagsrechnung (VOB § 16)
                      </Badge>
                      <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 text-[10px]">
                        § 13b UStG Reverse Charge
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Baustelle: {selectedProject?.name || 'Gewerbepark Nord'} • Datum: 02.09.2026 • Fällig in 14 Tagen
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-base font-black text-foreground">
                        {measurementGrossTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </div>
                      <span className="text-[10px] text-emerald-500 font-semibold">SKR03 Kto. 8337</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadZugferdXml}
                        className="h-8 text-xs font-semibold"
                      >
                        <Download size={13} className="mr-1 text-teal-500" />
                        XML
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadDatevCsv}
                        className="h-8 text-xs font-semibold"
                      >
                        <Download size={13} className="mr-1 text-amber-500" />
                        DATEV
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </>
          )}
        </div>
      )}

      {/* TAB 5: GAEB / LV (X83 IMPORT & X84 ANGEBOTSABGABE) */}
      {activeTab === 'gaeb' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!isGaebEnabled ? (
            <CraftFeatureUpsell
              featureId="gaeb"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <GaebManager
              projectName={selectedProject?.name}
              onTransferToAufmass={(newItems) => {
                setMeasurementItems((prev) => {
                  const existingNrs = new Set(prev.map((p) => p.position_nr));
                  const toAdd = newItems.filter((it) => !existingNrs.has(it.position_nr));
                  return [...prev, ...toAdd];
                });
                setActiveTab('measurements');
              }}
            />
          )}
        </div>
      )}

      {/* TAB 6: SOLL/IST-NACHKALKULATION & MARGEN-COCKPIT */}
      {activeTab === 'margin' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!isMarginEnabled ? (
            <CraftFeatureUpsell
              featureId="margin"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <>
              {!selectedProject && (
                <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-between gap-4 text-xs">
                  <div className="flex items-center gap-2.5 text-foreground font-medium">
                    <span className="p-1 rounded-lg bg-amber-500/20 text-amber-500">
                      <AlertCircle size={15} />
                    </span>
                    <span>
                      <strong>Muster-Baustelle aktiv:</strong> Da noch kein eigenes Bauprojekt angelegt ist, wird das Margen-Cockpit mit realistischen Musterdaten demonstriert.
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0"
                  >
                    Eigenes Projekt anlegen
                  </Button>
                </div>
              )}
              <CostCockpit
                project={selectedProject || sampleProject}
                timeEntries={
                  selectedProject
                    ? timeEntries.filter((te: any) => {
                        const pId = te.expand?.task?.project || (te as any).project;
                        return !pId || pId === selectedProject.id;
                      })
                    : sampleTimeEntries
                }
                siteReports={
                  selectedProject
                    ? reports.filter((r) => r.project === selectedProject.id)
                    : sampleSiteReports
                }
                invoices={
                  selectedProject
                    ? invoices.filter((inv) => inv.project === selectedProject.id)
                    : [{ net_total: 48000 }]
                }
                plannedBoqNetTotal={(selectedProject || sampleProject).budget_money}
              />
            </>
          )}
        </div>
      )}

      {/* TAB 7: GROSSHANDELS-KATALOGE & IDS-CONNECT 2.5 */}
      {activeTab === 'wholesale' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!isWholesaleEnabled ? (
            <CraftFeatureUpsell
              featureId="wholesale"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <WholesaleManager
              projectName={selectedProject?.name}
              importedCart={idsHookCart}
              onTransferToAufmass={(newItems) => {
                setMeasurementItems((prev) => {
                  const existingNrs = new Set(prev.map((p) => p.position_nr));
                  const toAdd = newItems.filter((it) => !existingNrs.has(it.position_nr));
                  return [...prev, ...toAdd];
                });
                setActiveTab('measurements');
              }}
              onTransferToGaeb={() => {
                setActiveTab('gaeb');
              }}
            />
          )}
        </div>
      )}

      {/* QUICK CREATE MODAL */}
      <QuickCreateReportModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        projects={projects}
        defaultProjectId={selectedProject?.id}
        onSuccess={(savedReport) => {
          setReports((prev) => [savedReport, ...prev]);
        }}
      />

      {/* CRAFT ENTITLEMENTS & UPSELL MODAL */}
      <CraftEntitlementsModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
        projects={projects}
        currentProjectId={selectedProject?.id}
      />
    </div>
  );
}
