'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { pb } from '@/lib/pocketbase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
    Clock,
    ShieldCheck,
    Hammer,
    Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CraftSettingsSection } from '@/components/craft/CraftSettingsSection';
import { CompanySettingsTab, type CompanySettingsData } from '@/components/admin/CompanySettingsTab';
import { useSettingsStore } from '@/lib/store';
import { isCraftMode } from '@/config/app-mode';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface AppSettings extends CompanySettingsData {
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
    app_name: 'Vibeforce Craft OS',
    app_logo_url: '',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    smtp_from_address: '',
    smtp_from_name: '',
    smtp_tls: true,
    company_name: '',
    company_legal_form: '',
    company_owner: '',
    company_street: '',
    company_zip: '',
    company_city: '',
    company_country: 'Deutschland',
    company_phone: '',
    company_emergency_phone: '',
    company_email: '',
    company_website: '',
    bank_name: '',
    bank_iban: '',
    bank_bic: '',
    creditor_id: '',
    hwk_name: '',
    hwk_number: '',
    hwk_trade: '',
    hwk_registered: true,
    master_qualification: '',
    tax_id: '',
    vat_id: '',
    freistellung_status: true,
    freistellung_aktenzeichen: '',
    freistellung_gueltig_bis: '',
    freistellung_issuer: '',
    reverse_charge_active: true,
    vob_din18299_active: true,
    vob_payment_term_days: 14,
};

const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || (process.env.NODE_ENV === 'development' ? 'http://127.0.0.1:8090' : 'https://pb-vibeforce.46-225-178-235.sslip.io');

export default function AdminSettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [showPassword, setShowPassword] = useState(false);
    const craftMode = isCraftMode();
    const [activeTab, setActiveTab] = useState(craftMode ? 'company' : 'general');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tab = params.get('tab');
            if (tab && ['company', 'general', 'timer', 'smtp', 'craft'].includes(tab)) {
                setActiveTab(tab);
            }
        }
    }, []);

    const {
        maxTimerHoursContinuous,
        setMaxTimerHoursContinuous,
        inactivityHeartbeatHours,
        setInactivityHeartbeatHours,
        globalRoundingInterval,
        setGlobalRoundingInterval,
        globalRoundingMode,
        setGlobalRoundingMode,
    } = useSettingsStore();

    const getAuthHeaders = () => {
        const token = pb.authStore.token;
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
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
            console.error('Error loading settings:', error);
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
            if (userRole !== 'admin' && userRole !== 'meister') {
                toast.error('Zugriff verweigert. Nur Administratoren und Meister können diese Seite aufrufen.');
                router.push('/craft');
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
            const res = await fetch(`${POCKETBASE_URL}/api/custom/settings`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(settings),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Einstellungen erfolgreich gespeichert');
            } else {
                toast.error(data.message || 'Fehler beim Speichern');
            }
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
                            {craftMode ? 'Betriebs- & System-Einstellungen' : 'System-Einstellungen'}
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {craftMode ? 'Betriebliche Stammdaten, Lizenzen und Systemeinstellungen für Vibeforce Craft OS' : 'Globale Einstellungen für Vibeforce Flow OS verwalten'}
                        </p>
                    </div>
                    <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold">
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Wird gespeichert...' : 'Speichern'}
                    </Button>
                </div>

                {/* Settings Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="bg-card border border-border">
                        {craftMode && (
                            <TabsTrigger value="company" className="data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400 gap-2 font-semibold">
                                <Building2 size={16} />
                                Betriebsdaten & Kammer
                            </TabsTrigger>
                        )}
                        <TabsTrigger value="general" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                            <Globe size={16} />
                            Allgemein
                        </TabsTrigger>
                        <TabsTrigger value="timer" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                            <Clock size={16} />
                            Zeiterfassung
                        </TabsTrigger>
                        <TabsTrigger value="smtp" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                            <Mail size={16} />
                            E-Mail (SMTP)
                        </TabsTrigger>
                        {craftMode && (
                            <TabsTrigger value="craft" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary gap-2">
                                <Hammer size={16} />
                                Craft Lizenzen
                            </TabsTrigger>
                        )}
                    </TabsList>

                    {/* Handwerksbetrieb & Kammer Settings */}
                    {craftMode && (
                        <TabsContent value="company" className="space-y-6">
                            <CompanySettingsTab
                                data={settings}
                                onChange={(field, val) => updateField(field as keyof AppSettings, val)}
                            />
                        </TabsContent>
                    )}

                    {/* General Settings */}
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
                                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
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

                    {/* Timer Settings */}
                    <TabsContent value="timer" className="space-y-6">
                        <Card className="border-border bg-card/40">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                        <Clock size={18} />
                                    </div>
                                    <div>
                                        <CardTitle>Zeiterfassung & Geistertimer-Schutz</CardTitle>
                                        <CardDescription>Automatische Obergrenzen und Inaktivitäts-Prüfungen für aktive Timer</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="max_timer_hours">Maximale Timer-Laufzeit am Stück (Stunden)</Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="max_timer_hours"
                                                type="number"
                                                min={1}
                                                max={24}
                                                value={maxTimerHoursContinuous}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 8;
                                                    setMaxTimerHoursContinuous(Math.max(1, Math.min(24, val)));
                                                }}
                                                className="bg-background border-border max-w-[140px]"
                                            />
                                            <span className="text-xs text-muted-foreground">Stunden (Standard: 8h)</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Verhindert astronomische Geisterstunden bei versehentlich vergessenen Timern. Zeiteinträge werden beim Überschreiten automatisch auf diese Höchstdauer gekappt und gespeichert.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="inactivity_heartbeat">Inaktivitäts-Heartbeat Prüfung</Label>
                                        <Select
                                            value={inactivityHeartbeatHours.toString()}
                                            onValueChange={(val) => setInactivityHeartbeatHours(parseInt(val))}
                                        >
                                            <SelectTrigger id="inactivity_heartbeat" className="bg-background border-border max-w-md">
                                                <SelectValue placeholder="Intervall wählen">
                                                    {(value: string) => ({
                                                        '0': 'Deaktiviert',
                                                        '2': 'Nach 2 Stunden',
                                                        '4': 'Nach 4 Stunden (Standard)',
                                                        '6': 'Nach 6 Stunden',
                                                        '8': 'Nach 8 Stunden',
                                                    }[value] || value)}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent className="bg-background border-border">
                                                <SelectItem value="0">Deaktiviert</SelectItem>
                                                <SelectItem value="2">Nach 2 Stunden</SelectItem>
                                                <SelectItem value="4">Nach 4 Stunden (Standard)</SelectItem>
                                                <SelectItem value="6">Nach 6 Stunden</SelectItem>
                                                <SelectItem value="8">Nach 8 Stunden</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <p className="text-xs text-muted-foreground">
                                            Blendet nach der gewählten Zeitspanne einen sanften Bestätigungs-Dialog ein (&quot;Arbeitest du noch an dieser Aufgabe?&quot;). Erfolgt 15 Minuten lang keine Reaktion, wird der Timer automatisch gestoppt.
                                        </p>
                                    </div>
                                </div>

                                <Separator className="bg-muted" />

                                {/* Global Billing Rounding Policy */}
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-semibold text-foreground">Globaler Abrechnungs- & Rundungstakt</h3>
                                        <p className="text-xs text-muted-foreground">
                                            Legt fest, wie abrechenbare Arbeitszeiten für Kundenrechnungen standardmäßig gerundet werden. Einzelne Kunden können bei Bedarf abweichende Takte erhalten. Die reale HR-Arbeitszeit bleibt stets exakt erhalten.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <div className="space-y-2">
                                            <Label htmlFor="global_rounding_interval">Standard-Abrechnungstakt</Label>
                                            <Select
                                                value={globalRoundingInterval.toString()}
                                                onValueChange={(val) => {
                                                    setGlobalRoundingInterval(parseInt(val) as any);
                                                    toast.success('Globaler Abrechnungstakt aktualisiert');
                                                }}
                                            >
                                                <SelectTrigger id="global_rounding_interval" className="bg-background border-border">
                                                    <SelectValue placeholder="Takt wählen">
                                                        {(value: string) => ({
                                                            '0': 'Exakt (1 Minute - Minutengenau)',
                                                            '5': '5-Minuten-Takt (Micro-Tasks)',
                                                            '6': '6-Minuten-Takt (0,1h Dezimal-Standard)',
                                                            '10': '10-Minuten-Takt (Support / Tickets)',
                                                            '15': '15-Minuten-Takt (0,25h Viertelstunde)',
                                                            '30': '30-Minuten-Takt (0,5h Halbstunde)',
                                                        }[value] || value)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border">
                                                    <SelectItem value="0">Exakt (1 Minute - Minutengenau)</SelectItem>
                                                    <SelectItem value="5">5-Minuten-Takt (Micro-Tasks)</SelectItem>
                                                    <SelectItem value="6">6-Minuten-Takt (0,1h Dezimal-Standard)</SelectItem>
                                                    <SelectItem value="10">10-Minuten-Takt (Support / Tickets)</SelectItem>
                                                    <SelectItem value="15">15-Minuten-Takt (0,25h Viertelstunde)</SelectItem>
                                                    <SelectItem value="30">30-Minuten-Takt (0,5h Halbstunde)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Tipp: Der 6-Minuten-Takt entspricht exakt 0,1 Stunden und erleichtert die Honorarabrechnung nach Dezimalstunden.
                                            </p>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="global_rounding_mode">Rundungsmethode</Label>
                                            <Select
                                                value={globalRoundingMode}
                                                onValueChange={(val) => {
                                                    setGlobalRoundingMode(val as any);
                                                    toast.success('Rundungsmethode aktualisiert');
                                                }}
                                            >
                                                <SelectTrigger id="global_rounding_mode" className="bg-background border-border">
                                                    <SelectValue placeholder="Methode wählen">
                                                        {(value: string) => ({
                                                            'ceil': 'Immer aufrunden (Agentur-Standard)',
                                                            'round': 'Kaufmännisch runden (Nächste Schwelle)',
                                                        }[value] || value)}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="bg-background border-border">
                                                    <SelectItem value="ceil">Immer aufrunden (Agentur-Standard)</SelectItem>
                                                    <SelectItem value="round">Kaufmännisch runden (Nächste Schwelle)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Bei &quot;Immer aufrunden&quot; zählt jedes angefangene Intervall voll. Bei &quot;Kaufmännisch&quot; wird zur nächsten Schwelle gerundet.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-muted" />

                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/15 flex items-start gap-3">
                                    <ShieldCheck size={18} className="text-primary mt-0.5 shrink-0" />
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-foreground">Dual-Duration Sicherheitsarchitektur aktiv</p>
                                        <p className="text-xs text-muted-foreground">
                                            Vibeforce Flow OS trennt reale HR-Arbeitszeiten strikt von vertraglichen Abrechnungszeiten. Arbeitszeitkonten bleiben 100% wahrheitsgemäß und rechtssicher, während Kundenrechnungen exakt nach Vertragstakt berechnet werden.
                                        </p>
                                    </div>
                                </div>

                                <Separator className="bg-muted" />

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        onClick={async () => {
                                            setSaving(true);
                                            try {
                                                await handleSave();
                                                toast.success('Zeiterfassungs- & Rundungseinstellungen erfolgreich gespeichert und angewendet!');
                                            } catch {
                                                toast.error('Fehler beim Speichern der Einstellungen');
                                            } finally {
                                                setSaving(false);
                                            }
                                        }}
                                        disabled={saving}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin mr-2" /> : <Save size={16} className="mr-2" />}
                                        {saving ? 'Wird gespeichert...' : 'Zeiterfassungs-Einstellungen speichern'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SMTP Settings */}
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
                                            placeholder="noreply@vibeforce-flow.de"
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
                                            placeholder="noreply@vibeforce-flow.de"
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
                                        <Label htmlFor="smtp_tls" className="text-sm font-medium">TLS-Verschlüsselung</Label>
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
                                        {testing ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Send size={16} />
                                        )}
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

                                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                    <p className="text-sm text-amber-400 font-medium mb-1">Hinweis</p>
                                    <p className="text-xs text-muted-foreground">
                                        Nach dem Speichern der SMTP-Einstellungen werden E-Mail-Benachrichtigungen
                                        automatisch versendet, sobald neue Benachrichtigungen erstellt werden.
                                        Du kannst die Konfiguration mit einem Test-E-Mail überprüfen,
                                        das an deine aktuelle E-Mail-Adresse ({pb.authStore.record?.email}) gesendet wird.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Craft Module & License Management */}
                    {craftMode && (
                        <TabsContent value="craft" className="space-y-6">
                            <CraftSettingsSection />
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </div>
    );
}
