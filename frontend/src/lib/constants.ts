// ─────────────────────────────────────────────
// Zentrale Konstanten — Single Source of Truth
// Jedes Select im Projekt muss diese Arrays nutzen.
// Labels kommen aus i18n.ts via t()-Lookup.
// ─────────────────────────────────────────────

export const TASK_STATUSES = ['todo', 'in_progress', 'review', 'done'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['low', 'medium', 'high', 'acute'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TASK_TYPES = ['sea', 'social_ads', 'tracking', 'seo', 'content', 'design', 'development', 'consulting', 'other'] as const;
export type TaskType = (typeof TASK_TYPES)[number];

export const PROJECT_BUDGET_TYPES = ['fixed', 'hourly', 'retainer'] as const;
export type ProjectBudgetType = (typeof PROJECT_BUDGET_TYPES)[number];

export const PROJECT_STATUSES = ['active', 'completed', 'archived'] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const CLIENT_STATUSES = ['noch_nicht_gestartet', 'aktiv', 'beendet'] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const USER_ROLES = ['admin', 'manager', 'employee', 'freelancer', 'client'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CRAFT_ROLES = [
  'admin',          // Meister / Betriebsinhaber
  'meister',        // Handwerksmeister
  'manager',        // Bauleiter (Legacy)
  'bauleiter',      // Bauleiter / Projektleiter
  'vorarbeiter',    // Vorarbeiter / Obermonteur
  'employee',       // Facharbeiter / Geselle (Legacy)
  'geselle',        // Facharbeiter / Geselle
  'monteur',        // Monteur
  'azubi',          // Auszubildender (Azubi)
  'helfer',         // Bauhelfer / Montagehelfer
  'freelancer',     // Nachunternehmer (Legacy)
  'subunternehmer', // Nachunternehmer / Fremdfirma
  'buero',          // Büro / Kaufmännische Verwaltung
  'client',         // Bauherr / Auftraggeber (Legacy)
  'auftraggeber',   // Bauherr / Auftraggeber
] as const;
export type CraftRole = (typeof CRAFT_ROLES)[number];

export interface CraftRoleOption {
  value: CraftRole;
  label: string;
  category: 'leitung' | 'baustelle' | 'nachunternehmer' | 'verwaltung' | 'kunde';
  description: string;
  defaultHourlyRate: number;
}

export const CRAFT_ROLE_OPTIONS: CraftRoleOption[] = [
  {
    value: 'admin',
    label: 'Meister / Betriebsinhaber',
    category: 'leitung',
    description: 'Vollzugriff, Firmenstammdaten, Lohnsätze, ZUGFeRD, Mitarbeiterverwaltung',
    defaultHourlyRate: 82.5,
  },
  {
    value: 'bauleiter',
    label: 'Bauleiter / Projektleiter',
    category: 'leitung',
    description: 'Baustellen-Koordination, Abnahmen, Bautagesberichte freigeben, VOB-Mängel',
    defaultHourlyRate: 74.0,
  },
  {
    value: 'vorarbeiter',
    label: 'Vorarbeiter / Obermonteur',
    category: 'baustelle',
    description: 'Führt die Montagekolonne vor Ort, unterschreibt/erstellt Bautagesberichte',
    defaultHourlyRate: 74.0,
  },
  {
    value: 'geselle',
    label: 'Facharbeiter / Geselle',
    category: 'baustelle',
    description: 'Gelernter Handwerker, Stempeluhr, GPS-Checkin, Fotodokumentation',
    defaultHourlyRate: 64.0,
  },
  {
    value: 'monteur',
    label: 'Monteur',
    category: 'baustelle',
    description: 'Vor-Ort-Montage, Stempeluhr, Materiallogistik',
    defaultHourlyRate: 52.0,
  },
  {
    value: 'azubi',
    label: 'Auszubildender (Azubi)',
    category: 'baustelle',
    description: 'Lehrling im Betrieb, Stempeluhr, Ausbildungs-Stundensatz',
    defaultHourlyRate: 38.0,
  },
  {
    value: 'helfer',
    label: 'Bauhelfer / Montagehelfer',
    category: 'baustelle',
    description: 'Zuarbeiten, Baustellenreinigung, Materialannahme',
    defaultHourlyRate: 42.0,
  },
  {
    value: 'subunternehmer',
    label: 'Nachunternehmer / Fremdfirma',
    category: 'nachunternehmer',
    description: 'Fremdleister gem. § 13b UStG Bauleistungen & § 48b EStG Freistellung',
    defaultHourlyRate: 65.0,
  },
  {
    value: 'buero',
    label: 'Büro / Verwaltung',
    category: 'verwaltung',
    description: 'Kaufmännische Sachbearbeitung, DATEV, Kundenkontakt, Zeiterfassungskontrolle',
    defaultHourlyRate: 55.0,
  },
  {
    value: 'client',
    label: 'Bauherr / Auftraggeber',
    category: 'kunde',
    description: 'Bauherren-Zugang für Baustellen-Freigaben, Abnahmen und Bautagebuch',
    defaultHourlyRate: 0.0,
  },
];

export const CRAFT_TRADES = [
  { value: 'elektro', label: 'Elektrotechnik & Automation' },
  { value: 'shk', label: 'Sanitär, Heizung, Klima (SHK)' },
  { value: 'trockenbau', label: 'Trockenbau & Akustik' },
  { value: 'maler', label: 'Maler & Lackierer' },
  { value: 'fliesen', label: 'Fliesen-, Platten- & Mosaikleger' },
  { value: 'dach', label: 'Dachdecker & Spengler' },
  { value: 'zimmerer', label: 'Zimmerer & Holzbau' },
  { value: 'maurer', label: 'Maurer & Betonbau' },
  { value: 'metallbau', label: 'Metallbau & Schlosserei' },
  { value: 'schreiner', label: 'Schreiner & Tischler' },
  { value: 'brandschutz', label: 'Brandschutz & Isolierung' },
  { value: 'montage', label: 'Allgemeine Montage' },
] as const;

export type CraftTrade = (typeof CRAFT_TRADES)[number]['value'];

export const RECURRING_INTERVALS = ['daily', 'weekly', 'monthly', 'yearly', 'custom'] as const;
export type RecurringInterval = (typeof RECURRING_INTERVALS)[number];

export const TASK_LINK_TYPES = ['blocks', 'blocked_by', 'relates_to', 'duplicates'] as const;
export type TaskLinkType = (typeof TASK_LINK_TYPES)[number];

export const BILLABLE_FILTERS = ['all', 'billable', 'non_billable', 'ready_to_invoice'] as const;
export type BillableFilter = (typeof BILLABLE_FILTERS)[number];

export const GROUP_BY_OPTIONS = ['project', 'user', 'both'] as const;
export type GroupByOption = (typeof GROUP_BY_OPTIONS)[number];

export const REPORT_TABS = ['hours', 'billing'] as const;
export type ReportTab = (typeof REPORT_TABS)[number];

export const VIEW_MODES = ['list', 'board'] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

export const NOTIFICATION_TYPES = ['task_assigned', 'task_completed', 'comment_added', 'deadline_reminder', 'mention'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ── VIBE Craft (M007) Enums ──

export const QUALIFICATION_LEVELS = ['meister', 'geselle', 'helfer', 'azubi'] as const;
export type QualificationLevel = (typeof QUALIFICATION_LEVELS)[number];

export const MEASUREMENT_UNITS = ['m', 'm2', 'm3', 'h', 'stk', 'kg', 'psch'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

export const SITE_REPORT_STATUSES = ['draft', 'signed', 'invoiced'] as const;
export type SiteReportStatus = (typeof SITE_REPORT_STATUSES)[number];

export const GEOFENCE_TYPES = ['none', 'circle', 'polygon'] as const;
export type GeofenceType = (typeof GEOFENCE_TYPES)[number];

// ── Label-Maps (nutzen i18n-Keys aus i18n.ts) ──

import { t } from './i18n';
import type { TranslationKey } from './i18n';

export const TASK_STATUS_LABEL_MAP: Record<TaskStatus, TranslationKey> = {
  todo: 'task.status.todo',
  in_progress: 'task.status.in_progress',
  review: 'task.status.review',
  done: 'task.status.done',
};

export const TASK_PRIORITY_LABEL_MAP: Record<TaskPriority, TranslationKey> = {
  low: 'task.priority.low',
  medium: 'task.priority.medium',
  high: 'task.priority.high',
  acute: 'task.priority.acute',
};

export const PROJECT_BUDGET_TYPE_LABEL_MAP: Record<ProjectBudgetType, TranslationKey> = {
  fixed: 'project.budget_type.fixed',
  hourly: 'project.budget_type.hourly',
  retainer: 'project.budget_type.retainer',
};

export const CLIENT_STATUS_LABEL_MAP: Record<ClientStatus, TranslationKey> = {
  noch_nicht_gestartet: 'client.status.noch_nicht_gestartet',
  aktiv: 'client.status.aktiv',
  beendet: 'client.status.beendet',
};

export const USER_ROLE_LABEL_MAP: Record<UserRole, TranslationKey> = {
  admin: 'role.admin',
  manager: 'role.manager',
  employee: 'role.employee',
  freelancer: 'role.freelancer',
  client: 'role.client',
};

// ── VIBE Craft (M007) Label-Maps ──

export const QUALIFICATION_LEVEL_LABEL_MAP: Record<QualificationLevel, TranslationKey> = {
  meister: 'craft.site_report.hours_meister',
  geselle: 'craft.site_report.hours_geselle',
  helfer: 'craft.site_report.hours_helfer',
  azubi: 'craft.site_report.hours_azubi',
};

export const MEASUREMENT_UNIT_LABEL_MAP: Record<MeasurementUnit, TranslationKey> = {
  m: 'craft.measurement.unit_m',
  m2: 'craft.measurement.unit_m2',
  m3: 'craft.measurement.unit_m3',
  h: 'craft.measurement.unit_h',
  stk: 'craft.measurement.unit_stk',
  kg: 'craft.measurement.unit_kg',
  psch: 'craft.measurement.unit_psch',
};

export const SITE_REPORT_STATUS_LABEL_MAP: Record<SiteReportStatus, TranslationKey> = {
  draft: 'craft.site_report.status_draft',
  signed: 'craft.site_report.status_signed',
  invoiced: 'craft.site_report.status_invoiced',
};

export const GEOFENCE_TYPE_LABEL_MAP: Record<GeofenceType, TranslationKey> = {
  none: 'craft.geofence.type_none',
  circle: 'craft.geofence.type_circle',
  polygon: 'craft.geofence.type_polygon',
};

// ── Hilfsfunktion: Wert → Deutsches Label ──
export function labelFor<T extends string>(map: Record<T, TranslationKey>, value: T): string {
  return t(map[value]);
}

// ── Übersetzungstabelle (für Audit: welche Strings fehlen?) ──
export const ALL_LABEL_MAPS = {
  taskStatus: TASK_STATUS_LABEL_MAP,
  taskPriority: TASK_PRIORITY_LABEL_MAP,
  projectBudgetType: PROJECT_BUDGET_TYPE_LABEL_MAP,
  clientStatus: CLIENT_STATUS_LABEL_MAP,
  userRole: USER_ROLE_LABEL_MAP,
  qualificationLevel: QUALIFICATION_LEVEL_LABEL_MAP,
  measurementUnit: MEASUREMENT_UNIT_LABEL_MAP,
  siteReportStatus: SITE_REPORT_STATUS_LABEL_MAP,
  geofenceType: GEOFENCE_TYPE_LABEL_MAP,
} as const;

export const PRIORITY_LABELS: Record<string, string> = {
  low: t('task.priority.low'),
  medium: t('task.priority.medium'),
  high: t('task.priority.high'),
  acute: t('task.priority.acute'),
};

export const TASK_TYPE_LABELS: Record<string, string> = {
  sea: 'SEA',
  social_ads: 'Social Ads',
  tracking: 'Tracking',
  seo: 'SEO',
  content: 'Content',
  design: 'Design',
  development: 'Entwicklung',
  consulting: 'Beratung',
  other: 'Sonstiges',
};

export const CRAFT_ROLE_LABELS: Record<string, string> = {
  admin: 'Meister / Inhaber',
  meister: 'Handwerksmeister',
  manager: 'Bauleiter / Projektleiter',
  bauleiter: 'Bauleiter / Projektleiter',
  vorarbeiter: 'Vorarbeiter / Obermonteur',
  employee: 'Facharbeiter / Geselle',
  geselle: 'Facharbeiter / Geselle',
  monteur: 'Monteur',
  azubi: 'Auszubildender (Azubi)',
  helfer: 'Bauhelfer / Montagehelfer',
  freelancer: 'Nachunternehmer / Subunternehmer',
  subunternehmer: 'Nachunternehmer / Subunternehmer',
  buero: 'Büro & Verwaltung',
  client: 'Bauherr / Auftraggeber',
  auftraggeber: 'Bauherr / Auftraggeber',
};

export function getCraftRoleLabel(role?: string, mode: 'craft' | 'agency' = 'craft'): string {
  if (!role) return '—';
  if (mode === 'craft') {
    return CRAFT_ROLE_LABELS[role] || role;
  }
  return USER_ROLE_LABEL_MAP[role as UserRole] ? t(USER_ROLE_LABEL_MAP[role as UserRole]) : role;
}

export function getCraftRoleBadgeClasses(role?: string): string {
  switch (role) {
    case 'admin':
    case 'meister':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'manager':
    case 'bauleiter':
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    case 'vorarbeiter':
      return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
    case 'employee':
    case 'geselle':
    case 'monteur':
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    case 'azubi':
      return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25';
    case 'helfer':
      return 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30';
    case 'freelancer':
    case 'subunternehmer':
      return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    case 'buero':
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    case 'client':
    case 'auftraggeber':
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    default:
      return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  }
}

