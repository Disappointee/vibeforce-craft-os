'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { pb } from '@/lib/pocketbase';
import { toast } from 'sonner';
import {
  getTodayTimeEntriesAction,
  clockInAction,
  clockOutAction,
} from '@/app/actions/craft/time-clock';
import {
  Timer,
  Play,
  Pause,
  Square,
  MapPin,
  Clock,
  Calendar,
  Building2,
  HardHat,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
  Wrench,
  FileSpreadsheet,
  Printer,
  ChevronRight,
  Sparkles,
  User,
  History,
  X,
  FileCheck,
} from 'lucide-react';
import type { ProjectRecord } from '@/lib/pocketbase-types';

export type ActivityType =
  | 'site_assembly' // Baustelle & Montage
  | 'travel_prep' // Fahrtzeit & Rüstzeit
  | 'workshop' // Werkstatt & Fertigung
  | 'regie_vob'; // Regiestunden gem. § 2 Abs. 10 VOB/B

export interface ShiftSegment {
  id: string;
  type: ActivityType;
  startTime: string; // ISO
  endTime?: string; // ISO
  durationSeconds: number;
  projectKey: string;
  projectName: string;
  gpsVerified?: boolean;
  gpsCoords?: { lat: number; lng: number };
  gpsDistanceMeters?: number;
  notes?: string;
}

interface MonteurTimeClockProps {
  projects: ProjectRecord[];
  initialProjectId?: string;
  userName?: string;
  userRole?: string;
}

// Haversine formula to compute distance between two coordinates in meters
function computeDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

const ACTIVITY_META: Record<
  ActivityType,
  { label: string; shortLabel: string; icon: React.ComponentType<{ className?: string }>; badge: string; color: string }
> = {
  site_assembly: {
    label: 'Baustelle & Montage',
    shortLabel: 'Baustelle',
    icon: HardHat,
    badge: 'Produktivzeit',
    color: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
  },
  travel_prep: {
    label: 'Fahrtzeit & Rüstzeit',
    shortLabel: 'Fahrt / Rüst',
    icon: Truck,
    badge: 'Anfahrt',
    color: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
  },
  workshop: {
    label: 'Werkstatt & Vorfertigung',
    shortLabel: 'Werkstatt',
    icon: Wrench,
    badge: 'Betrieb',
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
  },
  regie_vob: {
    label: 'Regiestunden (§ 2 Abs. 10 VOB/B)',
    shortLabel: 'Regie VOB/B',
    icon: FileSpreadsheet,
    badge: 'Zusatzvergütung',
    color: 'text-amber-500 bg-amber-500/15 border-amber-500/40',
  },
};

export function MonteurTimeClock({
  projects,
  initialProjectId,
  userName = 'Gast-Monteur (Demo)',
  userRole = 'Bauleitung / Demo-Zugang',
}: MonteurTimeClockProps) {
  const [resolvedUserName, setResolvedUserName] = useState(userName);
  const [resolvedUserRole, setResolvedUserRole] = useState(userRole);

  useEffect(() => {
    const rec = pb.authStore.record as any;
    if (rec?.name) setResolvedUserName(rec.name);
    if (rec?.email?.startsWith('guest_slot_')) {
      setResolvedUserRole('Bauleitung / Demo-Zugang');
    } else if (rec?.role) {
      setResolvedUserRole(rec.role === 'admin' ? 'Bauleitung / Admin' : 'Monteur / Fachkraft');
    }
  }, []);
  // Selected project
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    return initialProjectId || (projects.length > 0 ? projects[0].id : '');
  });

  const activeProject = useMemo(() => {
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  const activeProjectKey = activeProject?.key || 'ULB';
  const activeProjectName = activeProject?.name || 'Quartier Spreeauen · Los 3';

  // Activity type
  const [activeActivity, setActiveActivity] = useState<ActivityType>('site_assembly');

  // Clock state: 'idle' | 'active' | 'paused'
  const [clockStatus, setClockStatus] = useState<'idle' | 'active' | 'paused'>('idle');

  // Segments of today (loaded from PocketBase time_entries)
  const [segments, setSegments] = useState<ShiftSegment[]>([]);

  // Current active segment start time & PB record ID
  const [activeSegmentStart, setActiveSegmentStart] = useState<string | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const clockInPromiseRef = useRef<Promise<string | null> | null>(null);

  // Load today's time entries from PocketBase via Server Action on mount
  useEffect(() => {
    let cancelled = false;
    getTodayTimeEntriesAction()
      .then((entries) => {
        if (cancelled) return;
        const completed: ShiftSegment[] = [];
        let openEntry: (typeof entries)[number] | null = null;

        for (const e of entries) {
          const desc = e.description || '';
          const metaMatch = desc.match(/^\[([^|\]]+)(?:\|([^\]]+))?\]/);
          const parsedKey = metaMatch?.[1] || e.project_key || activeProjectKey;
          const parsedType = (metaMatch?.[2] as ActivityType) || 'site_assembly';
          const validType: ActivityType = ACTIVITY_META[parsedType] ? parsedType : 'site_assembly';

          if (!e.end_time) {
            openEntry = e;
          } else {
            const startMs = new Date(e.start_time).getTime();
            const endMs = new Date(e.end_time).getTime();
            const durSec =
              Number.isFinite(startMs) && Number.isFinite(endMs) && endMs > startMs
                ? Math.max(1, Math.floor((endMs - startMs) / 1000))
                : Math.max(60, (Number(e.duration_minutes) || 1) * 60);

            completed.push({
              id: e.id,
              type: validType,
              startTime: e.start_time,
              endTime: e.end_time,
              durationSeconds: durSec,
              projectKey: parsedKey,
              projectName: e.project_name || desc || activeProjectName,
              gpsVerified: desc.includes('GPS verifiziert'),
            });
          }
        }

        setSegments(completed);
        if (openEntry) {
          const desc = openEntry.description || '';
          const metaMatch = desc.match(/^\[([^|\]]+)(?:\|([^\]]+))?\]/);
          const parsedType = (metaMatch?.[2] as ActivityType) || 'site_assembly';
          if (ACTIVITY_META[parsedType]) {
            setActiveActivity(parsedType);
          }
          if (openEntry.project_id && projects.some((p) => p.id === openEntry!.project_id)) {
            setSelectedProjectId(openEntry.project_id);
          }
          setActiveEntryId(openEntry.id);
          setActiveSegmentStart(openEntry.start_time);
          setClockStatus('active');
        }
      })
      .catch((err) => {
        console.warn('[MonteurTimeClock] Failed to load today time_entries:', err);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Digital clock (HH:MM:SS)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Elapsed time for active session (in seconds)
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    if (clockStatus === 'active' && activeSegmentStart) {
      const updateElapsed = () => {
        const startMs = new Date(activeSegmentStart).getTime();
        const nowMs = Date.now();
        setSessionSeconds(Math.max(0, Math.floor((nowMs - startMs) / 1000)));
      };
      updateElapsed();
      const interval = setInterval(updateElapsed, 1000);
      return () => clearInterval(interval);
    } else {
      setSessionSeconds(0);
    }
  }, [clockStatus, activeSegmentStart]);

  // GPS Geofence Verification State
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<{
    verified: boolean;
    distance?: number;
    coords?: { lat: number; lng: number };
    message?: string;
  } | null>(null);

  // Check Geofence
  const verifyGeofence = () => {
    setGpsLoading(true);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userLat = pos.coords.latitude;
          const userLng = pos.coords.longitude;

          // Project target coordinates (default to realistic site coords if not set)
          const targetLat = activeProject?.geofence_lat || 52.5085;
          const targetLng = activeProject?.geofence_lng || 13.4328;
          const targetRadius = activeProject?.geofence_radius || 150;

          const dist = computeDistanceMeters(userLat, userLng, targetLat, targetLng);
          const isInside = dist <= targetRadius;

          setGpsStatus({
            verified: isInside,
            distance: dist,
            coords: { lat: userLat, lng: userLng },
            message: isInside
              ? `Vor Ort verifiziert (${dist} m von Baustellen-Zentrum · Erlaubt: ${targetRadius} m)`
              : `Außerhalb Geofence (${dist} m entfernt · Erlaubter Radius: ${targetRadius} m)`,
          });
          setGpsLoading(false);
        },
        (err) => {
          console.warn('GPS Geolocation warning:', err);
          setGpsStatus({
            verified: false,
            message: 'GPS-Standort konnte nicht verifiziert werden (Berechtigung oder Signal fehlt).',
          });
          setGpsLoading(false);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setGpsStatus({
        verified: false,
        message: 'GPS nicht verfügbar · Standort nicht verifiziert',
      });
      setGpsLoading(false);
    }
  };

  // Actions
  const handleClockIn = async () => {
    const nowIso = new Date().toISOString();
    setActiveSegmentStart(nowIso);
    setClockStatus('active');

    // Automatically check geofence if not done yet
    if (!gpsStatus) {
      verifyGeofence();
    }

    const promise = clockInAction({
      projectId: selectedProjectId,
      projectKey: activeProjectKey,
      activityType: activeActivity,
      activityLabel: ACTIVITY_META[activeActivity].label,
      gpsVerified: Boolean(gpsStatus?.verified),
    })
      .then((created) => {
        setActiveEntryId(created.id);
        setActiveSegmentStart(created.start_time);
        return created.id;
      })
      .catch((err: any) => {
        console.error('[MonteurTimeClock] clockInAction failed:', err);
        toast.error(err?.message || 'Stempeln fehlgeschlagen.');
        return null;
      });

    clockInPromiseRef.current = promise;
    await promise;
  };

  const finishActiveSegment = async (nextStatus: 'paused' | 'idle') => {
    if (clockStatus === 'active' && activeSegmentStart) {
      const startIso = activeSegmentStart;
      const nowIso = new Date().toISOString();
      const duration = Math.max(
        1,
        Math.floor((Date.now() - new Date(startIso).getTime()) / 1000)
      );

      const tempId = activeEntryId || 'seg_' + Math.random().toString(36).substring(2, 9);
      const finishedSegment: ShiftSegment = {
        id: tempId,
        type: activeActivity,
        startTime: startIso,
        endTime: nowIso,
        durationSeconds: duration,
        projectKey: activeProjectKey,
        projectName: activeProjectName,
        gpsVerified: gpsStatus?.verified,
        gpsCoords: gpsStatus?.coords,
        gpsDistanceMeters: gpsStatus?.distance,
      };

      setSegments((prev) => [...prev, finishedSegment]);
      setActiveSegmentStart(null);
      setActiveEntryId(null);
      setClockStatus(nextStatus);

      try {
        let resolvedEntryId = activeEntryId;
        if (!resolvedEntryId && clockInPromiseRef.current) {
          resolvedEntryId = await clockInPromiseRef.current;
        }
        clockInPromiseRef.current = null;

        const saved = await clockOutAction({
          entryId: resolvedEntryId || undefined,
          startTimeIso: startIso,
          endTimeIso: nowIso,
          durationSeconds: duration,
          projectId: selectedProjectId,
          projectKey: activeProjectKey,
          activityType: activeActivity,
          activityLabel: ACTIVITY_META[activeActivity].label,
          gpsVerified: Boolean(gpsStatus?.verified),
        });
        setSegments((prev) =>
          prev.map((s) => (s.id === tempId ? { ...s, id: saved.id } : s))
        );
      } catch (err: any) {
        console.error('[MonteurTimeClock] clockOutAction failed:', err);
        toast.error(err?.message || 'Speichern der Stempelzeit fehlgeschlagen.');
      }
    } else {
      setActiveSegmentStart(null);
      setActiveEntryId(null);
      setClockStatus(nextStatus);
    }
  };

  const handlePause = () => {
    void finishActiveSegment('paused');
  };

  const handleResume = () => {
    void handleClockIn();
  };

  const handleClockOut = () => {
    void finishActiveSegment('idle');
  };

  // Format seconds to HH:MM:SS
  const formatHms = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Total recorded seconds today
  const totalRecordedSeconds = useMemo(() => {
    const completed = segments.reduce((sum, s) => sum + s.durationSeconds, 0);
    return completed + (clockStatus === 'active' ? sessionSeconds : 0);
  }, [segments, clockStatus, sessionSeconds]);

  // Modal: Tagesabschluss & Stundenzettel
  const [isTimesheetModalOpen, setIsTimesheetModalOpen] = useState(false);

  return (
    <div className="w-full space-y-6 pb-20">
      {/* 1. TOP HEADER & WORKER IDENTITY */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-amber-500">Monteur-Terminal</span>
            <span>/</span>
            <span>VOB/B § 2 Abs. 10 & ArbZG-konform</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Timer className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                Monteur-Stempeluhr & Baustellen-Terminal
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  Handschuhtauglich (≥ 64px)
                </span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <User className="w-3.5 h-3.5 text-foreground" />
                <span>Angemeldet als: <strong className="text-foreground">{resolvedUserName}</strong> ({resolvedUserRole})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Stundenzettel anzeigen */}
        <button
          id="open-timesheet-btn"
          type="button"
          onClick={() => setIsTimesheetModalOpen(true)}
          className="min-h-[44px] px-4 py-2 rounded-xl bg-muted/60 hover:bg-muted border border-border text-foreground text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer self-start md:self-auto"
        >
          <FileCheck className="w-4 h-4 text-amber-500" />
          <span>Tagesstundenzettel ({segments.length} Buchungen)</span>
        </button>
      </div>

      {/* 2. GROSSFLÄCHIGES STEMPEL-TERMINAL (GLOVE-READY) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Digital Clock & Large Touch Actions (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Realtime Clock & Status Display */}
          <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-card via-card to-muted/20 border border-border shadow-xl text-center space-y-4">
            {/* Live Status Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
              {clockStatus === 'active' ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  🟠 EINGESTEMPELT ({ACTIVITY_META[activeActivity].shortLabel})
                </span>
              ) : clockStatus === 'paused' ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  ⏸️ IN PAUSE (ArbZG Ruhepause)
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground border border-border">
                  <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40"></span>
                  ⚪ ABGESTEMPELT / BEREIT
                </span>
              )}
            </div>

            {/* Current Realtime Clock (Giant) */}
            <div className="space-y-1">
              <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight text-foreground select-none">
                {currentTime.toLocaleTimeString('de-DE')}
              </div>
              <div className="text-sm font-semibold text-muted-foreground flex items-center justify-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                {currentTime.toLocaleDateString('de-DE', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>

            {/* Active Shift Elapsed Display */}
            {clockStatus === 'active' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-sm mx-auto animate-in zoom-in-95 duration-200">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                  Laufende Buchung ({ACTIVITY_META[activeActivity].label})
                </span>
                <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                  {formatHms(sessionSeconds)}
                </div>
              </div>
            )}

            {/* GLOVE-READY TOUCH ACTION BUTTONS (>= 64px touch target) */}
            <div className="pt-2 max-w-xl mx-auto">
              {clockStatus === 'idle' ? (
                /* BUTTON: KOMMEN (Craft OS Safety Amber / Warm Orange) */
                <button
                  id="clock-in-btn"
                  type="button"
                  onClick={handleClockIn}
                  className="w-full min-h-[72px] sm:min-h-[80px] p-5 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-[0.98] text-black text-lg sm:text-xl font-black tracking-wide shadow-xl shadow-amber-500/25 flex items-center justify-center gap-3 transition-all cursor-pointer border-2 border-amber-300/40"
                >
                  <Play className="w-7 h-7 fill-current" />
                  <span>🟠 KOMMEN / SCHICHT STARTEN</span>
                </button>
              ) : clockStatus === 'active' ? (
                /* BUTTONS: PAUSE & GEHEN */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    id="clock-pause-btn"
                    type="button"
                    onClick={handlePause}
                    className="w-full min-h-[64px] sm:min-h-[72px] p-4 rounded-2xl bg-amber-500/15 hover:bg-amber-500/25 active:bg-amber-500/35 active:scale-[0.98] text-amber-500 dark:text-amber-400 text-base sm:text-lg font-black tracking-wide shadow-md shadow-amber-500/10 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-amber-400/40"
                  >
                    <Pause className="w-6 h-6 fill-current" />
                    <span>⏸️ PAUSE STARTEN</span>
                  </button>
                  <button
                    id="clock-out-btn"
                    type="button"
                    onClick={handleClockOut}
                    className="w-full min-h-[64px] sm:min-h-[72px] p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 active:scale-[0.98] text-white text-base sm:text-lg font-black tracking-wide shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-rose-400/40"
                  >
                    <Square className="w-6 h-6 fill-current" />
                    <span>🛑 GEHEN / ABSTEMPELN</span>
                  </button>
                </div>
              ) : (
                /* BUTTONS: PAUSE BEENDEN & GEHEN */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    id="clock-resume-btn"
                    type="button"
                    onClick={handleResume}
                    className="w-full min-h-[64px] sm:min-h-[72px] p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 active:scale-[0.98] text-black text-base sm:text-lg font-black tracking-wide shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-amber-300/40"
                  >
                    <Play className="w-6 h-6 fill-current" />
                    <span>▶️ PAUSE BEENDEN</span>
                  </button>
                  <button
                    id="clock-out-paused-btn"
                    type="button"
                    onClick={handleClockOut}
                    className="w-full min-h-[64px] sm:min-h-[72px] p-4 rounded-2xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 active:scale-[0.98] text-white text-base sm:text-lg font-black tracking-wide shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-rose-400/40"
                  >
                    <Square className="w-6 h-6 fill-current" />
                    <span>🛑 SCHICHT BEENDEN</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 3. SCHNELLAUSWAHL EINSATZTYP (VOB/B § 2/10) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                Einsatztyp wählen (VOB/B-Zuordnung)
              </label>
              <span className="text-[11px] text-muted-foreground">
                Gilt für die nächste Stempelzeit
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(Object.keys(ACTIVITY_META) as ActivityType[]).map((key) => {
                const meta = ACTIVITY_META[key];
                const Icon = meta.icon;
                const isSelected = activeActivity === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveActivity(key)}
                    className={`min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 active:scale-[0.99] cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/15 border-amber-500 text-foreground ring-2 ring-amber-500/20 shadow-sm'
                        : 'bg-card border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`p-2.5 rounded-xl border ${
                          isSelected ? 'bg-amber-500 text-black border-amber-600' : 'bg-muted border-border'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate text-foreground">
                          {meta.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {meta.badge}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-amber-500 text-black">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Baustelle, GPS-Geofence & Tages-KPIs (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Baustellen-Auswahl Karte */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-amber-500" />
                Aktive Baustelle
              </label>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                {activeProjectKey}
              </span>
            </div>

            <select
              id="time-project-select"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full min-h-[48px] bg-muted/60 border border-border rounded-xl px-3 py-2.5 text-xs font-bold text-foreground outline-none cursor-pointer focus:ring-2 focus:ring-amber-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="bg-card text-foreground">
                  {p.name} ({p.key})
                </option>
              ))}
            </select>

            <div className="p-3 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground space-y-1">
              <div className="text-foreground font-semibold truncate">{activeProjectName}</div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">
                  {activeProject?.site_address?.street || 'Baustellenzufahrt Tor 2'} •{' '}
                  {activeProject?.site_address?.city || 'Bauort erfasst'}
                </span>
              </div>
            </div>
          </div>

          {/* GPS-Geofencing Verifikation vor Ort */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                GPS-Geofencing vor Ort
              </label>
              <button
                id="check-gps-btn"
                type="button"
                onClick={verifyGeofence}
                disabled={gpsLoading}
                className="text-[11px] font-bold text-amber-600 hover:text-amber-500 transition-colors inline-flex items-center gap-1 cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                {gpsLoading ? 'Wird geprüft…' : 'Neu prüfen'}
              </button>
            </div>

            {gpsStatus ? (
              <div
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  gpsStatus.verified
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2 font-bold">
                  {gpsStatus.verified ? (
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span>{gpsStatus.verified ? 'Geofence-Check bestanden' : 'Standort-Prüfung'}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{gpsStatus.message}</p>
                {gpsStatus.coords && (
                  <div className="text-[10px] font-mono opacity-70">
                    Koordinate: {gpsStatus.coords.lat.toFixed(5)}° N, {gpsStatus.coords.lng.toFixed(5)}° E
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={verifyGeofence}
                className="w-full p-4 rounded-xl border border-dashed border-border hover:bg-muted/40 text-xs text-muted-foreground flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MapPin className="w-5 h-5 text-amber-500" />
                <span className="font-semibold text-foreground">GPS-Standort prüfen</span>
                <span className="text-[10px]">Baustellen-Anwesenheit verifizieren</span>
              </button>
            )}
          </div>

          {/* Tages-KPI Zusammenfassung */}
          <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
              Heutige Netto-Arbeitszeit
            </span>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-black font-mono text-amber-500">
                {formatHms(totalRecordedSeconds)}
              </div>
              <span className="text-xs text-muted-foreground">
                Soll: <strong>08:00:00 h</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border text-[11px]">
              <div className="p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block">Buchungen:</span>
                <span className="font-bold text-foreground">
                  {segments.length} {segments.length === 1 ? 'Segment' : 'Segmente'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-muted/40">
                <span className="text-muted-foreground block">Status:</span>
                <span className="font-bold text-amber-500 dark:text-amber-400">
                  {clockStatus === 'active' ? 'Aktiv' : clockStatus === 'paused' ? 'Pause' : 'Bereit'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. HEUTIGE ZEITERFASSUNGS-HISTORIE */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-foreground">
              Tages-Buchungsverlauf von heute
            </h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {segments.length} Stempelungen protokolliert
          </span>
        </div>

        {segments.length === 0 && clockStatus === 'idle' ? (
          <div className="p-8 text-center rounded-xl border border-dashed border-border bg-muted/20">
            <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <div className="text-xs font-semibold text-foreground">
              Heute noch keine Stempelzeiten erfasst
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Tippen Sie oben auf „KOMMEN / SCHICHT STARTEN“, um die Arbeitszeit zu starten.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {segments.map((seg, idx) => {
              const meta = ACTIVITY_META[seg.type];
              const Icon = meta.icon;
              const startFormatted = new Date(seg.startTime).toLocaleTimeString('de-DE', {
                hour: '2-digit',
                minute: '2-digit',
              });
              const endFormatted = seg.endTime
                ? new Date(seg.endTime).toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Laufend';

              return (
                <div
                  key={seg.id || idx}
                  className="p-3.5 rounded-xl bg-muted/30 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`p-2 rounded-lg border ${meta.color}`}>
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground flex items-center gap-2">
                        <span>{meta.label}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                          {seg.projectKey}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {seg.projectName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-mono">
                    <div className="text-muted-foreground">
                      {startFormatted} – {endFormatted}
                    </div>
                    <div className="font-bold text-foreground bg-card px-2.5 py-1 rounded-lg border border-border">
                      {formatHms(seg.durationSeconds)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. TAGESSTUNDENZETTEL MODAL */}
      {isTimesheetModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsTimesheetModalOpen(false);
          }}
        >
          <div
            className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    Tagesstundenzettel & Schichtabschluss
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Rechtskonforme Dokumentation gem. § 2 Abs. 10 VOB/B & Nachweisgesetz
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTimesheetModalOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border border-border text-center">
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Monteur:</span>
                  <span className="font-bold text-foreground">{resolvedUserName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Datum:</span>
                  <span className="font-bold text-foreground">{currentTime.toLocaleDateString('de-DE')}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Baustelle:</span>
                  <span className="font-bold text-foreground">{activeProjectKey}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block uppercase">Nettozeit:</span>
                  <span className="font-bold text-amber-500">{formatHms(totalRecordedSeconds)}</span>
                </div>
              </div>

              {/* Table of segments */}
              <div className="rounded-xl border border-border overflow-hidden">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-muted/60 text-muted-foreground border-b border-border">
                    <tr>
                      <th className="p-2.5">Einsatztyp</th>
                      <th className="p-2.5">Von – Bis</th>
                      <th className="p-2.5">Dauer</th>
                      <th className="p-2.5 text-right">GPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {segments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-muted-foreground">
                          Keine Buchungen vorhanden.
                        </td>
                      </tr>
                    ) : (
                      segments.map((seg, idx) => (
                        <tr key={idx} className="hover:bg-muted/20">
                          <td className="p-2.5 font-medium text-foreground">
                            {ACTIVITY_META[seg.type].label}
                          </td>
                          <td className="p-2.5 font-mono text-muted-foreground">
                            {new Date(seg.startTime).toLocaleTimeString('de-DE', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}{' '}
                            –{' '}
                            {seg.endTime
                              ? new Date(seg.endTime).toLocaleTimeString('de-DE', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Laufend'}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-foreground">
                            {formatHms(seg.durationSeconds)}
                          </td>
                          <td className="p-2.5 text-right">
                            {seg.gpsVerified ? (
                              <span className="text-amber-500 font-bold">✓ Vor Ort</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Legal Confirmation Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong>Rechtlicher Hinweis:</strong> Die vorstehenden Arbeits-, Fahr- und Regiestunden wurden gem. VOB/B § 2 Abs. 10 und den gesetzlichen Arbeitszeitrichtlinien (ArbZG) elektronisch erfasst und sind zur Übergabe an die Bauleitung / Abrechnung freigegeben.
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-4 bg-muted/20 border-t border-border shrink-0">
              <span className="text-[11px] text-muted-foreground">
                Digital erfasst in <strong>Vibeforce Craft OS</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Stundenzettel drucken
                </button>
                <button
                  type="button"
                  onClick={() => setIsTimesheetModalOpen(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold transition-all cursor-pointer"
                >
                  Schließen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
