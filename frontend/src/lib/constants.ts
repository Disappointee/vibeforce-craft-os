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
