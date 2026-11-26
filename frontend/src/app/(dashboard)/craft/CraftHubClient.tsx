'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  AlertTriangle,
  FileCode,
  TrendingUp,
  ShoppingBag,
  ChevronRight,
  Lock,
  Sliders,
  Sparkles,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MeasurementGrid, type MeasurementRowItem } from '@/components/craft/MeasurementGrid';
import { QuickCreateReportModal } from '@/components/craft/QuickCreateReportModal';
import { NewBaustelleDialog } from '@/components/craft/NewBaustelleDialog';
import { GaebManager } from '@/components/craft/GaebManager';
import { CostCockpit } from '@/components/craft/CostCockpit';
import { WholesaleManager } from '@/components/craft/WholesaleManager';
import { PlanPinningManager } from '@/components/craft/PlanPinningManager';
import { CraftFeatureUpsell } from '@/components/craft/CraftFeatureUpsell';
import { CraftEntitlementsModal } from '@/components/craft/CraftEntitlementsModal';
import { useCraftEntitlementsStore } from '@/lib/craft-entitlements';
import { generateDatevCsv, encodeWindows1252, type DatevBookingItem } from '@/lib/datev-export';
import { generateZugferdXml, type ZugferdInvoiceData } from '@/lib/zugferd';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';
import { getImportedIdsCartAction } from '@/app/actions/craft/ids-carts';
import { getMeasurementsByProjectAction } from '@/app/actions/craft/measurements';
import { pb } from '@/lib/pocketbase';
import { filterProjectsByMode } from '@/lib/data-isolation';
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

type CraftTab = 'reports' | 'measurements' | 'geofence' | 'invoices' | 'gaeb' | 'margin' | 'wholesale' | 'pinning';

export function CraftHubClient({
  initialProjects = [],
  initialReports = [],
  initialInvoices = [],
  initialTimeEntries = [],
}: CraftHubClientProps) {
  const router = useRouter();
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<CraftTab>('reports');
  const isSiteTab = (tab: CraftTab) => ['reports', 'measurements', 'geofence', 'pinning'].includes(tab);
  const isCommercialTab = (tab: CraftTab) => ['invoices', 'margin', 'gaeb', 'wholesale'].includes(tab);

  const [activeCluster, setActiveCluster] = useState<'site' | 'commercial'>(() =>
    ['invoices', 'margin', 'gaeb', 'wholesale'].includes(activeTab) ? 'commercial' : 'site'
  );

  // Sync cluster if activeTab changes externally (e.g. from IDS redirect or URL params)
  useEffect(() => {
    if (isCommercialTab(activeTab)) {
      setActiveCluster('commercial');
    } else if (isSiteTab(activeTab)) {
      setActiveCluster('site');
    }
  }, [activeTab]);

  const handleClusterSwitch = (newCluster: 'site' | 'commercial') => {
    setActiveCluster(newCluster);
    if (newCluster === 'site' && !isSiteTab(activeTab)) {
      setActiveTab('reports');
    } else if (newCluster === 'commercial' && !isCommercialTab(activeTab)) {
      setActiveTab('invoices');
    }
  };

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

  const [projects, setProjects] = useState<ProjectRecord[]>(initialProjects);
  const [reports, setReports] = useState<SiteReportRecord[]>(initialReports);
  const [invoices] = useState<any[]>(initialInvoices);
  const [timeEntries, setTimeEntries] = useState<TimeEntryRecord[]>(initialTimeEntries);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);
  const [isBaustelleModalOpen, setIsBaustelleModalOpen] = useState<boolean>(false);
  const { isFeatureEnabled, activeTier } = useCraftEntitlementsStore();

  const handleBaustelleCreated = (newBaustelle: ProjectRecord) => {
    setProjects((prev) => [newBaustelle, ...prev]);
    setSelectedProjectId(newBaustelle.id);
  };

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
  const isPinningEnabled = isFeatureEnabled('pinning', selectedProject?.id);

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
        work_performed: 'Rohbau & Trockenbau-Ständerwerk EG komplett montiert; Kabeltrassen-Abnahme vorbereitet.',
        weather: 'Trocken · 14°C',
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
        expand: {
          project: { id: 'sample_craft_project', key: 'BAU-DEMO', name: 'Neubau Gewerbehalle Nord (Muster-Baustelle)' } as any,
        },
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

  // Client-side PocketBase sync + graceful demo fallback if SSR returned empty
  useEffect(() => {
    if (initialProjects.length > 0 && initialReports.length > 0) return;
    let cancelled = false;
    (async () => {
      try {
        let nextProjects = initialProjects;
        if (nextProjects.length === 0 && pb.authStore.isValid) {
          const projRes = await pb.collection('projects').getList(1, 50, {
            sort: '-created',
            expand: 'client',
          });
          nextProjects = filterProjectsByMode(projRes.items as unknown as ProjectRecord[]);
        }
        let nextReports = initialReports;
        if (nextReports.length === 0 && pb.authStore.isValid) {
          try {
            const repRes = await pb.collection('site_reports').getList(1, 50, {
              sort: '-report_date',
              expand: 'project,author',
            });
            nextReports = repRes.items as unknown as SiteReportRecord[];
          } catch {}
        }
        if (cancelled) return;
        if (nextProjects.length === 0) {
          nextProjects = [sampleProject];
          if (nextReports.length === 0) nextReports = sampleSiteReports;
          if (timeEntries.length === 0) setTimeEntries(sampleTimeEntries);
        } else if (nextReports.length === 0) {
          nextReports = sampleSiteReports.map((r) => ({
            ...r,
            project: nextProjects[0].id,
            expand: { project: nextProjects[0] as any },
          }));
        }
        setProjects(nextProjects);
        setSelectedProjectId((prev) => prev || nextProjects[0]?.id || '');
        setReports(nextReports);
      } catch {
        if (cancelled) return;
        if (projects.length === 0) {
          setProjects([sampleProject]);
          setSelectedProjectId(sampleProject.id);
        }
        if (reports.length === 0) setReports(sampleSiteReports);
        if (timeEntries.length === 0) setTimeEntries(sampleTimeEntries);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialProjects, initialReports, sampleProject, sampleSiteReports, sampleTimeEntries]);

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

  // Load persisted measurements for the selected project
  useEffect(() => {
    if (!selectedProjectId || selectedProjectId === 'sample_craft_project') return;
    let cancelled = false;
    getMeasurementsByProjectAction(selectedProjectId)
      .then((rows) => {
        if (cancelled || rows.length === 0) return;
        setMeasurementItems(
          rows.map((r: any) => ({
            id: r.id,
            position_nr: r.position_nr || '01',
            title: r.title,
            formula: r.formula || '',
            quantity: Number(r.quantity) || 0,
            unit: r.unit || 'm2',
            unit_price: Number(r.unit_price) || 0,
            total_price: Number(r.total_price) || 0,
            tax_rate_type: r.tax_rate_type || 'reverse_charge_13b',
            notes: r.notes || '',
          }))
        );
      })
      .catch((err) => {
        console.warn('[CraftHubClient] Failed to load project measurements:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedProjectId]);

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
  const projectInvoices = useMemo(
    () =>
      selectedProject?.id
        ? invoices.filter((inv) => inv.project === selectedProject.id)
        : invoices,
    [invoices, selectedProject?.id]
  );

  const buildDynamicInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const key = (selectedProject?.key || 'CRAFT').replace(/[^A-Za-z0-9_-]/g, '');
    const seq = String(projectInvoices.length + 1).padStart(4, '0');
    return `RE-${year}-${key}-${seq}`;
  };

  const handleDownloadDatevCsv = (targetInvoice?: any) => {
    const bookingItems: DatevBookingItem[] = [];
    const dateStr = new Date().toISOString().slice(0, 10);
    const costCenter = selectedProject?.key || 'CRAFT-01';

    const sourceInvoices = targetInvoice ? [targetInvoice] : projectInvoices;

    if (sourceInvoices.length > 0) {
      sourceInvoices.forEach((inv, idx) => {
        const invNum = inv.invoice_number || buildDynamicInvoiceNumber();
        const invDate = (inv.created || dateStr).slice(0, 10);
        const invCostCenter = inv.expand?.project?.key || costCenter;
        const invProjName = inv.expand?.project?.name || selectedProject?.name || 'Baustelle';
        const isRevCharge = Number(inv.tax_rate) === 0;
        const amount = Number(inv.gross_total ?? inv.net_total ?? 0);

        bookingItems.push({
          bookingId: `BK-${String(idx + 1).padStart(3, '0')}`,
          date: invDate,
          amount,
          invoiceNumber: invNum,
          accountNumber: isRevCharge ? '8337' : '8400',
          contraAccount: '10000',
          costCenter: invCostCenter,
          bookingText: `${isRevCharge ? 'VOB § 13b' : '19% USt'} ${invProjName}`,
          taxRate: isRevCharge ? 0 : (Number(inv.tax_rate) || 19) / 100,
          isReverseCharge: isRevCharge,
          buKey: isRevCharge ? '68' : undefined,
        });
      });
    } else {
      const invNum = buildDynamicInvoiceNumber();

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
    }

    const csvContent = generateDatevCsv(bookingItems, {
      beraterNummer: 10001,
      mandantenNummer: 20042,
      skr: 'SKR03',
      bezeichnung: 'DATEV Export VIBE Craft',
    });

    const cp1252Bytes = encodeWindows1252(csvContent);
    const blob = new Blob([new Uint8Array(cp1252Bytes)], { type: 'text/csv;charset=windows-1252;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `DATEV_EXTF700_${selectedProject?.key || 'CRAFT'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadZugferdXml = (targetInvoice?: any) => {
    if (targetInvoice?.zugferd_xml) {
      const blob = new Blob([targetInvoice.zugferd_xml], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ZUGFeRD_2.1.1_${targetInvoice.invoice_number || 'Rechnung'}.xml`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return;
    }

    const client = (selectedProject as any)?.expand?.client;
    const rawVatId =
      (selectedProject as any)?.buyer_vat_id ||
      (selectedProject as any)?.vat_id ||
      client?.vat_id ||
      client?.ust_idnr ||
      client?.tax_id;
    const buyerVatId = typeof rawVatId === 'string' && rawVatId.trim() ? rawVatId.trim() : undefined;

    if (isSelectedProject13b && !buyerVatId) {
      toast.error('Für § 13b Reverse-Charge fehlt die USt-IdNr. beim Auftraggeber.');
      return;
    }

    const rawAddress = typeof client?.address === 'string' ? client.address.trim() : '';
    const addressParts = rawAddress ? rawAddress.split(',').map((s: string) => s.trim()) : [];
    const invoiceNum = buildDynamicInvoiceNumber();

    const invoiceData: ZugferdInvoiceData = {
      invoiceNumber: invoiceNum,
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
      buyerName: client?.company || client?.name || selectedProject?.name || 'Auftraggeber',
      buyerStreet: client?.street || addressParts[0] || selectedProject?.site_address?.street || '',
      buyerCity:
        client?.city ||
        addressParts.slice(1).join(', ') ||
        [selectedProject?.site_address?.zip, selectedProject?.site_address?.city].filter(Boolean).join(' ') ||
        '',
      buyerCountry: client?.country || selectedProject?.site_address?.country || 'DE',
      buyerVatId,
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
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto pb-28 md:pb-8 w-full min-w-0 overflow-x-hidden">
      {/* SOBER FUNCTIONAL HEADER */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col 2xl:flex-row 2xl:items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>M007 • VIBE CRAFT</span>
              <span>•</span>
              <span>VOB/B &amp; VOB/C</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Handwerk &amp; Baustellen
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
              Bautagesberichte, VOB-Aufmaß, Geofencing und ZUGFeRD 2.1.1 E-Rechnungen.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-start 2xl:justify-end shrink-0">
            <Button
              id="craft-license-btn"
              variant="outline"
              onClick={() => setIsLicenseModalOpen(true)}
              className="border-border hover:border-amber-500/50 text-foreground text-xs h-9 px-3 flex items-center gap-1.5 shrink-0"
            >
              <Sliders size={13} className="text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Module &amp; Lizenzen</span>
              <span className="sm:hidden">Lizenzen</span>
              <Badge variant="secondary" className="text-[10px] font-mono uppercase py-0 px-1.5 ml-0.5">
                {activeTier}
              </Badge>
            </Button>
            <Button
              id="craft-datev-export-btn"
              variant="outline"
              onClick={() => handleDownloadDatevCsv()}
              className="border-border hover:border-amber-500/50 text-foreground text-xs h-9 px-3 shrink-0 flex items-center gap-1.5"
            >
              <Download size={13} className="text-amber-500 shrink-0" />
              <span>DATEV</span>
            </Button>
            <Button
              id="craft-create-report-btn"
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
              className="border-amber-500/40 hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs h-9 px-3.5 shadow-sm shrink-0 flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus size={14} className="text-amber-500 shrink-0" />
              <span>Bericht erfassen</span>
            </Button>
            <Button
              id="craft-create-baustelle-btn"
              onClick={() => setIsBaustelleModalOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4 shadow-sm flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Hammer size={14} className="shrink-0" />
              <span>Baustelle anlegen</span>
            </Button>
          </div>
        </div>

        {/* 4 Clean Sober KPIs with OpenDesign Card Posture */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t border-border/60">
          <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm min-w-0">
            <div className="text-xs font-medium text-muted-foreground truncate">Aktive Baustellen</div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
              {activeProjectsCount}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span className="truncate">{geofencedProjectsCount} mit GPS-Radius</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm min-w-0">
            <div className="text-xs font-medium text-muted-foreground truncate">Bautagesberichte</div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
              {reports.length}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1 truncate">
              <CheckCircle2 size={11} className="shrink-0" />
              <span className="truncate">{signedReportsCount} rechtssicher signiert</span>
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm min-w-0">
            <div className="text-xs font-medium text-muted-foreground truncate">VOB-Aufmaß Netto</div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
              {measurementNetTotal.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {measurementItems.length} erfasste Positionen
            </div>
          </div>
          <div className="p-3.5 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm min-w-0">
            <div className="text-xs font-medium text-muted-foreground truncate">E-Rechnungen</div>
            <div className="text-xl sm:text-2xl font-mono font-bold tracking-tight text-foreground mt-1 tabular-nums truncate">
              {totalInvoicedGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
              ZUGFeRD 2.1.1 &amp; § 13b
            </div>
          </div>
        </div>
      </div>

      {/* 2-CLUSTER ARBEITSBEREICH NAVIGATION (OPTION A — ZERO HORIZONTAL SCROLL) */}
      <div className="w-full space-y-3">
        {/* Cluster Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-card/60 backdrop-blur-sm rounded-2xl border border-border">
          <button
            id="craft-cluster-site-btn"
            type="button"
            onClick={() => handleClusterSwitch('site')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeCluster === 'site'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <Hammer size={16} className={activeCluster === 'site' ? 'text-black' : 'text-amber-500'} />
            <span className="hidden sm:inline truncate">Baustelle &amp; Doku</span>
            <span className="sm:hidden truncate">Baustelle</span>
            <Badge
              variant="secondary"
              className={`hidden lg:inline-flex text-[10px] font-mono py-0 px-1.5 ${
                activeCluster === 'site' ? 'bg-black/20 text-black font-semibold' : ''
              }`}
            >
              4 Module
            </Badge>
          </button>

          <button
            id="craft-cluster-commercial-btn"
            type="button"
            onClick={() => handleClusterSwitch('commercial')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeCluster === 'commercial'
                ? 'bg-amber-500 text-black shadow-sm font-bold'
                : 'bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            <TrendingUp size={16} className={activeCluster === 'commercial' ? 'text-black' : 'text-amber-500'} />
            <span className="hidden sm:inline truncate">Kaufmännisch &amp; Abrechnung</span>
            <span className="sm:hidden truncate">Kaufmännisch</span>
            <Badge
              variant="secondary"
              className={`hidden lg:inline-flex text-[10px] font-mono py-0 px-1.5 ${
                activeCluster === 'commercial' ? 'bg-black/20 text-black font-semibold' : ''
              }`}
            >
              4 Module
            </Badge>
          </button>
        </div>

        {/* Active Cluster Sub-Tabs (4 Large Touch-Ergonomic Action Cards) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
          {activeCluster === 'site' ? (
            <>
              <button
                id="craft-tab-reports-btn"
                onClick={() => setActiveTab('reports')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'reports'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">Bautagesberichte</span>
                  <span className="xl:hidden truncate">Berichte</span>
                </div>
                {!isReportsEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'reports' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {reports.length}
                  </span>
                )}
              </button>

              <button
                id="craft-tab-measurements-btn"
                onClick={() => setActiveTab('measurements')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'measurements'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet size={15} className="shrink-0" />
                  <span className="truncate">VOB-Aufmaß</span>
                </div>
                {!isMeasurementsEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'measurements' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    DIN
                  </span>
                )}
              </button>

              <button
                id="craft-tab-geofence-btn"
                onClick={() => setActiveTab('geofence')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'geofence'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">GPS-Geofencing</span>
                  <span className="xl:hidden truncate">Geofencing</span>
                </div>
                {!isGeofenceEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'geofence' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {geofencedProjectsCount}
                  </span>
                )}
              </button>

              <button
                id="craft-tab-pinning-btn"
                onClick={() => setActiveTab('pinning')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'pinning'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Layers size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">Plan-Pinning &amp; Mängel</span>
                  <span className="xl:hidden truncate">Pläne &amp; Mängel</span>
                </div>
                {!isPinningEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'pinning' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    VOB/B
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                id="craft-tab-invoices-btn"
                onClick={() => setActiveTab('invoices')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'invoices'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Receipt size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">Rechnungen &amp; DATEV</span>
                  <span className="xl:hidden truncate">Rechnungen</span>
                </div>
                {!isInvoicesEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'invoices' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    eRechnung
                  </span>
                )}
              </button>

              <button
                id="craft-tab-margin-btn"
                onClick={() => setActiveTab('margin')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'margin'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <TrendingUp size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">Nachkalkulation &amp; Margen</span>
                  <span className="xl:hidden truncate">Kalkulation</span>
                </div>
                {!isMarginEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'margin' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    DB II
                  </span>
                )}
              </button>

              <button
                id="craft-tab-gaeb-btn"
                onClick={() => setActiveTab('gaeb')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'gaeb'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileCode size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">GAEB / LV (X83/X84)</span>
                  <span className="xl:hidden truncate">GAEB / LV</span>
                </div>
                {!isGaebEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'gaeb' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    XML
                  </span>
                )}
              </button>

              <button
                id="craft-tab-wholesale-btn"
                onClick={() => setActiveTab('wholesale')}
                className={`w-full min-h-[46px] px-3 sm:px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between gap-2 shadow-xs cursor-pointer active:scale-[0.99] ${
                  activeTab === 'wholesale'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-amber-500/30'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ShoppingBag size={15} className="shrink-0" />
                  <span className="hidden xl:inline truncate">Großhandel &amp; DATANORM</span>
                  <span className="xl:hidden truncate">Großhandel</span>
                </div>
                {!isWholesaleEnabled ? (
                  <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Lock size={10} /> Add-on
                  </span>
                ) : (
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                      activeTab === 'wholesale' ? 'bg-black/20 text-black font-semibold' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    IDS 2.5
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Secondary Cluster Quick Switch Bar (Always accessible, zero overflow) */}
        <div className="flex items-center gap-2 px-1 pt-0.5 flex-wrap text-xs text-muted-foreground">
          <span className="text-[11px] font-medium text-muted-foreground shrink-0">
            {activeCluster === 'site' ? 'Kaufmännische Module:' : 'Baustellen-Module:'}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {activeCluster === 'site' ? (
              <>
                <button
                  id="craft-tab-invoices-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('commercial'); setActiveTab('invoices'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'invoices'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <Receipt size={12} className={activeTab === 'invoices' ? 'text-black' : 'text-amber-500'} />
                  <span>Rechnungen &amp; DATEV</span>
                </button>
                <button
                  id="craft-tab-margin-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('commercial'); setActiveTab('margin'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'margin'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <TrendingUp size={12} className={activeTab === 'margin' ? 'text-black' : 'text-amber-500'} />
                  <span>Nachkalkulation</span>
                </button>
                <button
                  id="craft-tab-gaeb-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('commercial'); setActiveTab('gaeb'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'gaeb'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <FileCode size={12} className={activeTab === 'gaeb' ? 'text-black' : 'text-amber-500'} />
                  <span>GAEB / LV</span>
                </button>
                <button
                  id="craft-tab-wholesale-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('commercial'); setActiveTab('wholesale'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'wholesale'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <ShoppingBag size={12} className={activeTab === 'wholesale' ? 'text-black' : 'text-amber-500'} />
                  <span>Großhandel &amp; IDS</span>
                </button>
              </>
            ) : (
              <>
                <button
                  id="craft-tab-reports-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('site'); setActiveTab('reports'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <FileText size={12} className={activeTab === 'reports' ? 'text-black' : 'text-amber-500'} />
                  <span>Bautagesberichte</span>
                </button>
                <button
                  id="craft-tab-measurements-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('site'); setActiveTab('measurements'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'measurements'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <FileSpreadsheet size={12} className={activeTab === 'measurements' ? 'text-black' : 'text-amber-500'} />
                  <span>VOB-Aufmaß</span>
                </button>
                <button
                  id="craft-tab-geofence-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('site'); setActiveTab('geofence'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'geofence'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <MapPin size={12} className={activeTab === 'geofence' ? 'text-black' : 'text-amber-500'} />
                  <span>GPS-Geofencing</span>
                </button>
                <button
                  id="craft-tab-pinning-btn-sec"
                  type="button"
                  onClick={() => { setActiveCluster('site'); setActiveTab('pinning'); }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'pinning'
                      ? 'bg-amber-500 text-black border-amber-500 font-bold'
                      : 'bg-card border-border hover:border-amber-500/50 hover:text-foreground text-muted-foreground'
                  }`}
                >
                  <Layers size={12} className={activeTab === 'pinning' ? 'text-black' : 'text-amber-500'} />
                  <span>Plan-Pinning</span>
                </button>
              </>
            )}
          </div>
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
                className="w-full sm:w-80 h-9 text-xs"
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
              className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-3.5 shrink-0"
            >
              <Plus size={15} className="mr-1.5" />
              Bautagesbericht erfassen
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
            ) : projects.length === 0 ? (
              <Card className="border-dashed border-border/80 p-10 text-center bg-card/40">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-3.5">
                  <Hammer size={24} />
                </div>
                <h3 className="font-bold text-base text-foreground">Noch keine Baustelle angelegt</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Lege zuerst dein erstes Bauvorhaben mit Adresse und Bauherr an, um Bautagesberichte und VOB-Aufmaße zu erfassen.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setIsBaustelleModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4 shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Erste Baustelle anlegen
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="border-dashed border-border/80 p-10 text-center bg-card/40">
                <FileText size={40} className="mx-auto text-muted-foreground/40 mb-3" />
                <h3 className="font-bold text-base text-foreground">Keine Bautagesberichte gefunden</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
                  Erfasse den täglichen Baufortschritt, Arbeitsstunden nach Qualifikation und Wetterbedingungen nach VOB/B § 6 &amp; § 8.
                </p>
                <div className="flex justify-center">
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs h-9 px-4 shadow-sm inline-flex items-center gap-1.5"
                  >
                    <Plus size={14} />
                    Bautagesbericht erfassen
                  </Button>
                </div>
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsBaustelleModalOpen(true)}
                className="h-8 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 px-2 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Neue Baustelle</span>
              </Button>
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
                onClick={() => handleDownloadZugferdXml()}
                className="border-border hover:border-amber-500 text-xs font-semibold"
              >
                <FileCode size={14} className="mr-1.5 text-teal-500" />
                ZUGFeRD 2.1.1 XML
              </Button>
              <Button
                size="sm"
                onClick={() => handleDownloadDatevCsv()}
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
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsBaustelleModalOpen(true)}
                className="h-8 text-xs font-semibold text-amber-500 hover:bg-amber-500/10 px-2 flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Neue Baustelle</span>
              </Button>
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
                onClick={() => handleDownloadZugferdXml()}
                className="border-border hover:border-teal-500 text-xs font-bold"
              >
                <FileCode size={15} className="mr-1.5 text-teal-500" />
                ZUGFeRD XML herunterladen
              </Button>
              <Button
                onClick={() => handleDownloadDatevCsv()}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                <Download size={15} className="mr-1.5" />
                DATEV CSV herunterladen
              </Button>
            </div>
          </div>

          <Card className="border-border/70">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle className="text-base text-foreground">Erstellte Rechnungen &amp; VOB-Abschläge</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/60">
                {projectInvoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground">
                    Noch keine E-Rechnungen in PocketBase (<code className="font-mono">invoices_zugferd</code>) für diese Baustelle gespeichert.
                  </div>
                ) : (
                  projectInvoices.map((inv) => {
                    const isRevCharge = Number(inv.tax_rate) === 0;
                    const invProjName = inv.expand?.project?.name || selectedProject?.name || 'Baustelle';
                    const invDate = inv.created
                      ? new Date(inv.created).toLocaleDateString('de-DE')
                      : '-';
                    return (
                      <div key={inv.id} className="p-4 flex items-center justify-between gap-4 flex-wrap hover:bg-accent/20 transition-colors">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono font-bold text-sm text-foreground">{inv.invoice_number}</span>
                            <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold">
                              {inv.invoice_type === 'abschlag'
                                ? 'Abschlagsrechnung (VOB § 16)'
                                : inv.invoice_type === 'schluss'
                                ? 'Schlussrechnung'
                                : 'Standardrechnung'}
                            </Badge>
                            {isRevCharge && (
                              <Badge className="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30 text-[10px]">
                                § 13b UStG Reverse Charge
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Baustelle: {invProjName} • Datum: {invDate} • Fällig in 14 Tagen
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-base font-black text-foreground">
                              {Number(inv.gross_total || 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                            </div>
                            <span className="text-[10px] text-emerald-500 font-semibold">
                              {isRevCharge ? 'SKR03 Kto. 8337' : 'SKR03 Kto. 8400'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadZugferdXml(inv)}
                              className="h-8 text-xs font-semibold"
                            >
                              <Download size={13} className="mr-1 text-teal-500" />
                              XML
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadDatevCsv(inv)}
                              className="h-8 text-xs font-semibold"
                            >
                              <Download size={13} className="mr-1 text-amber-500" />
                              DATEV
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
                    onClick={() => setIsBaustelleModalOpen(true)}
                    className="text-xs h-7 px-3 bg-amber-500 hover:bg-amber-600 text-black font-semibold shrink-0 flex items-center gap-1"
                  >
                    <Hammer size={12} />
                    <span>Eigene Baustelle anlegen</span>
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

      {/* TAB 8: 2D-PLAN-PINNING & VOB/B § 13 MÄNGELMANAGEMENT */}
      {activeTab === 'pinning' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
            <span className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Hier verwalten Sie Mängel direkt auf dem 2D-Bauplan. Für die Gesamtschau aller Mängel und formelle Mängelrügen nutzen Sie die Mängel-Zentrale.</span>
            </span>
            <Link
              href="/craft/defects"
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold shrink-0 transition-colors inline-flex items-center gap-1 shadow-xs"
            >
              <span>Zur Mängel-Zentrale</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {!isPinningEnabled ? (
            <CraftFeatureUpsell
              featureId="pinning"
              projectId={selectedProject?.id}
              onOpenLicenseManager={() => setIsLicenseModalOpen(true)}
            />
          ) : (
            <PlanPinningManager
              projectId={selectedProject?.id}
              projectName={selectedProject?.name}
              projectKey={selectedProject?.key}
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
          const matchedProject = projects.find((p) => p.id === savedReport.project) || selectedProject;
          const enrichedReport: SiteReportRecord = {
            ...savedReport,
            expand: {
              ...(savedReport.expand || {}),
              project: savedReport.expand?.project || matchedProject,
            },
          };
          setReports((prev) => [enrichedReport, ...prev.filter((r) => r.id !== enrichedReport.id)]);
          if (selectedProjectId && selectedProjectId !== 'sample_craft_project') {
            getMeasurementsByProjectAction(selectedProjectId)
              .then((rows) => {
                if (rows.length > 0) {
                  setMeasurementItems(
                    rows.map((r: any) => ({
                      id: r.id,
                      position_nr: r.position_nr || '01',
                      title: r.title,
                      formula: r.formula || '',
                      quantity: Number(r.quantity) || 0,
                      unit: r.unit || 'm2',
                      unit_price: Number(r.unit_price) || 0,
                      total_price: Number(r.total_price) || 0,
                      tax_rate_type: r.tax_rate_type || 'reverse_charge_13b',
                      notes: r.notes || '',
                    }))
                  );
                }
              })
              .catch(() => {});
          }
          router.refresh();
        }}
        onBaustelleCreated={handleBaustelleCreated}
      />

      {/* NEW BAUSTELLE DIALOG */}
      <NewBaustelleDialog
        open={isBaustelleModalOpen}
        onOpenChange={setIsBaustelleModalOpen}
        onBaustelleCreated={handleBaustelleCreated}
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
