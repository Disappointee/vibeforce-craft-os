/**
 * Data Isolation Utilities for Vibeforce Flow OS
 * 
 * In Flow OS (non-craft mode), all data is agency data.
 * These functions are no-op pass-throughs for Flow OS.
 * In Craft OS, these would filter out non-craft data.
 */

import type { ProjectRecord, TaskRecord, TimeEntryRecord } from '@/lib/pocketbase-types';

/**
 * Filter projects for current mode (Flow OS = all projects)
 */
export function filterProjectsByMode(projects: ProjectRecord[]): ProjectRecord[] {
  return projects;
}

/**
 * Filter tasks for current mode (Flow OS = all tasks)
 */
export function filterTasksByMode(tasks: TaskRecord[]): TaskRecord[] {
  return tasks;
}

/**
 * Filter time entries for current mode (Flow OS = all time entries)
 */
export function filterTimeEntriesByMode(timeEntries: TimeEntryRecord[]): TimeEntryRecord[] {
  return timeEntries;
}

/**
 * Check if a project is a craft project (Flow OS = always false)
 */
export function isCraftProject(project: ProjectRecord | null | undefined): boolean {
  return false;
}

/**
 * Check if a task is a craft task (Flow OS = always false)
 */
export function isCraftTask(task: TaskRecord | null | undefined): boolean {
  return false;
}

/**
 * Filter clients for current mode (Flow OS = all clients)
 */
export function filterClientsByMode(clients: any[]): any[] {
  return clients;
}