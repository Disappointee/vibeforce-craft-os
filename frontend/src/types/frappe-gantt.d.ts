declare module 'frappe-gantt' {
    interface GanttTaskInput {
        id: string;
        name: string;
        start: string;
        end: string;
        progress: number;
        dependencies?: string;
        custom_class?: string;
    }

    interface GanttOptions {
        arrow_curve?: number;
        auto_move_label?: boolean;
        bar_corner_radius?: number;
        bar_height?: number;
        container_height?: string | number;
        column_width?: number | null;
        date_format?: string;
        upper_header_height?: number;
        lower_header_height?: number;
        snap_at?: string | null;
        infinite_padding?: boolean;
        holidays?: Record<string, string>;
        ignore?: unknown[];
        language?: string;
        lines?: string;
        move_dependencies?: boolean;
        padding?: number;
        popup?: (ctx: any) => void;
        popup_on?: string;
        readonly_progress?: boolean;
        readonly_dates?: boolean;
        readonly?: boolean;
        hover_on_date?: boolean;
        fixed_duration?: boolean;
        scroll_to?: string;
        show_expected_progress?: boolean;
        today_button?: boolean;
        view_mode?: string;
        view_mode_select?: boolean;
        view_modes?: unknown[];
        is_weekend?: (d: Date) => boolean;
        on_click?: (task: any) => void;
        on_date_change?: (task: any, start: Date, end: Date) => void;
        on_progress_change?: (task: any, progress: number) => void;
        on_view_change?: (mode: string) => void;
    }

    export default class Gantt {
        constructor(
            wrapper: string | HTMLElement | SVGElement,
            tasks: GanttTaskInput[],
            options?: GanttOptions
        );
        change_view_mode(mode: string, init?: boolean): void;
        update_options(options: Partial<GanttOptions>): void;
        refresh(tasks: GanttTaskInput[]): void;
    }
}
