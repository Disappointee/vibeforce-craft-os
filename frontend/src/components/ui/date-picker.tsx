'use client';

import * as React from 'react';
import { format, parse, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { DayPicker, UI, DayFlag, SelectionState } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// DatePicker – a popover calendar with a text input (dd.MM.yyyy format)
// ---------------------------------------------------------------------------

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    placeholder?: string;
    disabled?: boolean;
    className?: string;
}

export function DatePicker({
    value,
    onChange,
    placeholder = 'tt.mm.jjjj',
    disabled = false,
    className,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(
        value && isValid(value) ? format(value, 'dd.MM.yyyy') : ''
    );
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const popoverDivRef = React.useRef<HTMLDivElement>(null);
    const [popoverStyle, setPopoverStyle] = React.useState<React.CSSProperties>({});

    // Sync external value changes to input
    React.useEffect(() => {
        if (value && isValid(value)) {
            setInputValue(format(value, 'dd.MM.yyyy'));
        } else {
            setInputValue('');
        }
    }, [value]);

    // Close popover on outside click
    React.useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    // Adjust popover position to avoid viewport overflow (all 4 edges)
    React.useEffect(() => {
        if (!open) {
            setPopoverStyle({});
            return;
        }
        const raf = requestAnimationFrame(() => {
            const el = popoverDivRef.current;
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            const style: React.CSSProperties = {};

            if (rect.bottom > vh - 16) {
                style.bottom = '100%';
                style.top = 'auto';
                style.marginTop = '0';
                style.marginBottom = '0.25rem';
            }
            if (rect.top < 16) {
                style.top = '100%';
                style.bottom = 'auto';
                style.marginTop = '0.25rem';
                style.marginBottom = '0';
            }
            if (rect.right > vw - 16) {
                style.left = 'auto';
                style.right = '0';
            }
            if (rect.left < 16) {
                style.left = '0';
                style.right = 'auto';
            }

            if (Object.keys(style).length > 0) {
                setPopoverStyle(style);
            }
        });
        return () => cancelAnimationFrame(raf);
    }, [open]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        setInputValue(raw);

        // Auto-parse when the input is 10 chars (dd.MM.yyyy)
        if (raw.length === 10) {
            const parsed = parse(raw, 'dd.MM.yyyy', new Date());
            if (isValid(parsed)) {
                onChange(parsed);
            }
        }
    };

    const handleInputBlur = () => {
        if (inputValue.length === 0) {
            onChange(undefined);
            return;
        }
        const parsed = parse(inputValue, 'dd.MM.yyyy', new Date());
        if (isValid(parsed)) {
            onChange(parsed);
            setInputValue(format(parsed, 'dd.MM.yyyy'));
        }
    };

    const handleDaySelect = (day: Date | undefined) => {
        onChange(day);
        if (day && isValid(day)) {
            setInputValue(format(day, 'dd.MM.yyyy'));
        } else {
            setInputValue('');
        }
        setOpen(false);
    };

    const handleClear = () => {
        onChange(undefined);
        setInputValue('');
        setOpen(false);
    };

    return (
        <div ref={popoverRef} className={cn('relative', className)}>
            {/* Text input + calendar trigger button */}
            <div className="flex items-center gap-0">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(
                        'flex h-9 w-full rounded-l-lg border border-border bg-card px-3 py-1 text-sm text-foreground shadow-sm transition-colors',
                        'placeholder:text-muted-foreground',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'font-mono text-xs tracking-wider'
                    )}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={disabled}
                    onClick={() => setOpen(!open)}
                    className={cn(
                        'h-9 w-9 rounded-l-none rounded-r-lg border-l-0 shrink-0',
                        open && 'bg-muted'
                    )}
                >
                    <CalendarIcon className="h-4 w-4" />
                </Button>
                {value && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        disabled={disabled}
                        onClick={handleClear}
                        className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-3 w-3" />
                    </Button>
                )}
            </div>

            {/* Popover calendar */}
            {open && (
                <div
                    ref={popoverDivRef}
                    className={cn(
                        'absolute top-full left-0 z-[9999] mt-1 rounded-xl border border-border bg-popover p-3 shadow-lg',
                        'animate-in fade-in-0 zoom-in-95'
                    )}
                    style={popoverStyle}
                >
                    <DayPicker
                        mode="single"
                        selected={value}
                        onSelect={handleDaySelect}
                        locale={de}
                        weekStartsOn={1}
                        showOutsideDays
                        className="!m-0"
                        classNames={{
                            [UI.Month]: 'space-y-3',
                            [UI.MonthCaption]: 'flex items-center justify-between px-1 py-1',
                            [UI.CaptionLabel]: 'text-sm font-medium text-foreground',
                            [UI.Nav]: 'flex items-center gap-1',
                            [UI.PreviousMonthButton]:
                                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7',
                            [UI.NextMonthButton]:
                                'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors size-7',
                            [UI.MonthGrid]: 'w-full border-collapse',
                            [UI.Weekdays]: 'flex',
                            [UI.Weekday]:
                                'w-9 text-xs font-medium text-muted-foreground text-center pb-2',
                            [UI.Weeks]: 'flex w-full mt-1',
                            [UI.Day]: cn(
                                'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                                '[&:has([aria-selected])]:bg-accent/50'
                            ),
                            [UI.DayButton]: cn(
                                'inline-flex items-center justify-center rounded-lg size-9 text-sm font-normal text-foreground',
                                'hover:bg-muted hover:text-foreground transition-colors',
                                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500'
                            ),
                            [SelectionState.selected]:
                                'bg-indigo-600 text-white hover:bg-indigo-500 font-medium',
                            [DayFlag.today]: 'font-bold text-indigo-400',
                            [DayFlag.outside]: 'text-muted-foreground/50',
                            [DayFlag.disabled]: 'text-muted-foreground/30',
                            [DayFlag.hidden]: 'invisible',
                        }}
                    />
                </div>
            )}
        </div>
    );
}
