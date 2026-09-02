'use client';

import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { useSettingsStore } from '@/lib/store';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sliders, LayoutGrid, BellRing, EyeOff, Save, Loader2, Hammer, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { useI18n } from '@/lib/i18n';
import type { UserPreferences, UserLanguage } from '@/lib/pocketbase-types';

export function UserPreferencesCard() {
  const settingsStore = useSettingsStore();
  const { t, language, setLanguage } = useI18n();
  const [saving, setSaving] = useState(false);
  const [selectedLang, setSelectedLang] = useState<UserLanguage>(settingsStore.language || 'de');
  const [defaultTaskView, setDefaultTaskView] = useState<'kanban' | 'list' | 'timeline'>(
    settingsStore.defaultTaskView || 'kanban'
  );
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>(
    settingsStore.uiDensity || 'comfortable'
  );
  const [emailFrequency, setEmailFrequency] = useState<'immediate' | 'hourly' | 'daily' | 'never'>(
    settingsStore.emailNotificationFrequency || 'immediate'
  );
  const [hideArchived, setHideArchived] = useState<boolean>(
    settingsStore.hideArchivedProjectTasks ?? true
  );
  const [craftEnabled, setCraftEnabled] = useState<boolean>(
    settingsStore.craftModuleEnabled ?? false
  );

  useEffect(() => {
    if (settingsStore.language) setSelectedLang(settingsStore.language);
    if (settingsStore.defaultTaskView) setDefaultTaskView(settingsStore.defaultTaskView);
    if (settingsStore.uiDensity) setUiDensity(settingsStore.uiDensity);
    if (settingsStore.emailNotificationFrequency) setEmailFrequency(settingsStore.emailNotificationFrequency);
    if (settingsStore.hideArchivedProjectTasks !== undefined) setHideArchived(settingsStore.hideArchivedProjectTasks);
    if (settingsStore.craftModuleEnabled !== undefined) setCraftEnabled(settingsStore.craftModuleEnabled);
  }, [
    settingsStore.language,
    settingsStore.defaultTaskView,
    settingsStore.uiDensity,
    settingsStore.emailNotificationFrequency,
    settingsStore.hideArchivedProjectTasks,
    settingsStore.craftModuleEnabled,
  ]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newPrefs: Partial<UserPreferences> = {
        language: selectedLang,
        defaultTaskView,
        uiDensity,
        emailNotificationFrequency: emailFrequency,
        hideArchivedProjectTasks: hideArchived,
        craftModuleEnabled: craftEnabled,
      };

      await settingsStore.saveUserPreferences(newPrefs);
      setLanguage(selectedLang);
      toast.success(selectedLang === 'en' ? 'Preferences saved successfully' : 'Präferenzen erfolgreich gespeichert');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error(selectedLang === 'en' ? 'Error saving preferences' : 'Fehler beim Speichern der Präferenzen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border bg-card/40">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sliders size={18} />
          </div>
          <div>
            <CardTitle>Persönliche Präferenzen</CardTitle>
            <CardDescription>
              Passe das Verhalten von Ansichten, Dichte und Benachrichtigungen an deinen Workflow an
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* System Language */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Globe size={15} className="text-muted-foreground" />
              <Label htmlFor="language-select">{t('profile.language')}</Label>
            </div>
            <Select
              value={selectedLang}
              onValueChange={(val) => setSelectedLang(val as UserLanguage)}
            >
              <SelectTrigger id="language-select" className="bg-background border-border">
                <SelectValue placeholder={t('profile.language')} />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="de">{t('profile.language_de')}</SelectItem>
                <SelectItem value="en">{t('profile.language_en')}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {selectedLang === 'en' ? 'Interface language and locale format' : 'Sprache der Benutzeroberfläche und Formate'}
            </p>
          </div>

          {/* Standard Task View */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <LayoutGrid size={15} className="text-muted-foreground" />
              <Label htmlFor="default-task-view">Standard-Aufgabenansicht</Label>
            </div>
            <Select
              value={defaultTaskView}
              onValueChange={(val) => setDefaultTaskView(val as 'kanban' | 'list' | 'timeline')}
            >
              <SelectTrigger id="default-task-view" className="bg-background border-border">
                <SelectValue placeholder="Ansicht wählen" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="kanban">Kanban-Board (Spaltenansicht)</SelectItem>
                <SelectItem value="list">Listenansicht (Kompakte Tabelle)</SelectItem>
                <SelectItem value="timeline">Gantt- / Zeitachsen-Ansicht</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Wird beim Öffnen der Aufgabenseite standardmäßig als Startansicht geladen.
            </p>
          </div>

          {/* Email Notification Frequency */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BellRing size={15} className="text-muted-foreground" />
              <Label htmlFor="email-frequency">E-Mail-Häufigkeit</Label>
            </div>
            <Select
              value={emailFrequency}
              onValueChange={(val) => setEmailFrequency(val as 'immediate' | 'hourly' | 'daily' | 'never')}
            >
              <SelectTrigger id="email-frequency" className="bg-background border-border">
                <SelectValue placeholder="Häufigkeit wählen" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="immediate">Sofort (bei jedem Ereignis)</SelectItem>
                <SelectItem value="hourly">Stündliche Zusammenfassung</SelectItem>
                <SelectItem value="daily">Täglicher Digest (Morgens)</SelectItem>
                <SelectItem value="never">Nie (Nur In-App Benachrichtigungen)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Steuert, wie oft du E-Mails bei Zuweisungen und Erwähnungen erhältst.
            </p>
          </div>
        </div>

        {/* UI Density */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ui-density">Layout-Dichte</Label>
            <Select
              value={uiDensity}
              onValueChange={(val) => setUiDensity(val as 'comfortable' | 'compact')}
            >
              <SelectTrigger id="ui-density" className="bg-background border-border">
                <SelectValue placeholder="Dichte wählen" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border text-foreground">
                <SelectItem value="comfortable">Komfortabel (Standard-Abstände)</SelectItem>
                <SelectItem value="compact">Kompakt (Mehr Inhalt auf einen Blick)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hide Archived Tasks Switch */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background/50 self-end">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <EyeOff size={14} className="text-muted-foreground" />
                <Label htmlFor="hide-archived" className="text-sm font-medium text-foreground cursor-pointer">
                  Archivierte Aufgaben ausblenden
                </Label>
              </div>
              <p className="text-xs text-muted-foreground">
                Aufgaben abgeschlossener Projekte standardmäßig verbergen
              </p>
            </div>
            <Switch
              id="hide-archived"
              checked={hideArchived}
              onCheckedChange={setHideArchived}
              className="data-[state=checked]:bg-indigo-500"
            />
          </div>
        </div>

        {/* Modul M007: VIBE Craft Toggle */}
        <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Hammer size={16} />
              </div>
              <Label htmlFor="craft-module-toggle" className="text-sm font-semibold text-foreground cursor-pointer">
                Modul M007: VIBE Craft (Handwerk & Baustelle)
              </Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Aktiviert GPS-Baustellen-Geofencing, VOB Teil C Aufmaße, digitale Bautagesberichte mit Vor-Ort-Signatur und ZUGFeRD E-Rechnungen in der Navigation und den Projekten.
            </p>
          </div>
          <Switch
            id="craft-module-toggle"
            checked={craftEnabled}
            onCheckedChange={setCraftEnabled}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 text-white">
            {saving ? <Loader2 size={14} className="animate-spin mr-2" /> : <Save size={14} className="mr-2" />}
            {saving ? 'Wird gespeichert...' : 'Präferenzen speichern'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
