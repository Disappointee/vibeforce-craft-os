// ============================================
// Union Types (reusable string literals)
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | string;
export type TaskPriority = 'acute' | 'high' | 'medium' | 'low';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type TaskType = 'sea' | 'social_ads' | 'tracking' | 'seo' | 'content' | 'design' | 'development' | 'consulting' | 'other' | string;

// ============================================
// PocketBase Record Base
// ============================================

export interface BaseRecord {
    id: string;
    created: string;
    updated: string;
    collectionId: string;
    collectionName: string;
}

// ============================================
// User (PocketBase auth record)
// ============================================

export type UserRole = 'admin' | 'employee' | 'freelancer' | 'client' | 'manager';
export type UserLanguage = 'de' | 'en';

export type BillingRoundingInterval = 0 | 5 | 6 | 10 | 15 | 30; // 0 = Exakt / 1 Min
export type BillingRoundingMode = 'ceil' | 'round'; // Immer aufrunden vs. Kaufmännisch

export interface UserPreferences {
    defaultTaskView?: 'kanban' | 'list' | 'timeline';
    timeRoundingMinutes?: number;
    defaultBillable?: boolean;
    emailNotificationFrequency?: 'immediate' | 'hourly' | 'daily' | 'never';
    uiDensity?: 'comfortable' | 'compact';
    hideArchivedProjectTasks?: boolean;
    craftModuleEnabled?: boolean;
    language?: UserLanguage;
}

export interface UserRecord extends BaseRecord {
    collectionName: 'users';
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    name?: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    role?: UserRole;
    supervisor?: string; // ID des festen Admins/Teamleads
    hourly_rate?: number;
    language?: UserLanguage;
    expertise?: string[];
    weekly_hours_target?: number;
    max_continuous_timer_hours?: number;
    notify_on_assignment?: boolean;
    notify_on_mention?: boolean;
    notify_on_due?: boolean;
    weekly_report?: boolean;
    deactivated?: boolean;
    favorites?: string[];
    preferences?: UserPreferences;
    expand?: {
        supervisor?: UserRecord;
    };
}

// ============================================
// Project
// ============================================

export interface ProjectRecord extends BaseRecord {
    collectionName: 'projects';
    name: string;
    key: string;
    description?: string;
    status?: string;
    budget_hours?: number;
    budget_money?: number;
    budget_fixed?: number;
    budget_type?: 'fixed' | 'hourly' | 'retainer';
    external_costs_total?: number;
    members?: string[];
    client?: string;
    start_date?: string;
    due_date?: string;
    billing_rounding?: BillingRoundingInterval | 'inherit';
    rounding_mode?: BillingRoundingMode | 'inherit';
    geofence_type?: 'none' | 'circle' | 'polygon';
    geofence_data?: { center?: [number, number]; radius?: number; polygon?: Array<[number, number]> };
    geofence_auto_prompt?: boolean;
    expand?: {
        members?: UserRecord[];
        client?: ClientRecord;
    };
}

// ============================================
// ChecklistItem
// ============================================

export interface ChecklistItemRecord extends BaseRecord {
    collectionName: 'checklist_items';
    task: string;
    title: string;
    completed: boolean;
    sort_order: number;
}

// ============================================
// Task
// ============================================

export interface TaskRecord extends BaseRecord {
    collectionName: 'tasks';
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    type?: TaskType;
    project: string;
    assignees: string[];
    parent_task?: string;
    start_date?: string;
    due_date?: string;
    estimated_hours?: number;
    is_recurring?: boolean;
    recurring_interval?: RecurringInterval;
    recurring_custom_days?: number;
    recurring_end_date?: string;
    recurring_next_date?: string;
    expand?: {
        project?: ProjectRecord;
        assignees?: UserRecord[];
        parent_task?: TaskRecord;
        checklist_items?: ChecklistItemRecord[];
    };
}

// ============================================
// TimeEntry
// ============================================

export interface TimeEntryRecord extends BaseRecord {
    collectionName: 'time_entries';
    task: string;
    user: string;
    duration: number;
    description?: string;
    date?: string;
    start_time?: string;
    end_time?: string;
    duration_minutes?: number;
    billable_minutes?: number;
    is_billable?: boolean;
    is_billed?: boolean;
    billing_reference?: string;
    expand?: {
        task?: TaskRecord;
        user?: UserRecord;
    };
}

// ============================================
// Client
// ============================================

export type KundenStatus = 'noch_nicht_gestartet' | 'aktiv' | 'beendet';

export interface ClientRecord extends BaseRecord {
    collectionName: 'clients';
    name: string;
    company?: string;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
    status: 'active' | 'inactive';
    // Extended fields (Phase B)
    auftragsvolumen?: number;
    stundenhonorar?: number;
    stundenzahl_monatlich?: number;
    stundenzahl_gesamt?: number;
    laufzeit_start?: string;
    laufzeit_ende?: string;
    abrechenbar?: boolean;
    kundenstatus?: KundenStatus;
    billing_rounding?: BillingRoundingInterval;
    rounding_mode?: BillingRoundingMode;
    betreuer?: string[];
    beobachter?: string[];
    expand?: {
        betreuer?: UserRecord[];
        beobachter?: UserRecord[];
    };
}

// ============================================
// Notification
// ============================================

export type NotificationType = 'task_assigned' | 'task_due' | 'task_comment' | 'task_mention' | 'status_change' | 'project_update';

export interface NotificationRecord extends BaseRecord {
    collectionName: 'notifications';
    user: string;
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    link?: string;
    email_sent?: boolean;
}

// ============================================
// TaskComment
// ============================================

export interface TaskCommentRecord extends BaseRecord {
    collectionName: 'task_comments';
    task: string;
    author: string;
    content: string;
    mentions?: string[];
    expand?: {
        author?: UserRecord;
    };
}

// ============================================
// TaskLink
// ============================================

export type TaskLinkType = 'depends_on' | 'blocks' | 'relates_to' | 'duplicate_of';

export interface TaskLinkRecord extends BaseRecord {
    collectionName: 'task_links';
    source_task: string;
    target_task: string;
    link_type: TaskLinkType;
    expand?: {
        source_task?: TaskRecord;
        target_task?: TaskRecord;
    };
}

// ============================================
// TaskFile
// ============================================

export interface TaskFileRecord extends BaseRecord {
    collectionName: 'task_files';
    task: string;
    file: string;
    name?: string;
    size?: number;
    expand?: {
        task?: TaskRecord;
    };
}

// ============================================
// ReportTemplate
// ============================================

export interface ExternalExpenseRecord extends BaseRecord {
    collectionName: 'external_expenses';
    project: string;
    amount: number;
    description?: string;
    category?: string;
    expand?: {
        project?: ProjectRecord;
    };
}

export interface ReportTemplateConfig {
    dateFrom?: string;
    dateTo?: string;
    projectIds?: string[];
    userIds?: string[];
    clientIds?: string[];
    billableFilter?: 'all' | 'billable' | 'non_billable' | 'ready_to_invoice';
    groupBy: 'project' | 'user' | 'both';
}

export interface ReportTemplateRecord extends BaseRecord {
    collectionName: 'report_templates';
    name: string;
    user: string;
    config?: ReportTemplateConfig;
}

// ============================================
// TimeEntryReport
// ============================================

export interface TimeEntryReportRecord extends BaseRecord {
    collectionName: 'time_entry_reports';
    time_entry: string;
    file: string;
    title?: string;
    size?: number;
}

// ============================================
// Teams
// ============================================

export interface TeamRecord extends BaseRecord {
    collectionName: 'teams';
    name: string;
    description?: string;
    lead?: string;
    expand?: {
        lead?: UserRecord;
    };
}

export interface TeamMemberRecord extends BaseRecord {
    collectionName: 'team_members';
    team: string;
    user: string;
    role?: 'lead' | 'member';
    expand?: {
        team?: TeamRecord;
        user?: UserRecord;
    };
}

// ============================================
// List/Get Response Wrappers
// ============================================

export interface ListResult<T> {
    page: number;
    perPage: number;
    totalItems: number;
    totalPages: number;
    items: T[];
}

// ============================================
// VIBE Craft Records (M007)
// ============================================

export type SiteReportStatus = 'draft' | 'signed' | 'invoiced';
export type MeasurementUnit = 'm' | 'm2' | 'm3' | 'h' | 'stk' | 'kg' | 'psch';
export type QualificationLevel = 'meister' | 'geselle' | 'helfer' | 'azubi';

export interface SiteReportRecord extends BaseRecord {
    collectionName: 'site_reports';
    project: string;
    author: string;
    report_date: string;
    status: SiteReportStatus;
    weather?: string;
    temperature?: number;
    work_performed?: string;
    special_events?: string;
    qualification_hours?: Record<QualificationLevel, number>;
    client_signature?: string;
    client_name?: string;
    client_signed_at?: string;
    contractor_signature?: string;
    contractor_signed_at?: string;
    expand?: {
        project?: ProjectRecord;
        author?: UserRecord;
        measurements?: MeasurementRecord[];
        evidence_items?: EvidenceItemRecord[];
    };
}

export interface MeasurementRecord extends BaseRecord {
    collectionName: 'measurements';
    site_report: string;
    position_nr: string;
    title: string;
    formula?: string; // e.g. "2.50 * 4.20 * 0.15"
    quantity: number;
    unit: MeasurementUnit;
    unit_price?: number;
    total_price?: number;
    notes?: string;
    expand?: {
        site_report?: SiteReportRecord;
    };
}

export interface EvidenceItemRecord extends BaseRecord {
    collectionName: 'evidence_items';
    site_report: string;
    image: string;
    caption?: string;
    sha256_hash?: string;
    taken_at?: string;
    gps_lat?: number;
    gps_lon?: number;
    expand?: {
        site_report?: SiteReportRecord;
    };
}

export interface InvoiceZugferdRecord extends BaseRecord {
    collectionName: 'invoices_zugferd';
    site_report?: string;
    project: string;
    invoice_number: string;
    invoice_type?: 'abschlag' | 'schluss' | 'standard';
    net_total: number;
    tax_rate: number;
    tax_total: number;
    gross_total: number;
    zugferd_xml: string;
    pdf_file?: string;
    datev_exported?: boolean;
    datev_export_date?: string;
    expand?: {
        site_report?: SiteReportRecord;
        project?: ProjectRecord;
    };
}


