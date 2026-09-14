'use client';

import {
  Sheet,
  SheetContent,
  SheetTitle,
} from '@/components/ui/sheet';
import { TaskDetailsContent } from '@/components/tasks/details/TaskDetailsContent';

interface TaskDetailsSheetProps {
  taskId: string | null;
  projectKey: string;
  onClose: () => void;
  onTaskUpdated: () => void;
  onTaskClick?: (taskId: string) => void;
}

export function TaskDetailsSheet({ taskId, projectKey, onClose, onTaskUpdated, onTaskClick }: TaskDetailsSheetProps) {
  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:w-[90vw] md:w-[85vw] lg:w-[75vw] xl:w-[65vw] max-w-[1080px] min-w-[340px] bg-background border-l border-border/60 text-foreground p-0 flex flex-col overflow-hidden shadow-2xl">
        <SheetTitle className="sr-only">Aufgabe bearbeiten</SheetTitle>
        <TaskDetailsContent
          taskId={taskId}
          projectKey={projectKey}
          onClose={onClose}
          onTaskUpdated={onTaskUpdated}
          onTaskClick={onTaskClick}
        />
      </SheetContent>
    </Sheet>
  );
}
