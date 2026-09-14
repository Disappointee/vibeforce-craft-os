'use client';

import React, { useState, useEffect } from 'react';
import {
  Hammer,
  CheckCircle2,
  Lock,
  Zap,
  RotateCcw,
  Sparkles,
  Building2,
  Layers,
  FileCode,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Receipt,
  FileText,
  FileSpreadsheet,
  ShieldCheck,
  Check,
  Info,
  Save,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import {
  CRAFT_FEATURES,
  CRAFT_TIERS,
  useCraftEntitlementsStore,
  type CraftFeatureId,
  type CraftTierId,
} from '@/lib/craft-entitlements';
import { pb } from '@/lib/pocketbase';
import type { ProjectRecord } from '@/lib/pocketbase-types';
import { toast } from 'sonner';

const FEATURE_ICONS: Record<CraftFeatureId, React.ReactNode> = {
  reports: <FileText size={20} className="text-amber-500" />,
  measurements: <FileSpreadsheet size={20} className="text-amber-500" />,
  geofence: <MapPin size={20} className="text-teal-400" />,
  invoices: <Receipt size={20} className="text-emerald-400" />,
  gaeb: <FileCode size={20} className="text-amber-500" />,
  margin: <TrendingUp size={20} className="text-amber-500" />,
  wholesale: <ShoppingBag size={20} className="text-teal-400" />,
  pinning: <ShieldCheck size={20} className="text-amber-500" />,
};

export function CraftSettingsSection() {
  const {
    enabledFeatures,
    activeTier,
    projectOverrides,
    isSyncing,
    toggleFeature,
    applyTier,
    setProjectOverride,
    clearProjectOverrides,
    calculateMonthlyTotal,
    resetToDefaults,
    fetchServerEntitlements,
    saveServerEntitlements,
  } = useCraftEntitlementsStore();

  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [selectedScope, setSelectedScope] = useState<string>('global');
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  useEffect(() => {
    fetchServerEntitlements();
  }, [fetchServerEntitlements]);

  useEffect(() => {
    async function fetchProjects() {
      try {
        if (pb.authStore.isValid) {
          const records = await pb.collection('projects').getFullList<ProjectRecord>({
            sort: '-created',
            requestKey: null,
          });
          setProjects(records);
        }
      } catch (err) {
        console.warn('Failed to load projects for entitlements scope:', err);
      } finally {
        setIsLoadingProjects(false);
      }
    }
    fetchProjects();
  }, []);

  const isGlobal = selectedScope === 'global';
  const targetProjectId = !isGlobal ? selectedScope.replace('project:', '') : undefined;
  const currentProject = targetProjectId ? projects.find((p) => p.id === targetProjectId) : null;

  const monthlyTotal = calculateMonthlyTotal(targetProjectId);

  const handleToggle = (featureId: CraftFeatureId, nextState: boolean) => {
    if (isGlobal) {
      toggleFeature(featureId, nextState);
    } else if (targetProjectId) {
      setProjectOverride(targetProjectId, featureId, nextState);
    }
    toast.success(
      `${CRAFT_FEATURES[featureId].shortTitle} ${nextState ? 'aktiviert' : 'deaktiviert'}`
    );
  };

  const handleSelectTier = (tierId: 'starter' | 'pro' | 'enterprise') => {
    applyTier(tierId);
    toast.success(`Paket "${CRAFT_TIERS.find((t) => t.id === tierId)?.name}" aktiviert!`);
  };

  const handleResetScope = () => {
    if (isGlobal) {
      resetToDefaults();
      toast.info('Globale Handwerker-Lizenzen auf Standard zurückgesetzt.');
    } else if (targetProjectId) {
      clearProjectOverrides(targetProjectId);
      toast.info(`Projekt-Lizenzen für "${currentProject?.name || targetProjectId}" zurückgesetzt.`);
    }
  };

  const handleSaveToServer = async () => {
    const ok = await saveServerEntitlements(selectedScope);
    if (ok) {
      toast.success(
        isGlobal
          ? 'Globale Handwerker-Lizenz erfolgreich in PocketBase synchronisiert!'
          : `Projekt-Lizenz für "${currentProject?.name || targetProjectId}" in PocketBase gespeichert!`
      );
    } else {
      toast.error('Fehler beim Speichern in PocketBase. Bitte Admin-Rechte prüfen.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card/40 backdrop-blur-md">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Hammer size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <CardTitle className="text-xl">VIBE Craft (M007) — Lizenz- & Modulverwaltung</CardTitle>
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10">
                    Upsell-Ready
                  </Badge>
                </div>
                <CardDescription className="mt-1">
                  Verkaufen Sie Baustellen- und Handwerkerfunktionen modular als Upsell oder schalten Sie Funktionen individuell pro Mandant frei.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetScope}
                className="border-zinc-700 hover:bg-zinc-800 text-zinc-300 gap-1.5 text-xs"
              >
                <RotateCcw size={14} />
                {isGlobal ? 'Standard wiederherstellen' : 'Projekt-Overrides löschen'}
              </Button>
              <Button
                size="sm"
                disabled={isSyncing}
                onClick={handleSaveToServer}
                className="bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-1.5 text-xs shadow-md"
              >
                {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                {isSyncing ? 'Speichere in PB...' : 'In PocketBase sichern'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Scope Selector: Global vs. Specific Project */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <span className="text-sm font-semibold text-zinc-200">Geltungsbereich (Scope):</span>
              </div>
              <span className="text-xs text-zinc-400">
                {isGlobal ? 'Gilt als Standard für alle Mandanten ohne Spezialvertrag' : `Individuelle Lizenzierung für ${currentProject?.name || 'Ausgewähltes Projekt'}`}
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={isGlobal ? 'default' : 'outline'}
                onClick={() => setSelectedScope('global')}
                className={`text-xs gap-1.5 ${
                  isGlobal
                    ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                    : 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300'
                }`}
              >
                <Building2 size={14} />
                Globaler Standard (Alle Kunden)
              </Button>

              {projects.map((proj) => {
                const hasCustomOverrides =
                  projectOverrides[proj.id] &&
                  Object.keys(projectOverrides[proj.id] || {}).length > 0;
                const isSelected = selectedScope === `project:${proj.id}`;

                return (
                  <Button
                    key={proj.id}
                    size="sm"
                    variant={isSelected ? 'default' : 'outline'}
                    onClick={() => setSelectedScope(`project:${proj.id}`)}
                    className={`text-xs gap-1.5 ${
                      isSelected
                        ? 'bg-amber-500 hover:bg-amber-600 text-black font-semibold shadow-md'
                        : hasCustomOverrides
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20'
                        : 'border-zinc-700 bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300'
                    }`}
                  >
                    <span>{proj.name}</span>
                    {hasCustomOverrides && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Preset Tier Bundles */}
          {isGlobal && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-400" />
                  Kommerzielle Lizenzpakete (1-Klick Bundle-Auswahl)
                </h3>
                {activeTier === 'custom' && (
                  <Badge variant="outline" className="border-amber-500/40 text-amber-400 bg-amber-500/10 text-xs">
                    Individuelle Modul-Zusammenstellung (Custom)
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {CRAFT_TIERS.map((tier) => {
                  const isCurrent = activeTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => handleSelectTier(tier.id)}
                      className={`relative cursor-pointer rounded-xl p-4 border transition-all duration-200 flex flex-col justify-between ${
                        isCurrent
                          ? 'border-amber-500/80 bg-gradient-to-b from-amber-500/10 to-amber-500/5 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/50'
                          : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/80'
                      }`}
                    >
                      {tier.popular && (
                        <div className="absolute -top-2.5 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow">
                          Bestseller
                        </div>
                      )}
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-sm text-zinc-100">{tier.name}</h4>
                          {isCurrent && <CheckCircle2 size={16} className="text-amber-400" />}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 min-h-[32px]">{tier.tagline}</p>
                        <div className="mt-3 flex items-baseline gap-1">
                          <span className="text-2xl font-black text-white">
                            {tier.monthlyPrice === 0 ? '0 €' : `${tier.monthlyPrice} €`}
                          </span>
                          <span className="text-xs text-zinc-400">/ Monat netto</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-zinc-300 space-y-1">
                        <span className="font-medium text-zinc-400">Enthält {tier.includedFeatures.length} Module:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {tier.includedFeatures.map((fid) => (
                            <span
                              key={fid}
                              className="px-1.5 py-0.5 bg-zinc-800/90 text-zinc-300 rounded border border-zinc-700/60"
                            >
                              {CRAFT_FEATURES[fid]?.shortTitle}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Granular Module Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                <Zap size={16} className="text-teal-400" />
                Granulare Modul-Schalter (Individuelles Upsell & Feature-Gating)
              </h3>
              <div className="text-xs text-zinc-400 flex items-center gap-1.5">
                <Info size={14} />
                Jedes Modul kann jederzeit nahtlos ein- oder ausgeschaltet werden.
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(Object.keys(CRAFT_FEATURES) as CraftFeatureId[]).map((featureId) => {
                const meta = CRAFT_FEATURES[featureId];
                const isOverridden = !isGlobal && targetProjectId && projectOverrides[targetProjectId]?.[featureId] !== undefined;
                const isEnabled = isGlobal
                  ? enabledFeatures[featureId] ?? false
                  : (targetProjectId && projectOverrides[targetProjectId]?.[featureId] !== undefined)
                  ? (projectOverrides[targetProjectId]![featureId] ?? false)
                  : enabledFeatures[featureId] ?? false;

                return (
                  <div
                    key={featureId}
                    className={`p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-3 ${
                      isEnabled
                        ? 'border-zinc-700/80 bg-zinc-900/60'
                        : 'border-zinc-800/60 bg-zinc-950/40 opacity-75'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 shrink-0 mt-0.5">
                        {FEATURE_ICONS[featureId]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-zinc-100 truncate">
                            {meta.title}
                          </h4>
                          {isOverridden && (
                            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] px-1.5 py-0">
                              Mandanten-Override
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-1 line-clamp-2">
                          {meta.description}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="border-zinc-700 text-zinc-300 text-[10px]">
                            {meta.category}
                          </Badge>
                          <span className="font-semibold text-zinc-300">
                            {meta.monthlyPrice === 0 ? 'Kostenlos im Core' : `+${meta.monthlyPrice} € / Mt.`}
                          </span>
                          <span className="text-zinc-500">·</span>
                          <span className="text-zinc-400 italic text-[11px] truncate">
                            {meta.roiPitch}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pt-1">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => handleToggle(featureId, checked)}
                        className="data-[state=checked]:bg-amber-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pricing Summary Box */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="text-xs uppercase tracking-wider text-zinc-400 font-bold">
                {isGlobal ? 'Globale Lizenzsumme (Standard-Katalogpreis)' : `Berechnete Lizenzsumme für "${currentProject?.name || 'Projekt'}"`}
              </div>
              <div className="text-sm text-zinc-300">
                Basierend auf den aktuell aktivierten Modulen und Tiers.
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-3xl font-black text-amber-400">{monthlyTotal} €</span>
                <span className="text-xs text-zinc-400 block">zzgl. MwSt. / Monat</span>
              </div>
              <Button
                size="default"
                disabled={isSyncing}
                onClick={handleSaveToServer}
                className="bg-amber-500 hover:bg-amber-600 text-black font-bold gap-2 shadow-lg"
              >
                {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSyncing ? 'Speichere...' : 'In PocketBase sichern'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
