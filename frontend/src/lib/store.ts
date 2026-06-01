import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { pb } from './pocketbase';

interface TimerState {
  runningTaskId: string | null;
  startTime: string | null; // ISO string
  taskTitle: string | null;
  description: string;
  isCollapsed: boolean;
  isPaused: boolean;
  pauseStartTime: string | null;
  totalPausedSeconds: number;
  selectedTaskId: string;
  isBillable: boolean;
  runningTimeEntryId: string | null;
  startTimer: (taskId: string, title: string, description?: string, customStartTime?: string) => Promise<void>;
  stopTimer: () => void;
  stopAndSaveTimer: () => Promise<void>;
  saveRunningNote: () => Promise<void>;
  setDescription: (description: string) => void;
  setIsCollapsed: (collapsed: boolean) => void;
  setPaused: (isPaused: boolean, pauseStartTime?: string | null) => void;
  setSelectedTaskId: (taskId: string) => void;
  setTotalPausedSeconds: (seconds: number) => void;
  setBillable: (isBillable: boolean) => void;
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
      isCollapsed: false,
      isPaused: false,
      pauseStartTime: null,
      totalPausedSeconds: 0,
      selectedTaskId: '',
      isBillable: true,
      runningTimeEntryId: null,
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

        // Fetch billable default for this task
        let isBillableDefault = true;
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
        const durationSeconds = Math.round(
          (new Date(endTime).getTime() - new Date(state.startTime).getTime()) / 1000
        ) - state.totalPausedSeconds;
        const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));

        try {
          if (state.runningTimeEntryId) {
            await pb.collection('time_entries').update(state.runningTimeEntryId, {
              end_time: endTime,
              duration_minutes: durationMinutes,
              description: state.description || undefined,
              is_billable: state.isBillable,
            });
          } else {
            await pb.collection('time_entries').create({
              task: state.runningTaskId,
              user: pb.authStore.record?.id,
              start_time: state.startTime,
              end_time: endTime,
              duration_minutes: durationMinutes,
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
      setIsCollapsed: (collapsed) => set({ isCollapsed: collapsed }),
      setPaused: (isPaused, pauseStartTime = null) => set({ isPaused, pauseStartTime }),
      setSelectedTaskId: (taskId) => set({ selectedTaskId: taskId }),
      setTotalPausedSeconds: (seconds) => set({ totalPausedSeconds: seconds }),
      setBillable: (isBillable) => set({ isBillable }),
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
                if (parsed.state?.runningTaskId && parsed.state?.runningTaskId !== _getTimerState?.().runningTaskId) {
                  console.warn('Timer in anderem Tab aktiv. Bitte diesen Tab schließen oder Timer stoppen.');
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

interface ThemeState {
  nightShiftEnabled: boolean;
  nightShiftBypass: boolean;
  setNightShiftEnabled: (enabled: boolean) => void;
  setNightShiftBypass: (bypass: boolean) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      nightShiftEnabled: false,
      nightShiftBypass: false,
      setNightShiftEnabled: (enabled) => set({ nightShiftEnabled: enabled }),
      setNightShiftBypass: (bypass) => set({ nightShiftBypass: bypass }),
    }),
    {
      name: 'vibeforce-theme-storage',
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
