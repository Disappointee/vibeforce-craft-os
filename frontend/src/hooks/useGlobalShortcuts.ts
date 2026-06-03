'use client';

import { useEffect } from 'react';

interface ShortcutHandlers {
  onOpenTaskDialog: () => void;
  onOpenActionMenu: () => void;
  onOpenClientDialog: () => void;
  onOpenProjectDialog: () => void;
}

export function useGlobalShortcuts({
  onOpenTaskDialog,
  onOpenActionMenu,
  onOpenClientDialog,
  onOpenProjectDialog,
}: ShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') !== null ||
        target.closest('[role="textbox"]') !== null ||
        target.closest('[role="combobox"]') !== null ||
        target.closest('[role="searchbox"]') !== null;

      if (isInput) return;

      const key = e.key.toLowerCase();

      if (key === 't' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenTaskDialog();
        return;
      }

      if (key === 'p' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenProjectDialog();
        return;
      }

      if (key === 'z' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenActionMenu();
        return;
      }

      if (key === 'c' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onOpenClientDialog();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenTaskDialog, onOpenActionMenu, onOpenClientDialog, onOpenProjectDialog]);
}
