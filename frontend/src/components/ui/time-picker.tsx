'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TimePickerProps {
  value?: string; // "HH:MM"
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimePicker({ value = "00:00", onChange, disabled, className }: TimePickerProps) {
  // Parse hours and minutes from value (HH:MM)
  const [hoursStr, minutesStr] = React.useMemo(() => {
    if (!value || typeof value !== "string" || !value.includes(":")) {
      return ["00", "00"];
    }
    const parts = value.split(":");
    const h = parts[0].padStart(2, "0");
    const m = parts[1].padStart(2, "0");
    return [h, m];
  }, [value]);

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    onChange?.(`${newHour}:${minutesStr}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    onChange?.(`${hoursStr}:${newMinute}`);
  };

  // Generate 00-23 hours
  const hours = React.useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  }, []);

  // Generate 00-59 minutes
  const minutes = React.useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  }, []);

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <select
        value={hoursStr}
        onChange={handleHourChange}
        disabled={disabled}
        className="h-8 rounded-lg border border-input bg-background dark:bg-zinc-900 px-2 py-0.5 text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {hours.map((h) => (
          <option key={h} value={h} className="bg-background text-foreground dark:bg-zinc-950">
            {h}
          </option>
        ))}
      </select>
      <span className="text-sm font-semibold text-muted-foreground">:</span>
      <select
        value={minutesStr}
        onChange={handleMinuteChange}
        disabled={disabled}
        className="h-8 rounded-lg border border-input bg-background dark:bg-zinc-900 px-2 py-0.5 text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        {minutes.map((m) => (
          <option key={m} value={m} className="bg-background text-foreground dark:bg-zinc-950">
            {m}
          </option>
        ))}
      </select>
    </div>
  );
}
