/**
 * Transformer Engine (Migration v2)
 * 
 * Wandelt Rohdaten (API oder CSV) in das Vibeforce Flow OS (PocketBase) Schema um.
 * Basiert auf dem ursprünglichen Gemini-Plan, erweitert für CSV-Support.
 */

const TASK_STATUS_MAP = {
    'open': 'todo',
    'offen': 'todo',
    'in progress': 'in_progress',
    'in_progress': 'in_progress',
    'in bearbeitung': 'in_progress',
    'blocked': 'review',
    'blockiert': 'review',
    'in review': 'review',
    'in prüfung': 'review',
    'done': 'done',
    'erledigt': 'done',
    'completed': 'done',
    'abgeschlossen': 'done',
};

const PRIORITY_MAP = {
    'critical': 'acute',
    'acute': 'acute',
    'high': 'high',
    'hoch': 'high',
    'medium': 'medium',
    'mittel': 'medium',
    'normal': 'medium',
    'low': 'low',
    'niedrig': 'low',
};

const TRANSFORMS = {
    seconds_to_minutes: (value) => {
        if (!value) return null;
        return Math.round(Number(value) / 60);
    },
    status_mapping: (value) => {
        if (!value) return 'todo';
        const key = String(value).toLowerCase().trim();
        return TASK_STATUS_MAP[key] || 'todo';
    },
    priority_mapping: (value) => {
        if (!value) return 'medium';
        const key = String(value).toLowerCase().trim();
        return PRIORITY_MAP[key] || 'medium';
    },
    to_iso_date: (value) => {
        if (!value) return null;
        try {
            return new Date(value).toISOString();
        } catch { return null; }
    }
};

class Transformer {
    constructor() {
        this.idCache = {
            users: new Map(),
            projects: new Map(),
            tasks: new Map(),
            clients: new Map(),
        };
    }

    setIdCache(type, extId, pbId) {
        if (this.idCache[type]) this.idCache[type].set(extId, pbId);
    }

    getPbId(type, extId) {
        return this.idCache[type]?.get(extId) || null;
    }

    transformTask(raw) {
        return {
            external_source: 'awork_csv',
            external_id: raw['Task Title'] || raw.id,
            title: raw['Task Title'] || raw.name,
            description: raw['Task Description'] || raw.description,
            status: TRANSFORMS.status_mapping(raw['Task Status'] || raw.status),
            priority: TRANSFORMS.priority_mapping(raw['Task Priority'] || raw.priority),
            start_date: TRANSFORMS.to_iso_date(raw['Start Date'] || raw.startDate),
            due_date: TRANSFORMS.to_iso_date(raw['Due Date'] || raw.dueDate),
            estimated_hours: Number(raw['Estimated Hours'] || raw.estimatedHours || 0)
        };
    }

    transformTimeEntry(raw) {
        return {
            external_source: 'awork_csv',
            external_id: raw.id || `${raw.Date}_${raw.Description}`,
            description: raw.Description || raw.description,
            duration_minutes: Number(raw['Duration (min)'] || raw.duration || 0),
            date: TRANSFORMS.to_iso_date(raw.Date || raw.date),
            is_billable: raw['Is Billable'] === 'true' || raw.isBillable === true
        };
    }
}

module.exports = { Transformer, TRANSFORMS };
