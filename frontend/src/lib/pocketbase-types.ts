// ============================================
// Union Types (reusable string literals)
// ============================================

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'acute' | 'high' | 'medium' | 'low';
export type RecurringInterval = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
export type TaskType = 'sea' | 'social_ads' | 'tracking' | 'seo' | 'content' | 'design' | 'development' | 'consulting' | 'other';

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

export type UserRole = 'admin' | 'employee' | 'freelancer' | 'client';
export type UserLanguage = 'de' | 'en';

export interface UserRecord extends BaseRecord {
    collectionName: 'users';
    email: string;
    emailVisibility: boolean;
    verified: boolean;
    name?: string;
    avatar?: string;
    role?: UserRole;
    hourly_rate?: number;
    language?: UserLanguage;
    expertise?: string[];
    weekly_hours_target?: number;
    notify_on_assignment?: boolean;
    notify_on_mention?: boolean;
    notify_on_due?: boolean;
    weekly_report?: boolean;
    favorites?: string[];
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

