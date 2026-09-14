'use client';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { TaskDetailsContent } from '@/components/tasks/details/TaskDetailsContent';

interface TaskDetailsDialogProps {
  taskId: string | null;
  projectKey: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskClick?: (taskId: string) => void;
}

export function TaskDetailsDialog({ taskId, projectKey, onClose, onTaskUpdated, onTaskClick }: TaskDetailsDialogProps) {
  return (
    <Dialog open={!!taskId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-[900px] md:max-w-[1050px] xl:max-w-[1150px] w-[95vw] bg-background border-border text-foreground h-[85vh] max-h-[90vh] overflow-hidden p-0 flex flex-col">
        <DialogTitle className="sr-only">Aufgabe bearbeiten</DialogTitle>
        <TaskDetailsContent
          taskId={taskId}
          projectKey={projectKey}
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
          onTaskClick={onTaskClick}
        />
      </DialogContent>
    </Dialog>
  );
}
