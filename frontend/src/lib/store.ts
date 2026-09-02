import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { pb } from './pocketbase';
import { calculateBillableMinutes } from './billing-calculator';
import type { BillingRoundingInterval, BillingRoundingMode, UserPreferences, UserLanguage } from './pocketbase-types';

interface TimerState {
  runningTaskId: string | null;
  startTime: string | null; // ISO string
  taskTitle: string | null;
  description: string;
  isPaused: boolean;
  pauseStartTime: string | null;
  totalPausedSeconds: number;
  selectedTaskId: string;
  isBillable: boolean;
  runningTimeEntryId: string | null;
  timerMode: 'bar' | 'header';
  startTimer: (taskId: string, title: string, description?: string, customStartTime?: string) => Promise<void>;
  stopTimer: () => void;
  stopAndSaveTimer: () => Promise<void>;
  saveRunningNote: () => Promise<void>;
  setDescription: (description: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  setSelectedTaskId: (taskId: string) => void;
  setBillable: (isBillable: boolean) => void;
  setTimerMode: (mode: 'bar' | 'header') => void;
  syncTimerFromDB: () => Promise<void>;
}

let _getTimerState: (() => TimerState) | null = null;
let _storageListenerAdded = false;

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => {
      _getTimerState = get;
      return {
        runningTaskId: null,
        startTime: null,
        taskTitle: null,
        description: '',
        isPaused: false,
        pauseStartTime: null,
        totalPausedSeconds: 0,
        selectedTaskId: '',
        isBillable: true,
        runningTimeEntryId: null,
        timerMode: 'header',
        startTimer: async (taskId, title, description = '', customStartTime) => {
          const state = get();

          // Stoppe und speichere laufenden Timer
          if (state.runningTaskId) {
            try {
              await get().stopAndSaveTimer();
            } catch (e) {
              console.error('Failed to stop previous timer:', e);
              // Nicht fortfahren - alter Timer muss erst gespeichert werden
              return;
            }
          }

          // Fetch billable default for this task (check client override first, fallback to user preference)
          let isBillableDefault = useSettingsStore.getState().defaultBillable ?? true;
          try {
            const task = await pb.collection('tasks').getOne(taskId, {
              expand: 'project.client',
            });
            const client = (task as any).expand?.project?.expand?.client;
            if (client && typeof client.abrechenbar === 'boolean') {
              isBillableDefault = client.abrechenbar;
            }
          } catch (e) {
            console.error("Failed to fetch billable default for task:", e);
          }

          const startTimeISO = customStartTime || new Date().toISOString();

          // Create time_entry record immediately on start
          const record = await pb.collection('time_entries').create({
            task: taskId,
            user: pb.authStore.record?.id,
            start_time: startTimeISO,
            description: description || undefined,
            is_billable: isBillableDefault,
          }).catch((e: unknown) => {
            console.error('Failed to create time entry:', e);
            // Store NICHT setzen - kein Phantom-Timer
            throw e;
          });

          set({
            runningTaskId: taskId,
            startTime: startTimeISO,
            taskTitle: title,
            description,
            selectedTaskId: taskId,
            isPaused: false,
            pauseStartTime: null,
            totalPausedSeconds: 0,
            isBillable: isBillableDefault,
            runningTimeEntryId: record.id,
          });
        },
        stopTimer: () => set({
          runningTaskId: null,
          startTime: null,
          taskTitle: null,
          description: '',
          isPaused: false,
          pauseStartTime: null,
          totalPausedSeconds: 0,
          selectedTaskId: '',
          isBillable: true,
          runningTimeEntryId: null,
        }),
        stopAndSaveTimer: async () => {
          const state = get();
          if (!state.runningTaskId || !state.startTime) return;

          const endTime = new Date().toISOString();
          let effectivePausedSeconds = state.totalPausedSeconds;
          if (state.isPaused && state.pauseStartTime) {
            const ongoingPauseMs = new Date(endTime).getTime() - new Date(state.pauseStartTime).getTime();
            effectivePausedSeconds += Math.max(0, Math.floor(ongoingPauseMs / 1000));
          }
          const durationSeconds = Math.max(0, Math.round(
            (new Date(endTime).getTime() - new Date(state.startTime).getTime()) / 1000
          ) - effectivePausedSeconds);
          const rawDurationMinutes = Math.max(1, Math.round(durationSeconds / 60));

          // Resolve contractual rounding from project/client or fallback to global settings
          let roundingInterval: BillingRoundingInterval = (useSettingsStore.getState().globalRoundingInterval as BillingRoundingInterval) ?? 6;
          let roundingMode: BillingRoundingMode = (useSettingsStore.getState().globalRoundingMode as BillingRoundingMode) ?? 'ceil';

          try {
            const task = await pb.collection('tasks').getOne(state.runningTaskId, {
              expand: 'project.client',
            });
            const project = (task as any).expand?.project;
            const client = project?.expand?.client;

            if (project?.billing_rounding && project.billing_rounding !== 'inherit') {
              roundingInterval = project.billing_rounding;
              if (project.rounding_mode && project.rounding_mode !== 'inherit') {
                roundingMode = project.rounding_mode;
              }
            } else if (client?.billing_rounding !== undefined && client?.billing_rounding !== null) {
              roundingInterval = client.billing_rounding;
              if (client.rounding_mode) {
                roundingMode = client.rounding_mode;
              }
            }
          } catch (e) {
            console.warn("Could not fetch project/client rounding settings, using global fallback:", e);
          }

          const billableMinutes = calculateBillableMinutes({
            rawMinutes: rawDurationMinutes,
            interval: roundingInterval,
            mode: roundingMode,
            isBillable: state.isBillable,
          });

          try {
            if (state.runningTimeEntryId) {
              await pb.collection('time_entries').update(state.runningTimeEntryId, {
                end_time: endTime,
                duration_minutes: rawDurationMinutes,
                billable_minutes: billableMinutes,
                description: state.description || undefined,
                is_billable: state.isBillable,
              });
            } else {
              await pb.collection('time_entries').create({
                task: state.runningTaskId,
                user: pb.authStore.record?.id,
                start_time: state.startTime,
                end_time: endTime,
                duration_minutes: rawDurationMinutes,
                billable_minutes: billableMinutes,
                description: state.description || undefined,
                is_billable: state.isBillable,
              });
            }

            // Nur bei Erfolg Store clearen
            set({
              runningTaskId: null,
              startTime: null,
              taskTitle: null,
              description: '',
              isPaused: false,
              pauseStartTime: null,
              totalPausedSeconds: 0,
              selectedTaskId: '',
              isBillable: true,
              runningTimeEntryId: null,
            });
          } catch (error) {
            console.error('Failed to stop timer:', error);
            throw error; // UI kann Fehler anzeigen
          }
        },
        saveRunningNote: async () => {
          const state = get();
          if (!state.runningTimeEntryId) return;

          try {
            await pb.collection('time_entries').update(state.runningTimeEntryId, {
              description: state.description || undefined,
            });
            return Promise.resolve();
          } catch (e) {
            console.error("Failed to save running note:", e);
            return Promise.reject(e);
          }
        },
        setDescription: (description) => set({ description }),
        pauseTimer: () => {
          const state = get();
          if (!state.isPaused && state.runningTaskId) {
            set({ isPaused: true, pauseStartTime: new Date().toISOString() });
          }
        },
        resumeTimer: () => {
          const state = get();
          if (state.isPaused && state.pauseStartTime) {
            const pausedSecs = Math.floor((new Date().getTime() - new Date(state.pauseStartTime).getTime()) / 1000);
            set({
              isPaused: false,
              pauseStartTime: null,
              totalPausedSeconds: state.totalPausedSeconds + Math.max(0, pausedSecs),
            });
          }
        },
        setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
        setBillable: (isBillable) => set({ isBillable }),
        setTimerMode: (mode) => set({ timerMode: mode }),
        syncTimerFromDB: async () => {
          try {
            if (typeof window === 'undefined') return;
            if (!pb.authStore.isValid || !pb.authStore.record) return;

            const records = await pb.collection('time_entries').getList(1, 1, {
              filter: pb.filter('user = {:userId} && (end_time = "" || end_time = null)', {
                userId: pb.authStore.record.id,
              }),
              sort: '-created',
            });

            if (records.items.length > 0) {
              const entry = records.items[0];
              const state = get();

              const maxHours = useSettingsStore.getState().maxTimerHoursContinuous || 8;
              const maxDurationSeconds = maxHours * 3600;
              const startTimeMs = new Date((entry.start_time as string) || entry.created).getTime();
              const nowMs = Date.now();
              const diffSeconds = (nowMs - startTimeMs) / 1000;

              // Auto-Cap check: If open time entry exceeds configured max continuous runtime (e.g. 8h)
              if (diffSeconds > maxDurationSeconds) {
                const cappedEndTime = new Date(startTimeMs + maxDurationSeconds * 1000).toISOString();
                const cappedDurationMinutes = Math.round(maxDurationSeconds / 60);

                try {
                  await pb.collection('time_entries').update(entry.id, {
                    end_time: cappedEndTime,
                    duration_minutes: cappedDurationMinutes,
                  });

                  // Clear store state if it was tracking this ghost timer
                  if (state.runningTimeEntryId === entry.id || state.runningTaskId === entry.task) {
                    set({
                      runningTaskId: null,
                      startTime: null,
                      taskTitle: null,
                      description: '',
                      isPaused: false,
                      pauseStartTime: null,
                      totalPausedSeconds: 0,
                      selectedTaskId: '',
                      isBillable: true,
                      runningTimeEntryId: null,
                    });
                  }

                  if (typeof window !== 'undefined') {
                    const { toast } = await import('sonner');
                    toast.warning(`Geistertimer bereinigt: Timer wurde nach ${maxHours} Stunden automatisch beendet.`, {
                      description: `Der Zeiteintrag wurde auf ${maxHours}h begrenzt und in der Datenbank gespeichert.`,
                      duration: 8000,
                    });
                  }
                } catch (capError) {
                  console.error('Failed to auto-cap ghost timer:', capError);
                }
                return;
              }

              if (state.runningTimeEntryId === entry.id) return;

              let title = 'Aktuelle Aufgabe';
              try {
                if (entry.task) {
                  const task = await pb.collection('tasks').getOne(entry.task as string);
                  if (task?.title) title = task.title;
                }
              } catch {
                // Task fallback
              }

              set({
                runningTaskId: (entry.task as string) || null,
                startTime: (entry.start_time as string) || new Date().toISOString(),
                taskTitle: title,
                description: entry.description || '',
                selectedTaskId: (entry.task as string) || '',
                isPaused: false,
                pauseStartTime: null,
                totalPausedSeconds: 0,
                isBillable: (entry.is_billable as boolean) ?? true,
                runningTimeEntryId: entry.id,
              });
            }
          } catch (error) {
            console.warn('Timer DB-Sync optional fallback:', error);
          }
        },
      };
    },
    {
      name: 'vibeforce-timer-storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && !_storageListenerAdded) {
          _storageListenerAdded = true;
          window.addEventListener('storage', (e) => {
            if (e.key === 'vibeforce-timer-storage' && e.newValue) {
              try {
                const parsed = JSON.parse(e.newValue);
                const currentState = _getTimerState?.();
                if (parsed.state?.runningTaskId && parsed.state?.runningTaskId !== currentState?.runningTaskId) {
                  if (currentState?.runningTaskId) {
                    useTimerStore.getState().stopAndSaveTimer?.().catch(() => {});
                  }
                }
              } catch {}
            }
          });
        }
        return localStorage;
      }),
    }
  )
);

interface UiState {
  actionMenuOpen: boolean;
  taskDialogOpen: boolean;
  clientDialogOpen: boolean;
  projectDialogOpen: boolean;
  setActionMenuOpen: (open: boolean) => void;
  toggleActionMenu: () => void;
  setTaskDialogOpen: (open: boolean) => void;
  setClientDialogOpen: (open: boolean) => void;
  setProjectDialogOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()((set) => ({
  actionMenuOpen: false,
  taskDialogOpen: false,
  clientDialogOpen: false,
  projectDialogOpen: false,
  setActionMenuOpen: (open) => set({ actionMenuOpen: open }),
  toggleActionMenu: () => set((s) => ({ actionMenuOpen: !s.actionMenuOpen })),
  setTaskDialogOpen: (open) => set({ taskDialogOpen: open }),
  setClientDialogOpen: (open) => set({ clientDialogOpen: open }),
  setProjectDialogOpen: (open) => set({ projectDialogOpen: open }),
}));

interface SettingsState {
  budgetWarningEnabled: boolean;
  budgetWarningThreshold: number;
  autoFallbackTaskEnabled: boolean;
  hideArchivedProjectTasks: boolean;
  defaultTaskView: 'kanban' | 'list' | 'timeline';
  uiDensity: 'comfortable' | 'compact';
  maxTimerHoursContinuous: number;
  inactivityHeartbeatHours: number;
  timeRoundingMinutes: number;
  defaultBillable: boolean;
  emailNotificationFrequency: 'immediate' | 'hourly' | 'daily' | 'never';
  globalRoundingInterval: BillingRoundingInterval;
  globalRoundingMode: BillingRoundingMode;
  craftModuleEnabled: boolean;
  setCraftModuleEnabled: (enabled: boolean) => void;
  language: UserLanguage;
  setLanguage: (lang: UserLanguage) => void;
  setHideArchivedProjectTasks: (hide: boolean) => void;
  toggleHideArchivedProjectTasks: () => void;
  setDefaultTaskView: (view: 'kanban' | 'list' | 'timeline') => void;
  setUiDensity: (density: 'comfortable' | 'compact') => void;
  setTimeRoundingMinutes: (minutes: number) => void;
  setDefaultBillable: (billable: boolean) => void;
  setEmailNotificationFrequency: (freq: 'immediate' | 'hourly' | 'daily' | 'never') => void;
  setGlobalRoundingInterval: (interval: BillingRoundingInterval) => void;
  setGlobalRoundingMode: (mode: BillingRoundingMode) => void;
  setBudgetWarningEnabled: (enabled: boolean) => void;
  setBudgetWarningThreshold: (threshold: number) => void;
  setAutoFallbackTaskEnabled: (enabled: boolean) => void;
  setMaxTimerHoursContinuous: (hours: number) => void;
  setInactivityHeartbeatHours: (hours: number) => void;
  syncFromUserPreferences: (userRecord: any) => void;
  saveUserPreferences: (newPrefs: Partial<UserPreferences>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      craftModuleEnabled: true,
      language: 'de' as UserLanguage,
      budgetWarningEnabled: true,
      budgetWarningThreshold: 80,
      autoFallbackTaskEnabled: true,
      hideArchivedProjectTasks: true,
      defaultTaskView: 'kanban',
      uiDensity: 'comfortable',
      maxTimerHoursContinuous: 8,
      inactivityHeartbeatHours: 4,
      timeRoundingMinutes: 0,
      defaultBillable: true,
      emailNotificationFrequency: 'immediate',
      globalRoundingInterval: 6,
      globalRoundingMode: 'ceil',
      setCraftModuleEnabled: (enabled) => set({ craftModuleEnabled: enabled }),
      setLanguage: (lang) => {
        set({ language: lang });
        if (typeof window !== 'undefined') {
          localStorage.setItem('vibeforce-language', lang);
        }
      },
      setHideArchivedProjectTasks: (hide) => set({ hideArchivedProjectTasks: hide }),
      toggleHideArchivedProjectTasks: () => set((s) => ({ hideArchivedProjectTasks: !s.hideArchivedProjectTasks })),
      setDefaultTaskView: (view) => set({ defaultTaskView: view }),
      setUiDensity: (density) => set({ uiDensity: density }),
      setTimeRoundingMinutes: (minutes) => set({ timeRoundingMinutes: minutes }),
      setDefaultBillable: (billable) => set({ defaultBillable: billable }),
      setEmailNotificationFrequency: (freq) => set({ emailNotificationFrequency: freq }),
      setGlobalRoundingInterval: (interval) => set({ globalRoundingInterval: interval }),
      setGlobalRoundingMode: (mode) => set({ globalRoundingMode: mode }),
      setBudgetWarningEnabled: (enabled) => set({ budgetWarningEnabled: enabled }),
      setBudgetWarningThreshold: (threshold) => set({ budgetWarningThreshold: threshold }),
      setAutoFallbackTaskEnabled: (enabled) => set({ autoFallbackTaskEnabled: enabled }),
      setMaxTimerHoursContinuous: (hours) => set({ maxTimerHoursContinuous: hours }),
      setInactivityHeartbeatHours: (hours) => set({ inactivityHeartbeatHours: hours }),
      syncFromUserPreferences: (userRecord: any) => {
        if (!userRecord) return;
        const prefs = userRecord.preferences as UserPreferences | undefined;
        const recordLang = (userRecord.language || prefs?.language) as UserLanguage | undefined;

        set((state) => ({
          craftModuleEnabled: prefs?.craftModuleEnabled !== undefined ? prefs.craftModuleEnabled : (state.craftModuleEnabled ?? true),
          language: recordLang || state.language || 'de',
          defaultTaskView: prefs?.defaultTaskView || state.defaultTaskView,
          timeRoundingMinutes: prefs?.timeRoundingMinutes !== undefined ? prefs.timeRoundingMinutes : state.timeRoundingMinutes,
          defaultBillable: prefs?.defaultBillable !== undefined ? prefs.defaultBillable : state.defaultBillable,
          emailNotificationFrequency: prefs?.emailNotificationFrequency || state.emailNotificationFrequency,
          uiDensity: prefs?.uiDensity || state.uiDensity,
          hideArchivedProjectTasks: prefs?.hideArchivedProjectTasks !== undefined ? prefs.hideArchivedProjectTasks : state.hideArchivedProjectTasks,
        }));
      },
      saveUserPreferences: async (newPrefs: Partial<UserPreferences>) => {
        const current = get();
        const updated = {
          craftModuleEnabled: newPrefs.craftModuleEnabled !== undefined ? newPrefs.craftModuleEnabled : current.craftModuleEnabled,
          language: newPrefs.language !== undefined ? newPrefs.language : current.language,
          defaultTaskView: newPrefs.defaultTaskView !== undefined ? newPrefs.defaultTaskView : current.defaultTaskView,
          timeRoundingMinutes: newPrefs.timeRoundingMinutes !== undefined ? newPrefs.timeRoundingMinutes : current.timeRoundingMinutes,
          defaultBillable: newPrefs.defaultBillable !== undefined ? newPrefs.defaultBillable : current.defaultBillable,
          emailNotificationFrequency: newPrefs.emailNotificationFrequency !== undefined ? newPrefs.emailNotificationFrequency : current.emailNotificationFrequency,
          uiDensity: newPrefs.uiDensity !== undefined ? newPrefs.uiDensity : current.uiDensity,
          hideArchivedProjectTasks: newPrefs.hideArchivedProjectTasks !== undefined ? newPrefs.hideArchivedProjectTasks : current.hideArchivedProjectTasks,
        };

        set({ ...updated });
        if (typeof window !== 'undefined' && updated.language) {
          localStorage.setItem('vibeforce-language', updated.language);
        }

        if (typeof window !== 'undefined' && pb.authStore.isValid && pb.authStore.record) {
          const userId = pb.authStore.record.id;
          try {
            const existingPrefs = (pb.authStore.record as any).preferences || {};
            const mergedPrefs = { ...existingPrefs, ...updated };

            const updatePayload: any = { preferences: mergedPrefs };
            if (updated.language) {
              updatePayload.language = updated.language;
            }

            const updatedRecord = await pb.collection('users').update(userId, updatePayload);

            if (pb.authStore.token) {
              pb.authStore.save(pb.authStore.token, updatedRecord);
            }
          } catch (err) {
            console.warn('PocketBase user preferences sync fallback to local store:', err);
          }
        }
      },
    }),
    {
      name: 'vibeforce-settings-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
