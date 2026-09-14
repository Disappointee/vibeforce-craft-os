'use client';

import React from 'react';
import {
  Lock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sliders,
  FileCode,
  TrendingUp,
  ShoppingBag,
  MapPin,
  Receipt,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CRAFT_FEATURES,
  useCraftEntitlementsStore,
  type CraftFeatureId,
} from '@/lib/craft-entitlements';
import { toast } from 'sonner';

interface CraftFeatureUpsellProps {
  featureId: CraftFeatureId;
  projectId?: string;
  onUnlocked?: () => void;
  onOpenLicenseManager?: () => void;
}

const FEATURE_ICONS: Record<CraftFeatureId, React.ReactNode> = {
  reports: <FileText size={24} className="text-amber-500" />,
  measurements: <FileSpreadsheet size={24} className="text-amber-500" />,
  geofence: <MapPin size={24} className="text-teal-400" />,
  invoices: <Receipt size={24} className="text-emerald-400" />,
  gaeb: <FileCode size={24} className="text-amber-500" />,
  margin: <TrendingUp size={24} className="text-amber-500" />,
  wholesale: <ShoppingBag size={24} className="text-teal-400" />,
  pinning: <ShieldCheck size={24} className="text-amber-500" />,
};

export function CraftFeatureUpsell({
  featureId,
  projectId,
  onUnlocked,
  onOpenLicenseManager,
}: CraftFeatureUpsellProps) {
  const meta = CRAFT_FEATURES[featureId];
  const { toggleFeature, setProjectOverride } = useCraftEntitlementsStore();

  const handleImmediateUnlock = () => {
    if (projectId) {
      setProjectOverride(projectId, featureId, true);
    } else {
      toggleFeature(featureId, true);
    }

    toast.success(`Add-on "${meta.shortTitle}" wurde erfolgreich aktiviert!`, {
      description: 'Die Funktion steht Ihnen ab sofort uneingeschränkt zur Verfügung.',
    });

    if (onUnlocked) {
      onUnlocked();
    }
  };

  return (
    <Card className="border-border/80 bg-card/70 backdrop-blur-md shadow-xl overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

      <CardContent className="p-8 md:p-12 space-y-8 relative">
        {/* Top Header & Lock Badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30">
              {FEATURE_ICONS[featureId]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[11px] font-mono border-amber-500/40 text-amber-500">
                  {meta.badgeText}
                </Badge>
                <Badge variant="secondary" className="text-[11px]">
                  Kategorie: {meta.category}
                </Badge>
              </div>
              <h3 className="text-xl md:text-2xl font-black text-foreground tracking-tight mt-1">
                {meta.title}
              </h3>
            </div>
          </div>

          <div className="text-right sm:self-center p-3 rounded-2xl bg-muted/40 border border-border/60">
            <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              Add-on Investition
            </div>
            <div className="text-2xl font-black text-foreground">
              {meta.monthlyPrice > 0 ? (
                <>
                  +{meta.monthlyPrice} €{' '}
                  <span className="text-xs font-normal text-muted-foreground">/ Monat</span>
                </>
              ) : (
                <span className="text-emerald-400">Inklusive</span>
              )}
            </div>
          </div>
        </div>

        {/* Value Proposition & ROI pitch */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-background to-teal-500/10 border border-amber-500/20 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Warum sich dieses Modul rentiert:</span>
          </div>
          <p className="text-sm font-semibold text-foreground leading-relaxed">
            {meta.roiPitch}
          </p>
          <p className="text-xs text-muted-foreground">
            {meta.description}
          </p>
        </div>

        {/* Highlights Checklist */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Enthaltene Profi-Leistungen:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {meta.highlights.map((hl, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-card border border-border/60 flex items-start gap-3"
              >
                <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
                <span className="text-xs font-medium text-foreground">{hl}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Jederzeit monatlich flexibel kündbar oder per Baustelle aktivierbar.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {onOpenLicenseManager && (
              <Button
                variant="outline"
                size="default"
                onClick={onOpenLicenseManager}
                className="h-10 text-xs font-bold border-border/80 hover:bg-muted w-full sm:w-auto"
              >
                <Sliders size={14} className="mr-2" />
                Lizenzen &amp; Pakete
              </Button>
            )}

            <Button
              size="default"
              onClick={handleImmediateUnlock}
              className="h-10 px-6 bg-amber-500 hover:bg-amber-600 text-black font-black text-xs shadow-md w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <Zap size={14} />
              <span>Add-on jetzt sofort aktivieren (1-Klick)</span>
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
