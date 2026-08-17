'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { useSettingsStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Mail,
  Globe,
  Save,
  Loader2,
  CheckCircle2,
  Server,
  Eye,
  EyeOff,
  Send,
  Calculator,
  AlertTriangle,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { writeAuditLog } from '@/lib/audit-log';
import type { BillingRoundingInterval, BillingRoundingMode } from '@/lib/pocketbase-types';

interface AppSettings {
  app_name: string;
  app_logo_url: string;
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_from_address: string;
  smtp_from_name: string;
  smtp_tls: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  app_name: 'Vibeforce Flow OS',
  app_logo_url: '',
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_from_address: '',
  smtp_from_name: '',
  smtp_tls: true,
};

const POCKETBASE_URL =
  process.env.NEXT_PUBLIC_POCKETBASE_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8090' : '');

export default function AdminSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('billing');

  // Zustand Settings
  const settingsStore = useSettingsStore();
  const [globalRoundingInterval, setGlobalRoundingInterval] = useState<BillingRoundingInterval>(
    settingsStore.globalRoundingInterval ?? 6
  );
  const [globalRoundingMode, setGlobalRoundingMode] = useState<BillingRoundingMode>(
    settingsStore.globalRoundingMode ?? 'ceil'
  );
  const [defaultBillable, setDefaultBillable] = useState<boolean>(
    settingsStore.defaultBillable ?? true
  );
  const [budgetWarningEnabled, setBudgetWarningEnabled] = useState<boolean>(
    settingsStore.budgetWarningEnabled ?? true
  );
  const [budgetWarningThreshold, setBudgetWarningThreshold] = useState<number>(
    settingsStore.budgetWarningThreshold ?? 80
  );
  const [maxTimerHoursContinuous, setMaxTimerHoursContinuous] = useState<number>(
    settingsStore.maxTimerHoursContinuous ?? 8
  );

  const getAuthHeaders = () => {
    const token = pb.authStore.token;
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const loadSettings = async () => {
    try {
      const res = await fetch(`${POCKETBASE_URL}/api/custom/settings`, {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...data.data,
        });
      }
    } catch (error) {
      console.warn('Error loading remote settings, using local fallback:', error);
    }
  };

  const checkAuth = async () => {
    if (!pb.authStore.isValid) {
      router.push('/login');
      return;
    }
    try {
      const record = await pb.collection('users').authRefresh();
      const userRole = record.record?.role;
      if (userRole !== 'admin') {
        toast.error('Zugriff verweigert. Nur Administratoren können diese Seite aufrufen.');
        router.push('/');
        return;
      }
      setIsAdmin(true);
      await loadSettings();
    } catch {
      pb.authStore.clear();
      router.push('/login');
      return;
    }
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Update Zustand Global Settings
      settingsStore.setGlobalRoundingInterval(globalRoundingInterval);
      settingsStore.setGlobalRoundingMode(globalRoundingMode);
      settingsStore.setDefaultBillable(defaultBillable);
      settingsStore.setBudgetWarningEnabled(budgetWarningEnabled);
      settingsStore.setBudgetWarningThreshold(budgetWarningThreshold);
      settingsStore.setMaxTimerHoursContinuous(maxTimerHoursContinuous);

      // 2. Try remote backend API
      try {
        await fetch(`${POCKETBASE_URL}/api/custom/settings`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({
            ...settings,
            global_rounding_interval: globalRoundingInterval,
            global_rounding_mode: globalRoundingMode,
            default_billable: defaultBillable,
            budget_warning_enabled: budgetWarningEnabled,
            budget_warning_threshold: budgetWarningThreshold,
            max_timer_hours: maxTimerHoursContinuous,
          }),
        });
      } catch (remoteError) {
        console.warn('Remote settings API optional fallback:', remoteError);
      }

      // 3. Write Audit Log
      await writeAuditLog({
        action: 'template.saved',
        entityType: 'system_settings',
        summary: 'System-Einstellungen und Abrechnungskonfiguration aktualisiert',
        metadata: {
          globalRoundingInterval,
          globalRoundingMode,
          defaultBillable,
          budgetWarningThreshold,
          maxTimerHoursContinuous,
        },
      });

      toast.success('Einstellungen erfolgreich gespeichert');
    } catch (error: unknown) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern der Einstellungen');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setTesting(true);
    try {
      const res = await fetch(`${POCKETBASE_URL}/api/custom/settings/test-smtp`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Test-E-Mail wird gesendet');
      } else {
        toast.error(data.message || 'SMTP-Test fehlgeschlagen');
      }
    } catch (error: unknown) {
      console.error('SMTP test error:', error);
      const message = error instanceof Error ? error.message : 'Verbindungsfehler';
      toast.error('SMTP-Test fehlgeschlagen: ' + message);
    } finally {
      setTesting(false);
    }
  };

  const updateField = (field: keyof AppSettings, value: string | number | boolean) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-muted-foreground font-medium tracking-wide">Lade Einstellungen...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Settings size={24} className="text-primary" />
              System-Einstellungen
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Globale Abrechnungslogik, Budget-Warnungen und Infrastruktur für Vibeforce Flow OS
            </p>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-card border border-border">
            <TabsTrigger
              value="billing"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Calculator size={16} />
              Abrechnung & Rundung
            </TabsTrigger>
            <TabsTrigger
              value="budget"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <AlertTriangle size={16} />
              Budget & Automatisierung
            </TabsTrigger>
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Globe size={16} />
              Allgemein
            </TabsTrigger>
            <TabsTrigger
              value="smtp"
              className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2"
            >
              <Mail size={16} />
              E-Mail (SMTP)
            </TabsTrigger>
          </TabsList>

          {/* 1. Billing & Rounding Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Calculator size={18} />
                  </div>
                  <div>
                    <CardTitle>Globale Rundungs- & Abrechnungskonfiguration</CardTitle>
                    <CardDescription>
                      Standardeinstellungen für die Berechnung abrechenbarer Minuten in Stoppuhren und Berichten
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Rounding Interval */}
                  <div className="space-y-2">
                    <Label htmlFor="rounding_interval">Standard-Rundungsintervall</Label>
                    <Select
                      value={String(globalRoundingInterval)}
                      onValueChange={(val) => setGlobalRoundingInterval(Number(val) as BillingRoundingInterval)}
                    >
                      <SelectTrigger id="rounding_interval" className="bg-background border-border">
                        <SelectValue placeholder="Intervall wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="0">0 Min (Exakt / minütlich)</SelectItem>
                        <SelectItem value="5">5 Minuten</SelectItem>
                        <SelectItem value="6">6 Minuten (0,1 Stunden — Standard)</SelectItem>
                        <SelectItem value="10">10 Minuten</SelectItem>
                        <SelectItem value="15">15 Minuten (0,25 Stunden / Viertelstunde)</SelectItem>
                        <SelectItem value="30">30 Minuten (0,5 Stunden / Halbstunde)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Wird verwendet, sofern auf Projekt- oder Kundenebene keine abweichende Rundung hinterlegt ist.
                    </p>
                  </div>

                  {/* Rounding Mode */}
                  <div className="space-y-2">
                    <Label htmlFor="rounding_mode">Aufrundungsmodus</Label>
                    <Select
                      value={globalRoundingMode}
                      onValueChange={(val) => setGlobalRoundingMode(val as BillingRoundingMode)}
                    >
                      <SelectTrigger id="rounding_mode" className="bg-background border-border">
                        <SelectValue placeholder="Modus wählen" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border text-foreground">
                        <SelectItem value="ceil">Immer aufrunden (ceil — z. B. 7 min → 12 min)</SelectItem>
                        <SelectItem value="round">Kaufmännisch runden (round — nächstgelegenes Intervall)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Bestimmt, ob angebrochene Zeitintervalle grundsätzlich aufgerundet oder kaufmännisch gerundet werden.
                    </p>
                  </div>
                </div>

                <Separator className="bg-muted" />

                {/* Default Billable */}
                <div className="flex items-center justify-between max-w-xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="default_billable" className="text-sm font-medium text-foreground">
                      Standardmäßig abrechenbar
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Neu gestartete Timer und manuelle Zeiteinträge sind standardmäßig als abrechenbar markiert.
                    </p>
                  </div>
                  <Switch
                    id="default_billable"
                    checked={defaultBillable}
                    onCheckedChange={setDefaultBillable}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Budget & Automation Settings */}
          <TabsContent value="budget" className="space-y-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <CardTitle>Budget-Warnschwellen & Schutzmechanismen</CardTitle>
                    <CardDescription>
                      Automatische Warnungen bei Budgetüberschreitungen und Geistertimer-Bereinigung
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Budget Warning Toggle */}
                <div className="flex items-center justify-between max-w-xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="budget_warning_enabled" className="text-sm font-medium text-foreground">
                      Budget-Warnungen aktivieren
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Sendet In-App Benachrichtigungen an Projektleiter, wenn das Projektbudget die Warnschwelle erreicht.
                    </p>
                  </div>
                  <Switch
                    id="budget_warning_enabled"
                    checked={budgetWarningEnabled}
                    onCheckedChange={setBudgetWarningEnabled}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                {budgetWarningEnabled && (
                  <div className="space-y-2 max-w-md">
                    <Label htmlFor="budget_threshold">Warnschwelle (%)</Label>
                    <div className="flex items-center gap-3">
                      <Input
                        id="budget_threshold"
                        type="number"
                        min={50}
                        max={100}
                        step={5}
                        value={budgetWarningThreshold}
                        onChange={(e) => setBudgetWarningThreshold(parseInt(e.target.value) || 80)}
                        className="bg-background border-border w-32"
                      />
                      <span className="text-sm text-muted-foreground">% des Projektbudgets</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Typischer Richtwert: 80 % (Frühwarnung) oder 100 % (Budgetlimit).
                    </p>
                  </div>
                )}

                <Separator className="bg-muted" />

                {/* Ghost Timer Auto-Cap */}
                <div className="space-y-2 max-w-md">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-primary" />
                    <Label htmlFor="max_timer_hours">Geistertimer-Schutz (Auto-Cap)</Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input
                      id="max_timer_hours"
                      type="number"
                      min={1}
                      max={24}
                      value={maxTimerHoursContinuous}
                      onChange={(e) => setMaxTimerHoursContinuous(parseInt(e.target.value) || 8)}
                      className="bg-background border-border w-32"
                    />
                    <span className="text-sm text-muted-foreground">Stunden maximale Laufzeit</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vergessene Stoppuhren werden nach Erreichen dieses Limits automatisch gedeckelt und in der Datenbank persistiert.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Globe size={18} />
                  </div>
                  <div>
                    <CardTitle>Allgemeine Einstellungen</CardTitle>
                    <CardDescription>Name und Branding der Anwendung</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="app_name">Anwendungsname</Label>
                  <Input
                    id="app_name"
                    value={settings.app_name}
                    onChange={(e) => updateField('app_name', e.target.value)}
                    placeholder="Vibeforce Flow OS"
                    className="bg-background border-border max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">Wird im Header und in E-Mail-Vorlagen verwendet.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="app_logo_url">Logo-URL (optional)</Label>
                  <Input
                    id="app_logo_url"
                    value={settings.app_logo_url}
                    onChange={(e) => updateField('app_logo_url', e.target.value)}
                    placeholder="/icon-vfos.png"
                    className="bg-background border-border max-w-md"
                  />
                  <p className="text-xs text-muted-foreground">URL oder Pfad zum Logo-Bild.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Server size={18} />
                  </div>
                  <div>
                    <CardTitle>System-Informationen</CardTitle>
                    <CardDescription>Backend-Verbindungsstatus</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-sm text-muted-foreground mb-1">API-Endpunkt</p>
                    <p className="text-sm font-mono text-foreground">{POCKETBASE_URL}</p>
                  </div>
                  <div className="p-4 rounded-lg bg-background border border-border">
                    <p className="text-sm text-muted-foreground mb-1">Status</p>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-sm text-emerald-400 font-medium">Verbunden</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. SMTP Settings */}
          <TabsContent value="smtp" className="space-y-6">
            <Card className="border-border bg-card/40">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Mail size={18} />
                  </div>
                  <div>
                    <CardTitle>SMTP-Konfiguration</CardTitle>
                    <CardDescription>
                      E-Mail-Versand für Benachrichtigungen und Einladungen
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Server Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_host">SMTP-Server *</Label>
                    <Input
                      id="smtp_host"
                      value={settings.smtp_host}
                      onChange={(e) => updateField('smtp_host', e.target.value)}
                      placeholder="smtp.example.com"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_port">Port *</Label>
                    <Input
                      id="smtp_port"
                      type="number"
                      value={settings.smtp_port}
                      onChange={(e) => updateField('smtp_port', parseInt(e.target.value) || 587)}
                      placeholder="587"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <Separator className="bg-muted" />

                {/* Authentication */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_username">Benutzername</Label>
                    <Input
                      id="smtp_username"
                      value={settings.smtp_username}
                      onChange={(e) => updateField('smtp_username', e.target.value)}
                      placeholder="noreply@vibeforce.de"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_password">Passwort</Label>
                    <div className="relative">
                      <Input
                        id="smtp_password"
                        type={showPassword ? 'text' : 'password'}
                        value={settings.smtp_password}
                        onChange={(e) => updateField('smtp_password', e.target.value)}
                        placeholder={settings.smtp_password === '********' ? '••••••••' : 'SMTP-Passwort'}
                        className="bg-background border-border pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <Separator className="bg-muted" />

                {/* Sender Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="smtp_from_address">Absender-E-Mail</Label>
                    <Input
                      id="smtp_from_address"
                      value={settings.smtp_from_address}
                      onChange={(e) => updateField('smtp_from_address', e.target.value)}
                      placeholder="noreply@vibeforce.de"
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="smtp_from_name">Absender-Name</Label>
                    <Input
                      id="smtp_from_name"
                      value={settings.smtp_from_name}
                      onChange={(e) => updateField('smtp_from_name', e.target.value)}
                      placeholder="Vibeforce Flow OS"
                      className="bg-background border-border"
                    />
                  </div>
                </div>

                <Separator className="bg-muted" />

                {/* TLS Toggle */}
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <Label htmlFor="smtp_tls" className="text-sm font-medium">
                      TLS-Verschlüsselung
                    </Label>
                    <p className="text-xs text-muted-foreground">SMTP-Verbindung per TLS sichern (empfohlen)</p>
                  </div>
                  <Switch
                    id="smtp_tls"
                    checked={settings.smtp_tls}
                    onCheckedChange={(checked) => updateField('smtp_tls', checked)}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>

                <Separator className="bg-muted" />

                {/* Actions */}
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleTestSmtp}
                    disabled={testing || !settings.smtp_host}
                    className="border-zinc-700 hover:bg-muted"
                  >
                    {testing ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    {testing ? 'Test läuft...' : 'SMTP testen'}
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Wird gespeichert...' : 'Einstellungen speichern'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
