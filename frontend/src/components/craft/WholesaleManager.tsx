'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Package,
  Upload,
  ShoppingBag,
  Layers,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Percent,
  Plus,
  Trash2,
  ExternalLink,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Download,
  AlertCircle,
  Building2,
  RotateCcw,
  Sparkles,
  Info,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  parseDatanormContent,
  serializeDatanormCatalog,
  getSampleDatanormShkCatalog,
  getSampleDatanormElektroCatalog,
  calculateSellingPrice,
  calculateMargin,
  type DatanormCatalog,
  type DatanormArticle,
} from '@/lib/datanorm';
import {
  IDS_WHOLESALER_PROFILES,
  generateIdsPunchoutUrl,
  generateIdsCartXml,
  parseIdsCartXml,
  convertIdsItemToMeasurement,
  convertIdsItemToGaebItem,
  normalizeMeasurementUnit,
  type IdsWholesalerProfile,
  type IdsCart,
  type IdsCartItem,
} from '@/lib/ids-connect';
import type { MeasurementRowItem } from '@/components/craft/MeasurementGrid';
import type { GaebItem } from '@/lib/gaeb';

interface WholesaleManagerProps {
  projectName?: string;
  onTransferToAufmass?: (items: MeasurementRowItem[]) => void;
  onTransferToGaeb?: (items: GaebItem[]) => void;
  /** Vom IDS-Webhook persistierter Warenkorb (303-Return-Flow). */
  importedCart?: IdsCart | null;
}

type SubTab = 'datanorm' | 'ids' | 'cart';

export function WholesaleManager({
  projectName,
  onTransferToAufmass,
  onTransferToGaeb,
  importedCart: importedCartFromHook,
}: WholesaleManagerProps) {
  // State for SubTab
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('datanorm');

  // Loaded DATANORM Catalog
  const [catalog, setCatalog] = useState<DatanormCatalog>(() =>
    getSampleDatanormShkCatalog()
  );

  // Search & Filter for Catalog
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [selectedCommodityGroup, setSelectedCommodityGroup] = useState<string>('all');

  // Global Margin Markup (%) on Net Purchase Price (EK)
  const [markupPercent, setMarkupPercent] = useState<number>(30);

  // Selected IDS Wholesaler
  const [selectedWholesaler, setSelectedWholesaler] = useState<IdsWholesalerProfile>(
    IDS_WHOLESALER_PROFILES[0]
  );

  // IDS Punchout Simulator Modal State
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [simulatorBasket, setSimulatorBasket] = useState<
    Array<{
      itemNumber: string;
      description: string;
      unit: string;
      priceGross: number;
      discountPercent: number;
      manufacturer: string;
      quantity: number;
    }>
  >([]);

  // Imported IDS Cart
  const [importedCart, setImportedCart] = useState<IdsCart | null>(() => {
    // Initial sample cart from GC-ONLINE PLUS
    const sampleXml = generateIdsCartXml({
      version: '2.5',
      header: {
        wholesalerName: 'GC-ONLINE PLUS (GC-Gruppe)',
        cartId: 'CART-2026-9921',
        orderDate: new Date().toISOString().slice(0, 10),
        currency: 'EUR',
        customerNumber: 'GC-KND-98421',
        orderReference: projectName || 'Projekt Neubau',
      },
      items: [
        {
          id: 'ids_1',
          itemNumber: 'GC-101001',
          description: 'Geberit Duofix Element für Wand-WC 112cm',
          quantity: 4,
          unit: 'STK',
          priceGross: 248.5,
          priceNet: 154.07,
          discountPercent: 38,
          totalNet: 616.28,
          manufacturer: 'Geberit',
        },
        {
          id: 'ids_2',
          itemNumber: 'GC-202002',
          description: 'Grohe Eurosmart Einhand-Waschtischbatterie DN 15',
          quantity: 4,
          unit: 'STK',
          priceGross: 124.0,
          priceNet: 71.92,
          discountPercent: 42,
          totalNet: 287.68,
          manufacturer: 'Grohe',
        },
      ],
      totalGross: 1490.0,
      totalNet: 903.96,
      totalVat: 171.75,
    });
    return parseIdsCartXml(sampleXml);
  });

  // Transfer notification state
  const [transferFeedback, setTransferFeedback] = useState<string | null>(null);

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return catalog.articles.filter((art) => {
      const matchesSearch =
        catalogSearch === '' ||
        art.articleNumber.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        art.shortText1.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (art.shortText2 && art.shortText2.toLowerCase().includes(catalogSearch.toLowerCase())) ||
        (art.longText && art.longText.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchesGroup =
        selectedCommodityGroup === 'all' || art.commodityGroup === selectedCommodityGroup;

      return matchesSearch && matchesGroup;
    });
  }, [catalog, catalogSearch, selectedCommodityGroup]);

  // Recalculated Articles with dynamic markup
  const calculatedArticles = useMemo(() => {
    return filteredArticles.map((art) => {
      const vk = calculateSellingPrice(art.purchasePriceNet, markupPercent);
      const { marginEuro, marginPercent } = calculateMargin(vk, art.purchasePriceNet);
      return {
        ...art,
        liveVk: vk,
        liveMarginEuro: marginEuro,
        liveMarginPercent: marginPercent,
      };
    });
  }, [filteredArticles, markupPercent]);

  // Handle DATANORM File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        try {
          const parsed = parseDatanormContent(content, {
            defaultMarkupPercent: markupPercent,
          });
          setCatalog(parsed);
          setTransferFeedback(
            `DATANORM Katalog "${file.name}" mit ${parsed.articles.length} Artikeln geladen.`
          );
          setTimeout(() => setTransferFeedback(null), 4000);
        } catch (err: any) {
          alert('Fehler beim Parsen der DATANORM Datei: ' + err.message);
        }
      }
    };
    reader.readAsText(file);
  };

  // Handle Transfer single Article to Aufmaß
  const handleTransferArticleToAufmass = (art: typeof calculatedArticles[0]) => {
    const item: MeasurementRowItem = {
      id: `m_art_${art.articleNumber}_${Date.now()}`,
      position_nr: `MAT.${art.articleNumber}`,
      title: `${art.shortText1}${art.shortText2 ? ' - ' + art.shortText2 : ''}`,
      formula: '1',
      quantity: 1,
      unit: normalizeMeasurementUnit(art.unit),
      unit_price: art.liveVk,
      total_price: art.liveVk,
      tax_rate_type: 'standard_19',
      notes: `Großhandel EK: ${art.purchasePriceNet.toFixed(2)} € (Aufschlag ${markupPercent}%)`,
    };

    if (onTransferToAufmass) {
      onTransferToAufmass([item]);
      setTransferFeedback(`Artikel "${art.articleNumber}" ins VOB-Aufmaß übertragen.`);
      setTimeout(() => setTransferFeedback(null), 3000);
    }
  };

  // Handle Transfer single Article to GAEB
  const handleTransferArticleToGaeb = (art: typeof calculatedArticles[0]) => {
    const item: GaebItem = {
      id: `gaeb_art_${art.articleNumber}_${Date.now()}`,
      oz: `01.${art.articleNumber.slice(-4) || '0010'}`,
      rNoPart: art.articleNumber.slice(-4) || '0010',
      shortText: art.shortText1,
      longText:
        art.longText ||
        `${art.shortText1} ${art.shortText2 || ''}. Einheitspreis kalkuliert nach Großhandels-EK mit ${markupPercent}% Aufschlag.`,
      qty: 1,
      qu: art.unit,
      unitPrice: art.liveVk,
      totalPrice: art.liveVk,
    };

    if (onTransferToGaeb) {
      onTransferToGaeb([item]);
      setTransferFeedback(`Artikel "${art.articleNumber}" ins GAEB-LV übertragen.`);
      setTimeout(() => setTransferFeedback(null), 3000);
    }
  };

  // IDS-Webhook Return-Flow: Persistierter Warenkorb aus dem CraftHub übernehmen
  useEffect(() => {
    if (importedCartFromHook && importedCartFromHook.items.length > 0) {
      setImportedCart(importedCartFromHook);
      setActiveSubTab('cart');
    }
  }, [importedCartFromHook]);

  // Bulk Transfer from Imported Cart to Aufmaß
  const handleTransferCartToAufmass = () => {
    if (!importedCart || importedCart.items.length === 0) return;

    const items = importedCart.items.map((it) =>
      convertIdsItemToMeasurement(it, markupPercent)
    );

    if (onTransferToAufmass) {
      onTransferToAufmass(items);
      setTransferFeedback(
        `${items.length} Positionen aus dem Großhandels-Warenkorb ins VOB-Aufmaß übernommen.`
      );
      setTimeout(() => setTransferFeedback(null), 3500);
    }
  };

  // Bulk Transfer from Imported Cart to GAEB
  const handleTransferCartToGaeb = () => {
    if (!importedCart || importedCart.items.length === 0) return;

    const items = importedCart.items.map((it, idx) =>
      convertIdsItemToGaebItem(
        it,
        markupPercent,
        `01.${String((idx + 1) * 10).padStart(4, '0')}`
      )
    );

    if (onTransferToGaeb) {
      onTransferToGaeb(items);
      setTransferFeedback(
        `${items.length} Positionen aus dem Großhandels-Warenkorb ins GAEB-LV übernommen.`
      );
      setTimeout(() => setTransferFeedback(null), 3500);
    }
  };

  // Export current DATANORM Catalog
  const handleExportDatanorm = () => {
    const raw = serializeDatanormCatalog(catalog);
    const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${catalog.header.fileName || 'DATANORM.001'}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Simulator Add item to basket
  const handleAddToSimulatorBasket = (mockArticle: (typeof selectedWholesaler.mockArticles)[0]) => {
    setSimulatorBasket((prev) => {
      const existing = prev.find((item) => item.itemNumber === mockArticle.itemNumber);
      if (existing) {
        return prev.map((item) =>
          item.itemNumber === mockArticle.itemNumber
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { ...mockArticle, quantity: 1 }];
    });
  };

  // Simulator Commit and Send Cart back to VIBE Craft
  const handleSimulatorCommitCart = () => {
    if (simulatorBasket.length === 0) return;

    const newCartItems: IdsCartItem[] = simulatorBasket.map((b, idx) => {
      const priceNet =
        Math.round(b.priceGross * (1 - b.discountPercent / 100) * 100) / 100;
      return {
        id: `ids_sim_${idx + 1}`,
        itemNumber: b.itemNumber,
        description: b.description,
        quantity: b.quantity,
        unit: b.unit,
        priceGross: b.priceGross,
        priceNet,
        discountPercent: b.discountPercent,
        totalNet: Math.round(priceNet * b.quantity * 100) / 100,
        manufacturer: b.manufacturer,
      };
    });

    const totalNet = Math.round(
      newCartItems.reduce((acc, it) => acc + it.totalNet, 0) * 100
    ) / 100;
    const totalGross = Math.round(
      newCartItems.reduce((acc, it) => acc + it.priceGross * it.quantity, 0) * 100
    ) / 100;

    const completedCart: IdsCart = {
      version: '2.5',
      header: {
        wholesalerName: selectedWholesaler.name,
        cartId: `IDS-${Date.now().toString().slice(-6)}`,
        orderDate: new Date().toISOString().slice(0, 10),
        currency: 'EUR',
        customerNumber: selectedWholesaler.customerNumber,
        orderReference: projectName || 'Baustellen-Projekt',
      },
      items: newCartItems,
      totalGross,
      totalNet,
      totalVat: Math.round(totalNet * 0.19 * 100) / 100,
    };

    setImportedCart(completedCart);
    setIsSimulatorOpen(false);
    setSimulatorBasket([]);
    setActiveSubTab('cart');

    setTransferFeedback(
      `Warenkorb mit ${newCartItems.length} Artikeln von ${selectedWholesaler.name} erfolgreich per IDS-Connect 2.5 übertragen!`
    );
    setTimeout(() => setTransferFeedback(null), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Notification */}
      {transferFeedback && (
        <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-teal-400" />
            <span>{transferFeedback}</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setTransferFeedback(null)}
            className="h-6 px-2 text-xs text-teal-400 hover:bg-teal-500/20"
          >
            Schließen
          </Button>
        </div>
      )}

      {/* Header & Subtabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-card border border-border/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/10 text-amber-500">
              <Package size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
                Großhandels-Kataloge & Einkauf
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500">
                  DATANORM 5.0 • IDS 2.5
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Direktanbindung an Großhändler (GC, Sonepar, R+F), Preispflege und nahtlose Übernahme in Aufmaß & LV.
              </p>
            </div>
          </div>
        </div>

        {/* Subtab Navigation Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60">
          <button
            onClick={() => setActiveSubTab('datanorm')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'datanorm'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileSpreadsheet size={14} />
            <span>DATANORM ({catalog.articles.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('ids')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'ids'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag size={14} />
            <span>IDS-Connect Punchout</span>
          </button>
          <button
            onClick={() => setActiveSubTab('cart')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'cart'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Layers size={14} />
            <span>Importierter Warenkorb ({importedCart?.items.length || 0})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DATANORM 5.0 KATALOG-BROWSER */}
      {activeSubTab === 'datanorm' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Quick Actions & Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Katalog / Großhändler
                  </div>
                  <div className="text-sm font-black text-foreground truncate max-w-[170px]">
                    {catalog.header.wholesalerName}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Stand: {catalog.header.creationDate} • Version {catalog.header.version}
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <Building2 size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Artikelstamm
                  </div>
                  <div className="text-xl font-black text-foreground">
                    {catalog.articles.length} <span className="text-xs font-normal text-muted-foreground">Positionen</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {Object.keys(catalog.commodityGroups).length} Warengruppen
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500">
                  <Package size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                    Kalkulatorischer Aufschlag
                  </div>
                  <div className="text-xl font-black text-amber-500">
                    +{markupPercent}% <span className="text-xs font-normal text-muted-foreground">auf EK</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Verkaufsmarge: ~{Math.round((markupPercent / (100 + markupPercent)) * 100)}% Rohertrag
                  </div>
                </div>
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500">
                  <TrendingUp size={20} />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/60">
              <CardContent className="p-4 flex flex-col justify-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCatalog(getSampleDatanormShkCatalog());
                      setTransferFeedback('SHK-Musterkatalog geladen.');
                      setTimeout(() => setTransferFeedback(null), 3000);
                    }}
                    className="h-7 text-[11px] flex-1 border-border/80 hover:bg-muted font-semibold"
                  >
                    SHK-Katalog
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCatalog(getSampleDatanormElektroCatalog());
                      setTransferFeedback('Elektro-Musterkatalog geladen.');
                      setTimeout(() => setTransferFeedback(null), 3000);
                    }}
                    className="h-7 text-[11px] flex-1 border-border/80 hover:bg-muted font-semibold"
                  >
                    Elektro-Katalog
                  </Button>
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".001,.csv,.txt,.dat,.wrg"
                    className="hidden"
                  />
                  <Button
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 text-[11px] flex-1 bg-amber-500 hover:bg-amber-600 text-black font-bold"
                  >
                    <Upload size={12} className="mr-1" />
                    Datei (.001)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleExportDatanorm}
                    className="h-7 text-[11px] px-2 border-border/80 hover:bg-muted"
                    title="Aktuellen Katalog als DATANORM 5.0 exportieren"
                  >
                    <Download size={12} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter Bar & Markup Slider */}
          <div className="p-4 rounded-2xl bg-card border border-border/70 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-1 items-center gap-2 w-full md:w-auto">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Artikel suchen nach Nummer, Text, Fabrikat..."
                  className="pl-9 text-xs h-9 bg-background/50 border-border/60"
                />
              </div>

              <select
                value={selectedCommodityGroup}
                onChange={(e) => setSelectedCommodityGroup(e.target.value)}
                className="h-9 px-3 text-xs bg-background/50 border border-border/60 rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="all">Alle Warengruppen</option>
                {Object.entries(catalog.commodityGroups).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Margin Slider */}
            <div className="flex items-center gap-3 w-full md:w-72 p-2 rounded-xl bg-muted/40 border border-border/50">
              <Sliders size={14} className="text-amber-500 shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-muted-foreground">Handwerker-Aufschlag:</span>
                  <span className="text-amber-500">+{markupPercent}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="100"
                  step="5"
                  value={markupPercent}
                  onChange={(e) => setMarkupPercent(parseInt(e.target.value, 10))}
                  className="w-full accent-amber-500 h-1.5 cursor-pointer bg-border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Articles Table */}
          <Card className="border-border/70 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                    <th className="py-3 px-4">Artikelnr.</th>
                    <th className="py-3 px-4">Bezeichnung & Details</th>
                    <th className="py-3 px-2 text-center">ME</th>
                    <th className="py-3 px-3 text-right">Katalogpreis</th>
                    <th className="py-3 px-3 text-right">Rabatt / EK</th>
                    <th className="py-3 px-3 text-right text-amber-500 font-bold">Kalkulierter VK</th>
                    <th className="py-3 px-3 text-right">Rohertrag</th>
                    <th className="py-3 px-4 text-center">Aktionen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40 font-mono">
                  {calculatedArticles.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-muted-foreground font-sans">
                        <Package size={32} className="mx-auto mb-2 text-muted-foreground/50 animate-bounce" />
                        Keine Artikel gefunden. Passen Sie die Suchkriterien an oder laden Sie einen Katalog.
                      </td>
                    </tr>
                  ) : (
                    calculatedArticles.map((art) => (
                      <tr key={art.articleNumber} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4 font-bold text-foreground">
                          {art.articleNumber}
                          <div className="text-[10px] text-muted-foreground font-normal">
                            WG: {art.commodityGroup}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-semibold text-foreground">{art.shortText1}</div>
                          {art.shortText2 && (
                            <div className="text-muted-foreground text-[11px]">{art.shortText2}</div>
                          )}
                          {art.longText && (
                            <div className="text-[10px] text-muted-foreground/80 line-clamp-1 italic mt-0.5">
                              {art.longText}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold text-muted-foreground">
                          {art.unit}
                        </td>
                        <td className="py-3 px-3 text-right text-muted-foreground">
                          {art.catalogPrice.toFixed(2)} €
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-foreground">
                            {art.purchasePriceNet.toFixed(2)} €
                          </div>
                          <span className="text-[10px] text-emerald-500 font-semibold">
                            -{art.discountPercent || 0}% ({art.discountGroup})
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-amber-500 font-bold text-sm">
                          {art.liveVk.toFixed(2)} €
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="font-bold text-emerald-400">
                            +{art.liveMarginEuro.toFixed(2)} €
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {art.liveMarginPercent}% Marge
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-sans">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransferArticleToAufmass(art)}
                              className="h-7 text-[11px] px-2 font-semibold hover:bg-amber-500/20 hover:text-amber-500"
                              title="In VOB-Aufmaß übernehmen"
                            >
                              <FileSpreadsheet size={13} className="mr-1 text-amber-500" />
                              Aufmaß
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleTransferArticleToGaeb(art)}
                              className="h-7 text-[11px] px-2 font-semibold hover:bg-teal-500/20 hover:text-teal-500"
                              title="In GAEB-LV übernehmen"
                            >
                              <FileCode size={13} className="mr-1 text-teal-500" />
                              GAEB
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* SUBTAB 2: IDS-CONNECT 2.5 PUNCHOUT SIMULATOR */}
      {activeSubTab === 'ids' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Wholesaler Selection Card */}
            <Card className="md:col-span-2 border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-black text-foreground flex items-center justify-between">
                  <span>Großhändler für IDS-Connect 2.5 Punchout</span>
                  <Badge variant="outline" className="text-teal-400 border-teal-500/30 text-[10px]">
                    Schnittstelle IGH IDS 2.5
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Wählen Sie Ihren Fachgroßhändler. Beim Klick auf den Punchout-Button öffnet sich der B2B-Katalog,
                  wo Sie Artikel konfigurieren und direkt per XML-Rücksprung in VIBE Craft übertragen.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {IDS_WHOLESALER_PROFILES.map((wh) => (
                    <div
                      key={wh.id}
                      onClick={() => setSelectedWholesaler(wh)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                        selectedWholesaler.id === wh.id
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50'
                          : 'border-border/60 bg-card/60 hover:bg-muted/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-black text-foreground flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: wh.brandColor }}
                            />
                            {wh.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            Gewerk: <strong className="text-foreground">{wh.trade}</strong> • Kd.-Nr: {wh.customerNumber}
                          </div>
                        </div>
                        {selectedWholesaler.id === wh.id && (
                          <CheckCircle2 size={16} className="text-amber-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {wh.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Selected Wholesaler Details & Punchout Action */}
                {(() => {
                  const craftBaseUrl =
                    typeof window !== 'undefined'
                      ? window.location.origin
                      : (process.env.NEXT_PUBLIC_CRAFT_URL || 'https://vibeforce-craft-os.vercel.app').replace(/\/$/, '');
                  const craftHookUrl = `${craftBaseUrl}/api/craft/ids/hook`;
                  const punchoutUrl = generateIdsPunchoutUrl(selectedWholesaler, {
                    wholesalerId: selectedWholesaler.id,
                    hookUrl: craftHookUrl,
                    sessionId: `ids_${selectedWholesaler.id}`,
                    customerNumber: selectedWholesaler.customerNumber,
                    orderReference: projectName || 'Baustellen-Projekt',
                  });

                  return (
                    <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-1 text-xs min-w-0 flex-1">
                        <div className="font-bold text-foreground">
                          Aktives Punchout-Ziel: {selectedWholesaler.name}
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono truncate" title={craftHookUrl}>
                          Hook-URL: {craftHookUrl}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                        <a
                          href={punchoutUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-muted px-3 h-10 text-xs font-semibold text-foreground transition-colors"
                        >
                          <ExternalLink size={14} className="mr-1.5" />
                          Live-Shop
                        </a>
                        <Button
                          size="default"
                          onClick={() => {
                            setSimulatorBasket([]);
                            setIsSimulatorOpen(true);
                          }}
                          className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-5 h-10 shadow-sm flex-1 sm:flex-initial"
                        >
                          <ExternalLink size={15} className="mr-2" />
                          Großhandels-Shop öffnen (Punchout)
                        </Button>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Technical Information & Specs */}
            <Card className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Info size={15} className="text-amber-500" />
                  IDS-Connect 2.5 Spezifikation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-muted-foreground">
                <p>
                  IDS-Connect (Integriertes Daten-System) ist der offizielle Schnittstellenstandard für die digitale Kommunikation zwischen Handwerkersoftware und Fachgroßhandel.
                </p>
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Version:</span>
                    <span className="font-mono text-foreground font-bold">2.5 (IGH)</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Übertragungsformat:</span>
                    <span className="font-mono text-foreground font-bold">XML &amp; HTTPS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Punchout-Typ:</span>
                    <span className="font-mono text-foreground font-bold">B2B Webshop Hook</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Preisebene:</span>
                    <span className="font-mono text-foreground font-bold">Katalogpreis &amp; Handwerker-EK</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-medium">
                  <strong>Zero Placebo Simulator:</strong> Da Live-B2B-Großhändler geschlossene Benutzerkonten erfordern, ermöglicht der integrierte Simulator das Testen des exakten XML-Workflows auf Vercel.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* SUBTAB 3: IMPORTIERTER WARENKORB & BRÜCKE */}
      {activeSubTab === 'cart' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {importedCart && importedCart.items.length > 0 ? (
            <>
              {/* Cart Summary Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      Großhändler / Beleg
                    </div>
                    <div className="text-base font-black text-foreground truncate">
                      {importedCart.header.wholesalerName}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      Warenkorb-ID: {importedCart.header.cartId} • {importedCart.header.orderDate}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      Einkaufspreis (EK Netto)
                    </div>
                    <div className="text-xl font-black text-foreground">
                      {importedCart.totalNet.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      UVP/Katalog Brutto: {importedCart.totalGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 bg-card/60">
                  <CardContent className="p-4">
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      Kalkulierter Verkaufspreis (VK Netto)
                    </div>
                    <div className="text-xl font-black text-amber-500">
                      {(importedCart.totalNet * (1 + markupPercent / 100)).toLocaleString('de-DE', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </div>
                    <div className="text-[10px] text-emerald-400 font-semibold">
                      +{(importedCart.totalNet * (markupPercent / 100)).toFixed(2)} € Rohertrag ({markupPercent}% Aufschlag)
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bulk Action Buttons */}
              <div className="p-4 rounded-2xl bg-card border border-border/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                  <CheckCircle2 size={16} className="text-teal-400" />
                  <span>{importedCart.items.length} Positionen bereit zur Übernahme:</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleTransferCartToAufmass}
                    className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8"
                  >
                    <FileSpreadsheet size={14} className="mr-1.5" />
                    Alle ins VOB-Aufmaß übernehmen
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTransferCartToGaeb}
                    className="border-border/80 hover:bg-muted text-xs font-semibold h-8"
                  >
                    <FileCode size={14} className="mr-1.5 text-teal-400" />
                    Alle ins GAEB-LV übernehmen
                  </Button>
                </div>
              </div>

              {/* Cart Items Table */}
              <Card className="border-border/70 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-border/80 bg-muted/40 text-muted-foreground font-semibold">
                        <th className="py-3 px-4">Artikelnr.</th>
                        <th className="py-3 px-4 font-sans">Artikelbezeichnung</th>
                        <th className="py-3 px-2 text-center">Menge</th>
                        <th className="py-3 px-3 text-right">Katalogpreis</th>
                        <th className="py-3 px-3 text-right">Rabatt</th>
                        <th className="py-3 px-3 text-right">EK Netto / Stk</th>
                        <th className="py-3 px-3 text-right text-amber-500 font-bold">VK Netto / Stk</th>
                        <th className="py-3 px-3 text-right">Gesamt EK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {importedCart.items.map((it) => {
                        const salesUnitPrice =
                          Math.round(it.priceNet * (1 + markupPercent / 100) * 100) / 100;
                        return (
                          <tr key={it.id} className="hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-foreground">
                              {it.itemNumber}
                              {it.manufacturer && (
                                <div className="text-[10px] text-muted-foreground font-normal">
                                  {it.manufacturer}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 font-sans font-semibold text-foreground">
                              {it.description}
                            </td>
                            <td className="py-3 px-2 text-center font-bold">
                              {it.quantity} {it.unit}
                            </td>
                            <td className="py-3 px-3 text-right text-muted-foreground">
                              {it.priceGross.toFixed(2)} €
                            </td>
                            <td className="py-3 px-3 text-right text-emerald-500 font-semibold">
                              -{it.discountPercent || 0}%
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-foreground">
                              {it.priceNet.toFixed(2)} €
                            </td>
                            <td className="py-3 px-3 text-right text-amber-500 font-bold">
                              {salesUnitPrice.toFixed(2)} €
                            </td>
                            <td className="py-3 px-3 text-right font-black text-foreground">
                              {it.totalNet.toFixed(2)} €
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : (
            <Card className="border-border/70 p-12 text-center">
              <ShoppingBag size={36} className="mx-auto mb-3 text-muted-foreground/50 animate-bounce" />
              <h3 className="text-sm font-bold text-foreground">Kein Großhandels-Warenkorb geladen</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Öffnen Sie den IDS-Connect Punchout Simulator und stellen Sie einen Warenkorb zusammen.
              </p>
              <Button
                size="sm"
                onClick={() => setActiveSubTab('ids')}
                className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs"
              >
                Zum IDS-Connect Punchout
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* MODAL: INTERACTIVE IDS-CONNECT 2.5 PUNCHOUT SIMULATOR */}
      {isSimulatorOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div
              className="p-4 px-6 border-b border-border/80 flex items-center justify-between text-white"
              style={{ backgroundColor: selectedWholesaler.brandColor }}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white/10">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <div>
                  <div className="text-base font-black flex items-center gap-2">
                    {selectedWholesaler.name}
                    <Badge className="bg-white/20 text-white border-none text-[10px]">
                      B2B Webshop Simulator
                    </Badge>
                  </div>
                  <div className="text-[11px] text-white/80">
                    IDS-Connect 2.5 Session: {selectedWholesaler.customerNumber} • Projekt: {projectName || 'Neubau'}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsSimulatorOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors text-xs font-bold px-3"
              >
                Abbrechen ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Product Selection */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Verfügbare Großhandels-Artikel ({selectedWholesaler.mockArticles.length})
                  </h4>
                  <span className="text-[11px] text-teal-400 font-semibold">
                    Sofort ab Regionallager lieferbar
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedWholesaler.mockArticles.map((art) => {
                    const netEk = Math.round(art.priceGross * (1 - art.discountPercent / 100) * 100) / 100;
                    return (
                      <div
                        key={art.itemNumber}
                        className="p-3.5 rounded-2xl border border-border/70 bg-card/60 hover:border-amber-500/60 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {art.itemNumber}
                            </span>
                            <Badge variant="outline" className="text-[10px] py-0">
                              {art.manufacturer}
                            </Badge>
                          </div>
                          <div className="text-xs font-semibold text-foreground">
                            {art.description}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                            <span>Listenpreis: {art.priceGross.toFixed(2)} €</span>
                            <span className="text-emerald-500 font-bold">
                              Rabatt: -{art.discountPercent}%
                            </span>
                            <span className="text-foreground font-black">
                              Handwerker-EK: {netEk.toFixed(2)} €/{art.unit}
                            </span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => handleAddToSimulatorBasket(art)}
                          className="bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs h-8 px-3 shrink-0"
                        >
                          <Plus size={14} className="mr-1" />
                          Hinzufügen
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Simulated Shopping Basket */}
              <div className="space-y-4 border-l border-border/60 pl-6 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between mb-3">
                    <span>Ihr Warenkorb</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {simulatorBasket.reduce((sum, b) => sum + b.quantity, 0)} Pos.
                    </Badge>
                  </h4>

                  {simulatorBasket.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-xs">
                      <ShoppingBag size={28} className="mx-auto mb-2 text-muted-foreground/40" />
                      Warenkorb ist noch leer. Wählen Sie links Artikel aus.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      {simulatorBasket.map((b) => {
                        const netPrice =
                          Math.round(b.priceGross * (1 - b.discountPercent / 100) * 100) / 100;
                        return (
                          <div
                            key={b.itemNumber}
                            className="p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center justify-between gap-2"
                          >
                            <div className="flex-1 truncate">
                              <div className="font-bold text-foreground truncate">{b.description}</div>
                              <div className="text-[10px] text-muted-foreground font-mono">
                                {b.quantity}x {netPrice.toFixed(2)} € = {(b.quantity * netPrice).toFixed(2)} €
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSimulatorBasket((prev) =>
                                  prev.filter((x) => x.itemNumber !== b.itemNumber)
                                );
                              }}
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                            >
                              <Trash2 size={13} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Totals & Return Hook Action */}
                <div className="border-t border-border/80 pt-4 space-y-3">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">Summe Netto (EK):</span>
                    <span className="text-foreground text-sm">
                      {simulatorBasket
                        .reduce((sum, b) => {
                          const netPrice =
                            Math.round(b.priceGross * (1 - b.discountPercent / 100) * 100) / 100;
                          return sum + netPrice * b.quantity;
                        }, 0)
                        .toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </span>
                  </div>

                  <Button
                    size="default"
                    disabled={simulatorBasket.length === 0}
                    onClick={handleSimulatorCommitCart}
                    className="w-full bg-teal-500 hover:bg-teal-600 text-black font-black text-xs h-10 shadow-sm"
                  >
                    <ArrowRight size={15} className="mr-2" />
                    Warenkorb an VIBE Craft übertragen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
