'use client';

import { useState, useMemo, useCallback } from 'react';
import { Filter, X, ChevronDown, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

import { TranslatedSelect } from '@/components/ui/translated-select';
import { ProjectRecord, UserRecord, ClientRecord } from '@/lib/pocketbase-types';
import { t, TranslationKey } from '@/lib/i18n';

export type DatePreset = 'this_month' | 'last_month' | 'last_7_days' | 'last_30_days' | 'last_quarter' | 'custom';

export interface ReportFilterValues {
    datePreset: DatePreset;
    dateFrom: string;
    dateTo: string;
    projectIds: string[];
    userIds: string[];
    clientIds: string[];
    billableFilter: 'all' | 'billable' | 'non_billable' | 'ready_to_invoice';
    groupBy: 'project' | 'user' | 'both';
}

interface ReportFiltersProps {
    projects: ProjectRecord[];
    users: UserRecord[];
    clients: ClientRecord[];
    filters: ReportFilterValues;
    onChange: (filters: ReportFilterValues) => void;
}

const PRESET_OPTIONS: { value: DatePreset; label: string }[] = [
    { value: 'this_month', label: 'Dieser Monat' },
    { value: 'last_month', label: 'Letzter Monat' },
    { value: 'last_7_days', label: 'Letzte 7 Tage' },
    { value: 'last_30_days', label: 'Letzte 30 Tage' },
    { value: 'last_quarter', label: 'Letztes Quartal' },
    { value: 'custom', label: 'Benutzerdefiniert' },
];

function getPresetDates(preset: DatePreset): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().split('T')[0];

    switch (preset) {
        case 'this_month': {
            const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            return { dateFrom: toISO(firstOfMonth), dateTo: toISO(now) };
        }
        case 'last_month': {
            const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
            return { dateFrom: toISO(firstOfLastMonth), dateTo: toISO(lastOfLastMonth) };
        }
        case 'last_7_days': {
            const sevenDaysAgo = new Date(now);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return { dateFrom: toISO(sevenDaysAgo), dateTo: toISO(now) };
        }
        case 'last_30_days': {
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return { dateFrom: toISO(thirtyDaysAgo), dateTo: toISO(now) };
        }
        case 'last_quarter': {
            const month = now.getMonth();
            const quarterStartMonth = Math.floor(month / 3) * 3 - 3;
            const firstOfQuarter = new Date(now.getFullYear(), quarterStartMonth < 0 ? quarterStartMonth + 12 : quarterStartMonth, 1);
            const lastOfQuarter = new Date(now.getFullYear(), Math.floor(month / 3) * 3, 0);
            return { dateFrom: toISO(firstOfQuarter), dateTo: toISO(lastOfQuarter) };
        }
        default:
            return { dateFrom: '', dateTo: '' };
    }
}

export function ReportFilters({ projects, users, clients, filters, onChange }: ReportFiltersProps) {
    const [showFilters, setShowFilters] = useState(true);

    const updateFilter = <K extends keyof ReportFilterValues>(
        key: K,
        value: ReportFilterValues[K]
    ) => {
        onChange({ ...filters, [key]: value });
    };

    const applyPreset = useCallback((preset: DatePreset) => {
        const { dateFrom, dateTo } = getPresetDates(preset);
        onChange({ ...filters, datePreset: preset, dateFrom, dateTo });
    }, [filters, onChange]);

    const handleDateChange = useCallback((field: 'dateFrom' | 'dateTo', value: string) => {
        onChange({ ...filters, [field]: value, datePreset: 'custom' });
    }, [filters, onChange]);

    const toggleProject = (projectId: string) => {
        const current = filters.projectIds;
        const updated = current.includes(projectId)
            ? current.filter((id) => id !== projectId)
            : [...current, projectId];
        updateFilter('projectIds', updated);
    };

    const toggleUser = (userId: string) => {
        const current = filters.userIds;
        const updated = current.includes(userId)
            ? current.filter((id) => id !== userId)
            : [...current, userId];
        updateFilter('userIds', updated);
    };

    const toggleClient = (clientId: string) => {
        const current = filters.clientIds;
        const updated = current.includes(clientId)
            ? current.filter((id) => id !== clientId)
            : [...current, clientId];
        updateFilter('clientIds', updated);
    };

    const clearAll = () => {
        const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
        onChange({
            datePreset: 'this_month',
            dateFrom: firstOfMonth,
            dateTo: '',
            projectIds: [],
            userIds: [],
            clientIds: [],
            billableFilter: 'all',
            groupBy: 'project',
        });
    };

    const activeFilterCount = [
        filters.datePreset !== 'this_month' || filters.dateFrom || filters.dateTo,
        filters.projectIds.length > 0,
        filters.userIds.length > 0,
        filters.clientIds.length > 0,
        filters.billableFilter !== 'all',
        filters.groupBy !== 'project',
    ].filter(Boolean).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Badge
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="bg-card border-border py-1.5 px-3 flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors relative"
                    >
                        <Filter size={14} /> {t('action.filter')}
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-indigo-500 text-[10px] font-bold text-white flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Badge>
                    {activeFilterCount > 0 && (
                        <button
                            onClick={clearAll}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t('action.reset')}
                        </button>
                    )}
                </div>
            </div>

            {showFilters && (
                <div className="p-4 rounded-xl border border-border bg-card/40 space-y-4">
                    {/* Date Presets */}
                    <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            Zeitraum
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {PRESET_OPTIONS.map((preset) => (
                                <Badge
                                    key={preset.value}
                                    variant="outline"
                                    onClick={() => applyPreset(preset.value)}
                                    className={`cursor-pointer transition-colors ${
                                        filters.datePreset === preset.value
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                            : 'bg-background border-border text-muted-foreground hover:border-zinc-700'
                                    }`}
                                >
                                    <Calendar size={12} className="mr-1" />
                                    {preset.label}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block truncate">
                                {t('report.filter.date_from')}
                            </label>
                            <Input
                                type="date"
                                value={filters.dateFrom}
                                onChange={(e) => handleDateChange('dateFrom', e.target.value)}
                                className="bg-background border-border h-9"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block truncate">
                                {t('report.filter.date_to')}
                            </label>
                            <Input
                                type="date"
                                value={filters.dateTo}
                                onChange={(e) => handleDateChange('dateTo', e.target.value)}
                                className="bg-background border-border h-9"
                            />
                        </div>
                    </div>

                    {/* Group By */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('report.filter.group_by._')}
                        </label>
                        <TranslatedSelect
                            value={filters.groupBy}
                            onValueChange={(val) =>
                                val && updateFilter('groupBy', val as 'project' | 'user' | 'both')
                            }
                            options={[
                                { value: 'project', labelKey: 'report.filter.group_by.project' as TranslationKey },
                                { value: 'user', labelKey: 'report.filter.group_by.user' as TranslationKey },
                                { value: 'both', labelKey: 'report.filter.group_by.both' as TranslationKey },
                            ]}
                            className="bg-background border-border h-9 min-w-0 w-full sm:min-w-[180px] sm:w-auto"
                        />
                    </div>

                    {/* Billable Filter */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('report.filter.billable._')}
                        </label>
                        <TranslatedSelect
                            value={filters.billableFilter}
                            onValueChange={(val) =>
                                val && updateFilter('billableFilter', val as ReportFilterValues['billableFilter'])
                            }
                            options={[
                                { value: 'all', labelKey: 'report.filter.billable.all' as TranslationKey },
                                { value: 'billable', labelKey: 'report.filter.billable.billable' as TranslationKey },
                                { value: 'non_billable', labelKey: 'report.filter.billable.non_billable' as TranslationKey },
                                { value: 'ready_to_invoice', labelKey: 'report.filter.billable.ready_to_invoice' as TranslationKey },
                            ]}
                            className="bg-background border-border h-9 min-w-0 w-full sm:min-w-[180px] sm:w-auto"
                        />
                    </div>

                    {/* Client Multi-Select */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('report.filter.clients')}
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger
                                render={
                                    <button className="flex w-full h-9 items-center justify-between gap-1.5 rounded-lg border border-input bg-background py-2 pr-2 pl-2.5 text-xs whitespace-nowrap transition-colors outline-none select-none hover:bg-accent/50 text-foreground cursor-pointer">
                                        <span className="flex items-center gap-1.5 truncate">
                                            {filters.clientIds.length === 0 ? (
                                                <span className="text-muted-foreground truncate">{t('report.filter.clients')}</span>
                                            ) : filters.clientIds.length === 1 ? (
                                                <span className="truncate">{clients.find(c => c.id === filters.clientIds[0])?.name || '1 Kunde'}</span>
                                            ) : (
                                                <span>{filters.clientIds.length} Kunden</span>
                                            )}
                                        </span>
                                        <ChevronDown className="size-3 text-muted-foreground shrink-0" />
                                    </button>
                                }
                            />
                            <DropdownMenuContent className="bg-background border-border text-foreground min-w-[200px] max-h-[300px] overflow-y-auto">
                                <DropdownMenuCheckboxItem
                                    checked={filters.clientIds.length === 0}
                                    onCheckedChange={() => updateFilter('clientIds', [])}
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-xs cursor-pointer"
                                >
                                    {t('report.filter.clients')}
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                {clients.map((c) => {
                                    const isChecked = filters.clientIds.includes(c.id);
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={c.id}
                                            checked={isChecked}
                                            onCheckedChange={() => toggleClient(c.id)}
                                            onSelect={(e) => e.preventDefault()}
                                            className="text-xs cursor-pointer"
                                        >
                                            {c.name}
                                        </DropdownMenuCheckboxItem>
                                    );
                                })}
                                {clients.length === 0 && (
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('report.filter.no_clients')}</div>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Project Multi-Select */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('report.filter.projects')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {projects.map((p) => {
                                const selected = filters.projectIds.includes(p.id);
                                return (
                                    <Badge
                                        key={p.id}
                                        variant="outline"
                                        onClick={() => toggleProject(p.id)}
                                        className={`cursor-pointer transition-colors ${selected
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                            : 'bg-background border-border text-muted-foreground hover:border-zinc-700'
                                            }`}
                                    >
                                        {p.key || p.name}
                                        {selected && <X size={12} className="ml-1" />}
                                    </Badge>
                                );
                            })}
                            {projects.length === 0 && (
                                <span className="text-xs text-muted-foreground">{t('report.filter.no_projects')}</span>
                            )}
                        </div>
                    </div>

                    {/* User Multi-Select */}
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block">
                            {t('report.filter.users')}
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                            {users.map((u) => {
                                const selected = filters.userIds.includes(u.id);
                                return (
                                    <Badge
                                        key={u.id}
                                        variant="outline"
                                        onClick={() => toggleUser(u.id)}
                                        className={`cursor-pointer transition-colors ${selected
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                            : 'bg-background border-border text-muted-foreground hover:border-zinc-700'
                                            }`}
                                    >
                                        {u.name || u.email}
                                        {selected && <X size={12} className="ml-1" />}
                                    </Badge>
                                );
                            })}
                            {users.length === 0 && (
                                <span className="text-xs text-muted-foreground">{t('report.filter.no_users')}</span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
