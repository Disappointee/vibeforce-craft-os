'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import {
  Shield,
  Users,
  Building2,
  HardHat,
  BadgeCheck,
  TrendingUp,
  FileSpreadsheet,
  Settings,
  Plus,
  ArrowRight,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Hammer
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getCraftRoleLabel, getCraftRoleBadgeClasses, CRAFT_ROLE_OPTIONS } from '@/lib/constants';
import type { UserRecord, ProjectRecord } from '@/lib/pocketbase-types';

export default function AdminOverviewPage() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [settings, setSettings] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  const currentUser = pb.authStore.record as unknown as UserRecord | null;

  useEffect(() => {
    async function loadData() {
      try {
        const [usersRes, projectsRes, settingsRes] = await Promise.all([
          pb.collection('users').getFullList<UserRecord>({ sort: '-created' }),
          pb.collection('projects').getFullList<ProjectRecord>({ sort: '-created' }),
          pb.collection('app_settings').getFullList().then(r => r[0] || null).catch(() => null),
        ]);
        setUsers(usersRes);
        setProjects(projectsRes);
        setSettings(settingsRes);
      } catch (err) {
        console.error('Error loading admin overview data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64 bg-card" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28 rounded-2xl bg-card" />
          ))}
        </div>
      </div>
    );
  }

  // Count role groups
  const meisterCount = users.filter(u => u.role === 'admin' || u.role === 'meister').length;
  const leadCount = users.filter(u => u.role === 'manager' || u.role === 'bauleiter' || u.role === 'vorarbeiter').length;
  const gesellenCount = users.filter(u => u.role === 'employee' || u.role === 'geselle' || u.role === 'monteur').length;
  const azubiCount = users.filter(u => u.role === 'azubi').length;
  const subCount = users.filter(u => u.role === 'freelancer' || u.role === 'subunternehmer').length;

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-bold text-xs uppercase tracking-wider mb-1">
            <Hammer size={14} />
            Betriebs-Leitung & Verwaltung
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            Handwerks-Betriebszentrale
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Zentrale Übersicht über Monteure, Kolonnen, Kalkulationsstundensätze, Betriebsdaten und VOB-Lizenzen.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => router.push('/admin/users?invite=true')}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
          >
            <Plus size={16} />
            Monteur anlegen
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/admin/settings')}
            className="border-border text-foreground hover:bg-muted/40 flex items-center gap-2 cursor-pointer"
          >
            <Settings size={16} />
            Einstellungen
          </Button>
        </div>
      </div>

      {/* KPI Cards: Handwerker-Belegschaft */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Meister / Inhaber</span>
              <BadgeCheck size={16} className="text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{meisterCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Betriebsleitung</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Bauleiter & Vorarb.</span>
              <HardHat size={16} className="text-blue-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{leadCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Kolonnenführung</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Gesellen & Monteure</span>
              <Users size={16} className="text-emerald-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{gesellenCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Fachmontage</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Auszubildende</span>
              <Briefcase size={16} className="text-cyan-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{azubiCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">Lehrlinge</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/40 backdrop-blur-sm col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Nachunternehmer</span>
              <Building2 size={16} className="text-purple-400" />
            </div>
            <div className="mt-2">
              <span className="text-2xl font-bold text-foreground">{subCount}</span>
              <p className="text-[11px] text-muted-foreground mt-0.5">§ 13b Subunternehmer</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Betriebs-Module & Schnellzugriff */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Card 1: Personal & Monteure Schnellzugriff */}
        <Card className="border-border/60 bg-card/40 lg:col-span-2">
          <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                <Users size={18} className="text-amber-500" />
                Aktuelle Handwerker & Mitarbeiter ({users.length})
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Rollen, Stundensätze und Zugangsstatus im Überblick
              </CardDescription>
            </div>
            <Link
              href="/admin/users"
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 transition-colors"
            >
              Alle verwalten <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <CardContent className="pt-4 space-y-3">
            <div className="divide-y divide-border/20">
              {users.slice(0, 6).map((u) => {
                const roleLabel = getCraftRoleLabel(u.role, 'craft');
                const badgeClass = getCraftRoleBadgeClasses(u.role);
                return (
                  <div key={u.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-muted/60 border border-border flex items-center justify-center font-bold text-xs shrink-0 text-foreground">
                        {u.name ? u.name.charAt(0).toUpperCase() : u.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{u.name || u.email.split('@')[0]}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${badgeClass}`}>
                        {roleLabel}
                      </span>
                      {u.hourly_rate ? (
                        <span className="text-[11px] font-mono text-muted-foreground hidden sm:inline">
                          {Number(u.hourly_rate).toFixed(2)} €/h
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-border/30 flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Insgesamt {users.length} erfasste Personen</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/team')}
                className="text-xs text-amber-400 hover:text-amber-300 p-0 h-auto cursor-pointer"
              >
                Zur Monteurs- & Kolonnenkartei →
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Handwerksbetrieb-Stammdaten & Compliance */}
        {(() => {
          const hwkRegistered = settings?.hwk_registered !== false;
          const hasHwkData = Boolean(settings?.hwk_name || settings?.hwk_number);
          const hwkLabel = hasHwkData
            ? `${settings?.hwk_name || 'HWK'} ${settings?.hwk_number ? `· Nr. ${settings.hwk_number}` : ''}`
            : 'Eingetragen in Handwerksrolle (Anlage A/B1 HwO)';

          let freistellungState: 'success' | 'warning' | 'danger' = 'success';
          let freistellungText = 'Gültig hinterlegt (0% Bauabzugsteuer)';

          if (settings) {
            if (!settings.freistellung_status || !settings.freistellung_gueltig_bis) {
              freistellungState = 'warning';
              freistellungText = 'Noch nicht hinterlegt (15% Einbehalt droht)';
            } else {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const validUntil = new Date(settings.freistellung_gueltig_bis);
              const diffDays = Math.ceil((validUntil.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
              if (diffDays < 0) {
                freistellungState = 'danger';
                freistellungText = `Seit ${Math.abs(diffDays)} Tagen abgelaufen!`;
              } else if (diffDays <= 30) {
                freistellungState = 'warning';
                freistellungText = `Läuft am ${settings.freistellung_gueltig_bis} ab (noch ${diffDays} Tage)`;
              } else {
                freistellungState = 'success';
                freistellungText = `Gültig bis ${settings.freistellung_gueltig_bis} (0% Bauabzugsteuer)`;
              }
            }
          }

          const reverseChargeActive = settings?.reverse_charge_active !== false;
          const vobDinActive = settings?.vob_din18299_active !== false;

          return (
            <Card className="border-border/60 bg-card/40 flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                      <Shield size={16} className="text-amber-500" />
                      Betriebs- & Kammer-Status
                    </CardTitle>
                    {settings?.company_name && (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30 max-w-[140px] truncate">
                        {settings.company_name}
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs mt-0.5">
                    Rechts- & Steuerstatus für Bau-Compliance
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 text-xs">
                  {/* HWK Status */}
                  <div className="flex items-start gap-2.5">
                    {hwkRegistered ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-foreground">Handwerkskammer (HWK)</span>
                      <p className="text-muted-foreground text-[11px]">{hwkLabel}</p>
                    </div>
                  </div>

                  {/* § 48b EStG Freistellung */}
                  <div className="flex items-start gap-2.5">
                    {freistellungState === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />}
                    {freistellungState === 'warning' && <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />}
                    {freistellungState === 'danger' && <AlertCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />}
                    <div>
                      <span className="font-semibold text-foreground">§ 48b EStG Freistellungsbescheinigung</span>
                      <p className={`text-[11px] ${
                        freistellungState === 'danger' ? 'text-rose-400 font-semibold' :
                        freistellungState === 'warning' ? 'text-amber-400 font-medium' :
                        'text-muted-foreground'
                      }`}>
                        {freistellungText}
                      </p>
                    </div>
                  </div>

                  {/* § 13b UStG Reverse Charge */}
                  <div className="flex items-start gap-2.5">
                    {reverseChargeActive ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-foreground">§ 13b UStG Reverse Charge Engine</span>
                      <p className="text-muted-foreground text-[11px]">
                        {reverseChargeActive ? 'Automatische Netto-Rechnungen bei Bauleistern' : 'Deaktiviert (Regelbesteuerung)'}
                      </p>
                    </div>
                  </div>

                  {/* VOB/B & DIN 18299 Aufmaß */}
                  <div className="flex items-start gap-2.5">
                    {vobDinActive ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle size={16} className="text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold text-foreground">VOB/B & DIN 18299 Aufmaß</span>
                      <p className="text-muted-foreground text-[11px]">
                        {vobDinActive ? `Konforme Formeln & ${settings?.vob_payment_term_days || 14}-Tage Zahlungsziel aktiv` : 'Individueller Abrechnungsmodus'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </div>

              <div className="p-4 border-t border-border/30 bg-muted/10 rounded-b-xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/admin/settings?tab=company')}
                  className="w-full text-xs border-border flex items-center justify-center gap-1.5 cursor-pointer hover:border-amber-500/50 hover:text-amber-400 transition-colors"
                >
                  <Settings size={14} />
                  Betriebsdaten bearbeiten
                </Button>
              </div>
            </Card>
          );
        })()}

        {/* Card 3: Standard-Kalkulationssätze */}
        <Card className="border-border/60 bg-card/40 lg:col-span-3">
          <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Clock size={16} className="text-amber-500" />
                Kalkulatorische Stundenverrechnungssätze (Deckungsbeitrags-Kalkulation)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Werden automatisch für Bautagesberichte, Regiearbeiten und Margenberechnungen herangezogen
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
              M007.2 Margen-Engine
            </Badge>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {CRAFT_ROLE_OPTIONS.filter(r => r.defaultHourlyRate > 0).slice(0, 5).map((opt) => (
                <div key={opt.value} className="bg-muted/20 border border-border/40 rounded-xl p-3 flex flex-col justify-between">
                  <span className="text-[11px] font-semibold text-muted-foreground">{opt.label}</span>
                  <div className="mt-2">
                    <span className="text-xl font-bold font-mono text-foreground">{opt.defaultHourlyRate.toFixed(2)} €</span>
                    <span className="text-[10px] text-muted-foreground"> / Std.</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/80 mt-1 line-clamp-1">{opt.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
