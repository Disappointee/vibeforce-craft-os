/**
 * Strongly Typed PocketBase DTOs & Expands
 * Eliminates 'as any' casts across the application.
 */

export interface BaseRecord {
  id: string;
  created: string;
  updated: string;
}

export type TypedRecord<T, E = {}> = T & BaseRecord & {
  expand?: E;
};

export interface UserRecord {
  name: string;
  first_name?: string;
  last_name?: string;
  email: string;
  avatar?: string;
  role?: 'admin' | 'manager' | 'user';
  deactivated?: boolean;
  expertise?: string;
}

export interface ClientRecord {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  betreuer?: string[];
  beobachter?: string[];
}

export interface ProjectRecord {
  name: string;
  key: string;
  status: 'active' | 'completed' | 'archived';
  client?: string;
  budget_hours?: number;
  start_date?: string;
  due_date?: string;
}

export interface TaskRecord {
  title: string;
  description?: string;
  project: string;
  status?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assignees?: string[];
  due_date?: string;
  start_date?: string;
  estimated_hours?: number;
  parent_task?: string;
  is_recurring?: boolean;
}

export interface TimeEntryRecord {
  task: string;
  user: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  description?: string;
  is_billable?: boolean;
}

// --- Typed Expands ---
export type ExpandedClient = TypedRecord<ClientRecord, {
  betreuer?: TypedRecord<UserRecord>[];
  beobachter?: TypedRecord<UserRecord>[];
}>;

export type ExpandedProject = TypedRecord<ProjectRecord, {
  client?: ExpandedClient;
}>;

export type ExpandedTask = TypedRecord<TaskRecord, {
  project?: ExpandedProject;
  assignees?: TypedRecord<UserRecord>[];
  parent_task?: ExpandedTask;
}>;

export type ExpandedTimeEntry = TypedRecord<TimeEntryRecord, {
  task?: ExpandedTask;
  user?: TypedRecord<UserRecord>;
}>;
