'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  Upload,
  Download,
  FileCode,
  Layers,
  ChevronDown,
  ChevronRight,
  Calculator,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  type GaebBoQ,
  type GaebItem,
  type GaebCategory,
  parseGaebXml,
  parseGaeb90Bytes,
  detectGaebFormat,
  generateGaebX84Xml,
  convertGaebItemToMeasurement,
  getSampleGaebBoQ,
} from '@/lib/gaeb';
import type { MeasurementRowItem } from '@/components/craft/MeasurementGrid';

interface GaebManagerProps {
  projectName?: string;
  onTransferToAufmass?: (items: MeasurementRowItem[]) => void;
}

export function GaebManager({ projectName = 'Aktuelles Bauprojekt', onTransferToAufmass }: GaebManagerProps) {
  const [boq, setBoq] = useState<GaebBoQ | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-expand all categories when a new BOQ is loaded
  const expandAll = (categories: GaebCategory[]) => {
    const map: Record<string, boolean> = {};
    const traverse = (cats: GaebCategory[]) => {
      for (const c of cats) {
        map[c.id] = true;
        if (c.subcategories.length > 0) {
          traverse(c.subcategories);
        }
      }
    };
    traverse(categories);
    setExpandedCategories(map);
  };

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle file reading (Dualer Parser: GAEB DA XML vs. GAEB 90 Byte-Decoder)
  const processFileBuffer = (buffer: ArrayBuffer, filename: string) => {
    try {
      const bytes = new Uint8Array(buffer);
      // UTF-8-Probe für Formaterkennung (erste 8 KB reichen)
      let textProbe = '';
      try {
        textProbe = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, 8192));
      } catch {
        textProbe = '';
      }

      const format = detectGaebFormat(textProbe);
      const isD83Extension = /\.(d8[0-9]|d83|d84|d86)$/i.test(filename);
      let parsed: GaebBoQ;

      if (format === 'GAEB_XML') {
        const fullText = new TextDecoder('utf-8').decode(bytes);
        parsed = parseGaebXml(fullText);
      } else if (format === 'GAEB_90' || isD83Extension) {
        // Verlustfreier Byte-Pfad: DOS CP437/CP850 Dekodierung ohne U+FFFD-Verstümmelung
        parsed = parseGaeb90Bytes(bytes);
      } else {
        // Fallback: XML-Prüfung per Heuristik
        if (textProbe.includes('<') && textProbe.includes('>')) {
          const fullText = new TextDecoder('utf-8').decode(bytes);
          parsed = parseGaebXml(fullText);
        } else {
          parsed = parseGaeb90Bytes(bytes);
        }
      }

      if (projectName && parsed.projectName === 'Unbenanntes Bauprojekt') {
        parsed.projectName = projectName;
      }
      setBoq(parsed);
      expandAll(parsed.categories);
      const formatBadge = format === 'GAEB_90' || isD83Extension ? 'GAEB 90' : 'GAEB XML';
      toast.success(`GAEB-Leistungsverzeichnis geladen (${formatBadge})`, {
        description: `${parsed.allItems.length} Positionen in ${parsed.categories.length} Gewerken aus "${filename}" eingelesen.`,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Die Datei entspricht weder dem GAEB DA XML noch dem GAEB 90 Standard.';
      console.error('Fehler beim GAEB-Import:', err);
      toast.error('Fehler beim GAEB-Import', {
        description: message,
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processFileBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        processFileBuffer(buffer, file.name);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const loadSample = () => {
    const sample = getSampleGaebBoQ();
    setBoq(sample);
    expandAll(sample.categories);
    toast.info('Muster-Leistungsverzeichnis geladen', {
      description: 'Gewerke Rohbau & Ausbau mit 4 bepreisten Positionen zum Testen bereit.',
    });
  };

  // Recalculate BOQ when an item's unit price changes
  const handleUnitPriceChange = (itemId: string, newUnitPrice: number) => {
    if (!boq) return;

    const safeUnitPrice = isNaN(newUnitPrice) || newUnitPrice < 0 ? 0 : newUnitPrice;

    function updateCategory(cat: GaebCategory): GaebCategory {
      const updatedItems = cat.items.map((it) => {
        if (it.id === itemId) {
          const tot = Math.round(it.qty * safeUnitPrice * 100) / 100;
          return { ...it, unitPrice: safeUnitPrice, totalPrice: tot };
        }
        return it;
      });

      const updatedSubcats = cat.subcategories.map(updateCategory);

      const itemsTotal = updatedItems.reduce((sum, it) => sum + it.totalPrice, 0);
      const subcatsTotal = updatedSubcats.reduce((sum, sc) => sum + sc.totalPrice, 0);
      const categoryTotal = Math.round((itemsTotal + subcatsTotal) * 100) / 100;

      return {
        ...cat,
        items: updatedItems,
        subcategories: updatedSubcats,
        totalPrice: categoryTotal,
      };
    }

    const updatedCategories = boq.categories.map(updateCategory);
    const updatedAllItems = boq.allItems.map((it) => {
      if (it.id === itemId) {
        const tot = Math.round(it.qty * safeUnitPrice * 100) / 100;
        return { ...it, unitPrice: safeUnitPrice, totalPrice: tot };
      }
      return it;
    });

    const netTotal = Math.round(updatedAllItems.reduce((sum, it) => sum + it.totalPrice, 0) * 100) / 100;
    const taxAmount = Math.round(netTotal * boq.taxRate * 100) / 100;
    const grossTotal = Math.round((netTotal + taxAmount) * 100) / 100;

    setBoq({
      ...boq,
      dp: '84', // Automatisch auf Angebotsabgabe (X84) schalten
      categories: updatedCategories,
      allItems: updatedAllItems,
      netTotal,
      taxAmount,
      grossTotal,
    });
  };

  // Export X84 XML file
  const handleExportX84 = () => {
    if (!boq) return;

    try {
      const xmlString = generateGaebX84Xml(boq);
      const blob = new Blob([xmlString], { type: 'application/xml;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeProject = (boq.projectName || 'Ausschreibung').replace(/[^a-zA-Z0-9_\-]/g, '_');
      link.href = url;
      link.download = `${safeProject}_Angebotsabgabe.x84`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('GAEB X84 Datei erfolgreich exportiert', {
        description: 'Die Datei kann direkt an den Architekten oder in AVA-Programme (Orca, Nevaris, etc.) importiert werden.',
      });
    } catch (err: any) {
      console.error('Fehler beim X84-Export:', err);
      toast.error('Fehler beim Export der X84-Datei', {
        description: err.message || 'Export fehlgeschlagen.',
      });
    }
  };

  // Transfer items to VOB Aufmaß
  const handleTransferToAufmass = () => {
    if (!boq || boq.allItems.length === 0) return;

    const measurementItems = boq.allItems.map((it) => {
      const m = convertGaebItemToMeasurement(it);
      return {
        ...m,
        tax_rate_type: 'standard_19' as const,
      };
    });

    if (onTransferToAufmass) {
      onTransferToAufmass(measurementItems);
      toast.success('Positionen ins VOB-Aufmaß übertragen', {
        description: `${measurementItems.length} Positionen wurden erfolgreich mit der Aufmaßtabelle synchronisiert.`,
      });
    } else {
      toast.info('Aufmaß-Synchronisation bereit', {
        description: `${measurementItems.length} Positionen stehen zur Aufmaßübernahme bereit.`,
      });
    }
  };

  // Filter items by search term
  const filteredItemsCount = useMemo(() => {
    if (!boq || !searchTerm.trim()) return boq?.allItems.length || 0;
    const lower = searchTerm.toLowerCase();
    return boq.allItems.filter(
      (it) =>
        it.oz.toLowerCase().includes(lower) ||
        it.shortText.toLowerCase().includes(lower) ||
        (it.longText && it.longText.toLowerCase().includes(lower))
    ).length;
  }, [boq, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".x83,.d83,.xml,.x84,.p84"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Top Header Card */}
      <Card className="border-border/60 shadow-sm bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-teal-500/10 text-teal-600 dark:text-teal-400 rounded-xl">
                <FileCode size={22} />
              </div>
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  GAEB-Engine
                  <Badge variant="outline" className="text-xs bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20">
                    XML &amp; GAEB 90 (.d83)
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Ausschreibungen (.x83 / .d83) importieren, bepreisen, ins VOB-Aufmaß übernehmen und als Angebot abgeben
                </CardDescription>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-medium"
            >
              <Upload size={14} />
              GAEB (.x83 / .d83) laden
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSample}
              className="gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <Sparkles size={14} className="text-amber-500" />
              Muster-LV
            </Button>
            {boq && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTransferToAufmass}
                  className="gap-1.5 text-xs font-medium border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10"
                >
                  <FileSpreadsheet size={14} />
                  Ins Aufmaß ({boq.allItems.length})
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportX84}
                  className="gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                >
                  <Download size={14} />
                  X84 Angebot exportieren
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {boq && (
          <CardContent className="pt-2 border-t border-border/40">
            {/* KPI Overview Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
              <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Projekt / LV
                </span>
                <span className="text-sm font-bold truncate block text-foreground" title={boq.projectName}>
                  {boq.projectName}
                </span>
                <span className="text-[10px] text-muted-foreground">{boq.projectLabel || 'GAEB DA XML 3.2'}</span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Datenphase
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Badge
                    variant="outline"
                    className={`text-xs font-bold ${
                      boq.dp === '84'
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}
                  >
                    {boq.dp === '84' ? 'X84 Angebotsabgabe' : 'X83 Aufforderung'}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">({boq.allItems.length} Pos.)</span>
                </div>
              </div>

              <div className="p-3 bg-teal-500/5 rounded-xl border border-teal-500/20">
                <span className="text-[11px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                  Netto-Angebot
                </span>
                <span className="text-base font-bold text-teal-700 dark:text-teal-300">
                  {boq.netTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  + {boq.taxAmount.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € MwSt (19%)
                </span>
              </div>

              <div className="p-3 bg-muted/30 rounded-xl border border-border/40">
                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                  Brutto-Gesamtsumme
                </span>
                <span className="text-base font-bold text-foreground">
                  {boq.grossTotal.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  VOB/A formell prüfbar
                </span>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* No BOQ Loaded: Drag & Drop Dropzone */}
      {!boq && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-teal-500 bg-teal-500/5 scale-[1.005]'
              : 'border-border/70 hover:border-teal-500/60 hover:bg-card/40'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Upload size={28} />
            </div>
            <h3 className="text-base font-semibold">GAEB-Datei hier ablegen oder klicken</h3>
            <p className="text-xs text-muted-foreground">
              Unterstützt GAEB DA XML 3.2 & 3.3 Dateien (.x83, .d83, .xml, .p84).
              <br />
              Automatische Extraktion aller Gewerke, Ordnungszahlen (OZ), Langtexte und Mengengerüste.
            </p>
            <div className="pt-2 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  loadSample();
                }}
                className="text-xs gap-1.5"
              >
                <Sparkles size={14} className="text-amber-500" />
                Muster-Ausschreibung laden (Demo)
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BOQ Loaded: Search & Hierarchical Kalkulationsbaum */}
      {boq && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Positionen durchsuchen (z.B. 01.01, Estrich, Trockenbau)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9 bg-card/60"
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{filteredItemsCount} von {boq.allItems.length} Positionen</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setBoq(null)}
                className="h-8 text-xs text-muted-foreground hover:text-destructive"
              >
                LV schließen
              </Button>
            </div>
          </div>

          {/* Categories Accordion */}
          <div className="space-y-3">
            {boq.categories.map((category) => (
              <CategoryAccordionItem
                key={category.id}
                category={category}
                isExpanded={Boolean(expandedCategories[category.id])}
                onToggle={() => toggleCategory(category.id)}
                searchTerm={searchTerm}
                onUnitPriceChange={handleUnitPriceChange}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// Subkomponente: Kategorie-Akkordeon & Tabelle
// ============================================

interface CategoryAccordionItemProps {
  category: GaebCategory;
  isExpanded: boolean;
  onToggle: () => void;
  searchTerm: string;
  onUnitPriceChange: (itemId: string, unitPrice: number) => void;
}

function CategoryAccordionItem({
  category,
  isExpanded,
  onToggle,
  searchTerm,
  onUnitPriceChange,
}: CategoryAccordionItemProps) {
  // Check if this category or any subcategory matches search
  const lowerSearch = searchTerm.toLowerCase();

  const matchingItems = category.items.filter((it) => {
    if (!searchTerm) return true;
    return (
      it.oz.toLowerCase().includes(lowerSearch) ||
      it.shortText.toLowerCase().includes(lowerSearch) ||
      (it.longText && it.longText.toLowerCase().includes(lowerSearch))
    );
  });

  const hasMatchingItems = matchingItems.length > 0;
  const hasSubcategories = category.subcategories.length > 0;

  if (searchTerm && !hasMatchingItems && !hasSubcategories) {
    return null;
  }

  return (
    <Card className="border-border/60 shadow-none overflow-hidden bg-card/40">
      {/* Category Header */}
      <div
        onClick={onToggle}
        className="px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2.5">
          <button type="button" className="text-muted-foreground">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
          <span className="font-semibold text-sm text-foreground">
            Gewerk {category.rNoPart}: {category.label}
          </span>
          <Badge variant="outline" className="text-[10px] font-normal px-2 py-0">
            {category.items.length} Pos.
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-foreground">
            {category.totalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </span>
        </div>
      </div>

      {/* Expanded Content: Subcategories or Items Table */}
      {isExpanded && (
        <div className="divide-y divide-border/40">
          {/* Subcategories (recursive) */}
          {category.subcategories.map((sub) => (
            <div key={sub.id} className="pl-4">
              <CategoryAccordionItem
                category={sub}
                isExpanded={true}
                onToggle={() => {}}
                searchTerm={searchTerm}
                onUnitPriceChange={onUnitPriceChange}
              />
            </div>
          ))}

          {/* Items Table */}
          {matchingItems.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-medium text-[11px]">
                    <th className="py-2.5 px-4 w-28">OZ</th>
                    <th className="py-2.5 px-3">Leistungsbeschreibung (Kurz- & Langtext)</th>
                    <th className="py-2.5 px-3 w-24 text-right">Menge</th>
                    <th className="py-2.5 px-3 w-16 text-center">Einheit</th>
                    <th className="py-2.5 px-3 w-32 text-right">Einheitspreis (EP)</th>
                    <th className="py-2.5 px-4 w-32 text-right">Gesamt (GP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {matchingItems.map((item) => (
                    <ItemTableRow
                      key={item.id}
                      item={item}
                      onUnitPriceChange={(val) => onUnitPriceChange(item.id, val)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

// ============================================
// Subkomponente: Einzelne Tabellenzeile
// ============================================

interface ItemTableRowProps {
  item: GaebItem;
  onUnitPriceChange: (val: number) => void;
}

function ItemTableRow({ item, onUnitPriceChange }: ItemTableRowProps) {
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [localEp, setLocalEp] = useState<string>(item.unitPrice ? item.unitPrice.toString() : '');

  const handleBlur = () => {
    const parsed = parseFloat(localEp.replace(',', '.'));
    const safe = isNaN(parsed) ? 0 : parsed;
    onUnitPriceChange(safe);
  };

  return (
    <>
      <tr className="hover:bg-muted/30 transition-colors group">
        <td className="py-2.5 px-4 font-mono font-medium text-teal-600 dark:text-teal-400 text-xs">
          {item.oz}
        </td>

        <td className="py-2.5 px-3">
          <div className="flex items-start justify-between gap-2">
            <span className="font-medium text-foreground">{item.shortText}</span>
            {item.longText && (
              <button
                type="button"
                onClick={() => setShowDetails(!showDetails)}
                className="text-[10px] text-muted-foreground hover:text-teal-500 whitespace-nowrap underline shrink-0 mt-0.5"
              >
                {showDetails ? 'Weniger' : 'Details'}
              </button>
            )}
          </div>
        </td>

        <td className="py-2.5 px-3 text-right font-mono text-foreground font-medium">
          {item.qty.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 3 })}
        </td>

        <td className="py-2.5 px-3 text-center">
          <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
            {item.qu}
          </Badge>
        </td>

        <td className="py-2.5 px-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Input
              type="text"
              value={localEp}
              onChange={(e) => setLocalEp(e.target.value)}
              onBlur={handleBlur}
              placeholder="0,00"
              className="h-7 text-xs text-right font-mono w-24 px-2 py-1 bg-card/80 border-border/80 focus-visible:ring-1 focus-visible:ring-teal-500"
            />
            <span className="text-[11px] text-muted-foreground">€</span>
          </div>
        </td>

        <td className="py-2.5 px-4 text-right font-mono font-semibold text-foreground">
          {item.totalPrice > 0
            ? `${item.totalPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
            : <span className="text-muted-foreground font-normal text-[11px]">0,00 €</span>}
        </td>
      </tr>

      {/* Expandable LongText Row */}
      {showDetails && item.longText && (
        <tr className="bg-muted/10 border-b border-border/30">
          <td></td>
          <td colSpan={5} className="py-2 px-3 text-[11px] text-muted-foreground leading-relaxed">
            <div className="p-2.5 rounded-lg bg-card/40 border border-border/40 space-y-1">
              <span className="font-semibold text-[10px] uppercase tracking-wider text-muted-foreground block">
                Langtext / Spezifikation
              </span>
              <p className="whitespace-pre-line text-foreground/80">{item.longText}</p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
