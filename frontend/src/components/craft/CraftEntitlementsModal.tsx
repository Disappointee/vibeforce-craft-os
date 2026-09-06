'use client';

import React, { useState } from 'react';
import {
  Sliders,
  CheckCircle2,
  Lock,
  Zap,
  RotateCcw,
  Sparkles,
  Building2,
  Layers,
  HelpCircle,
  FileCode,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Receipt,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  CRAFT_FEATURES,
  CRAFT_TIERS,
  useCraftEntitlementsStore,
  type CraftFeatureId,
  type CraftTierId,
} from '@/lib/craft-entitlements';
import type { ProjectRecord } from '@/lib/pocketbase-types';
import { toast } from 'sonner';

interface CraftEntitlementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects?: ProjectRecord[];
  currentProjectId?: string;
}

const FEATURE_ICONS: Record<CraftFeatureId, React.ReactNode> = {
  reports: <FileText size={18} className="text-amber-500" />,
  measurements: <FileSpreadsheet size={18} className="text-amber-500" />,
  geofence: <MapPin size={18} className="text-teal-400" />,
  invoices: <Receipt size={18} className="text-emerald-400" />,
  gaeb: <FileCode size={18} className="text-amber-500" />,
  margin: <TrendingUp size={18} className="text-amber-500" />,
  wholesale: <ShoppingBag size={18} className="text-teal-400" />,
  pinning: <ShieldCheck size={18} className="text-amber-500" />,
};

export function CraftEntitlementsModal({
  isOpen,
  onClose,
  projects = [],
  currentProjectId,
}: CraftEntitlementsModalProps) {
  const {
    enabledFeatures,
    activeTier,
    projectOverrides,
    toggleFeature,
    applyTier,
    setProjectOverride,
    clearProjectOverrides,
    calculateMonthlyTotal,
    resetToDefaults,
  } = useCraftEntitlementsStore();

  const [selectedScope, setSelectedScope] = useState<string>(
    currentProjectId ? `project:${currentProjectId}` : 'global'
  );

  if (!isOpen) return null;

  const isGlobal = selectedScope === 'global';
  const targetProjectId = !isGlobal ? selectedScope.replace('project:', '') : undefined;

  const monthlyTotal = calculateMonthlyTotal(targetProjectId);

  const handleToggle = (featureId: CraftFeatureId, nextState: boolean) => {
    if (isGlobal) {
      toggleFeature(featureId, nextState);
    } else if (targetProjectId) {
      setProjectOverride(targetProjectId, featureId, nextState);
    }
  };

  const handleSelectTier = (tierId: 'starter' | 'pro' | 'enterprise') => {
    applyTier(tierId);
    toast.success(`Paket "${CRAFT_TIERS.find((t) => t.id === tierId)?.name}" aktiviert!`);
  };

  const handleResetScope = () => {
    if (isGlobal) {
      resetToDefaults();
      toast.info('Alle Module auf Standard zurückgesetzt.');
    } else if (targetProjectId) {
      clearProjectOverrides(targetProjectId);
      toast.info('Projekt-Spezifische Einstellungen entfernt (nutzt globale Konfiguration).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-border/80 flex items-center justify-between bg-card/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30">
              <Sliders size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground flex items-center gap-2">
                Handwerker-Module &amp; Lizenzen
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500">
                  Upsell Matrix
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Aktivieren oder deaktivieren Sie einzelne Funktionen flexibel pro Kunde oder Baustelle.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold px-3 transition-colors"
          >
            Schließen ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Scope Selector */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">Gültigkeitsbereich:</span>
            </div>

            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value)}
              className="h-8 px-3 text-xs bg-background border border-border rounded-xl text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="global">🌐 Global (Standard für alle Kunden &amp; Baustellen)</option>
              {projects.map((p) => (
                <option key={p.id} value={`project:${p.id}`}>
                  🏗️ Baustelle: {p.name} ({p.key})
                </option>
              ))}
            </select>
          </div>

          {/* Predefined Tier Bundles (Only for Global Scope) */}
          {isGlobal && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Empfohlene Lizenz-Pakete:
                </span>
                <span className="text-[11px] text-muted-foreground">
                  1-Klick Paketauswahl
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {CRAFT_TIERS.map((tier) => {
                  const isSelected = activeTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => handleSelectTier(tier.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between gap-2 relative ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/50'
                          : 'border-border/60 bg-card/60 hover:bg-muted/40'
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2.5 right-4 bg-teal-500 text-black text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm">
                          Beliebt
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-black text-foreground">{tier.name}</h4>
                          {isSelected && <CheckCircle2 size={16} className="text-amber-500" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {tier.tagline}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-foreground">
                          {tier.monthlyPrice > 0 ? `${tier.monthlyPrice} € / Mt.` : 'Inklusive'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {tier.includedFeatures.length} Module
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Granular Feature Switch Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Granulare Modul-Steuerung:
              </span>
              <span className="text-[11px] text-teal-400 font-semibold">
                Änderungen greifen sofort reaktiv
              </span>
            </div>

            <div className="divide-y divide-border/40 border border-border/70 rounded-2xl overflow-hidden bg-card/50">
              {(Object.keys(CRAFT_FEATURES) as CraftFeatureId[]).map((fId) => {
                const fMeta = CRAFT_FEATURES[fId];
                const isEnabled = isGlobal
                  ? enabledFeatures[fId]
                  : projectOverrides[targetProjectId || '']?.[fId] !== undefined
                  ? Boolean(projectOverrides[targetProjectId || '']?.[fId])
                  : Boolean(enabledFeatures[fId]);

                return (
                  <div
                    key={fId}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="p-2.5 rounded-xl bg-muted/60 border border-border/60 shrink-0">
                        {FEATURE_ICONS[fId]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-foreground truncate">
                            {fMeta.title}
                          </span>
                          <Badge variant="outline" className="text-[10px] py-0 border-border">
                            {fMeta.category}
                          </Badge>
                          {fMeta.monthlyPrice > 0 && (
                            <Badge variant="secondary" className="text-[10px] py-0 font-mono text-amber-500">
                              +{fMeta.monthlyPrice} €/Mt.
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {fMeta.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Switch
                        checked={Boolean(isEnabled)}
                        onCheckedChange={(checked) => handleToggle(fId, checked)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-border/80 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetScope}
              className="text-xs h-8 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={13} className="mr-1.5" />
              Zurücksetzen
            </Button>
            <span className="text-xs text-muted-foreground">
              Aktives Paket:{' '}
              <strong className="text-foreground font-mono">
                {activeTier.toUpperCase()}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-muted-foreground">
                Gesamt-Lizenzbetrag
              </div>
              <div className="text-base font-black text-amber-500 font-mono">
                {monthlyTotal.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}{' '}
                <span className="text-xs font-normal text-muted-foreground">/ Monat</span>
              </div>
            </div>

            <Button
              onClick={onClose}
              className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs px-5 h-9"
            >
              Fertig &amp; Übernehmen
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
