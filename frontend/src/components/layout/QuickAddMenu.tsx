'use client';

import { Plus, CheckSquare, FolderGit2, Building2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/lib/store';

export function QuickAddMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <button
            {...props}
            className="relative p-3 min-h-[44px] min-w-[44px] rounded-lg transition-all text-primary bg-primary/10 border border-primary/20 hover:bg-primary/20 backdrop-blur-md"
            aria-label="Quick Add Menü öffnen"
          >
            <Plus size={18} />
          </button>
        )}
      />
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuItem
          onSelect={() => useUiStore.getState().setTaskDialogOpen(true)}
          className="gap-3 px-3 py-2.5 cursor-pointer"
        >
          <CheckSquare size={16} className="text-indigo-500" />
          <span>Neue Aufgabe</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => useUiStore.getState().setProjectDialogOpen(true)}
          className="gap-3 px-3 py-2.5 cursor-pointer"
        >
          <FolderGit2 size={16} className="text-rose-500" />
          <span>Neues Projekt</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => useUiStore.getState().setClientDialogOpen(true)}
          className="gap-3 px-3 py-2.5 cursor-pointer"
        >
          <Building2 size={16} className="text-blue-500" />
          <span>Neuer Kunde</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
