'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, Circle as CircleIcon, Pentagon, Trash2, Check, RefreshCw } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { GeofenceConfig } from '@/lib/geofencing';
import 'leaflet/dist/leaflet.css';

// Dynamic import of Leaflet components with SSR disabled
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Circle = dynamic(
  () => import('react-leaflet').then((mod) => mod.Circle),
  { ssr: false }
);
const Polygon = dynamic(
  () => import('react-leaflet').then((mod) => mod.Polygon),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
// MapClickHandler: Proper component wrapper for the useMapEvents hook.
// next/dynamic cannot wrap hooks — only components. This child component
// lives inside <MapContainer> and forwards click events to the parent.
function MapClickHandler({
  type,
  onCircleClick,
  onPolygonClick,
}: {
  type: 'none' | 'circle' | 'polygon';
  onCircleClick: (latlng: [number, number]) => void;
  onPolygonClick: (latlng: [number, number]) => void;
}) {
  // Dynamic import at render time — safe because this component only
  // renders inside MapContainer which is already SSR-disabled.
  const [ready, setReady] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    import('react-leaflet').then((mod) => {
      // Store the hook reference — we'll use it via the map instance
      mapRef.current = mod;
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    // We access the map via the Leaflet global instance approach
  }, [ready]);

  // We use a simpler approach: attach click handler directly to the map container
  useEffect(() => {
    const mapContainer = document.querySelector('.leaflet-container');
    if (!mapContainer) return;

    // Access Leaflet map instance from the container
    const getMapInstance = () => (mapContainer as any)._leaflet_map;

    const handleClick = (e: any) => {
      const latlng: [number, number] = [e.latlng.lat, e.latlng.lng];
      if (type === 'circle') {
        onCircleClick(latlng);
      } else if (type === 'polygon') {
        onPolygonClick(latlng);
      }
    };

    // Small delay to ensure map is fully initialized
    const timer = setTimeout(() => {
      const map = getMapInstance();
      if (map) {
        map.on('click', handleClick);
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      const map = getMapInstance();
      if (map) {
        map.off('click', handleClick);
      }
    };
  }, [type, onCircleClick, onPolygonClick]);

  return null;
}

interface GeofenceMapEditorProps {
  initialConfig?: GeofenceConfig;
  onSave: (config: GeofenceConfig) => Promise<void>;
  isLoading?: boolean;
}

export function GeofenceMapEditor({
  initialConfig,
  onSave,
  isLoading = false,
}: GeofenceMapEditorProps) {
  const [type, setType] = useState<'none' | 'circle' | 'polygon'>(
    initialConfig?.type || 'none'
  );
  const [center, setCenter] = useState<[number, number]>(
    initialConfig?.center || [52.52, 13.405] // Berlin default
  );
  const [radius, setRadius] = useState<number>(initialConfig?.radius || 150);
  const [polygon, setPolygon] = useState<Array<[number, number]>>(
    initialConfig?.polygon || []
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ display_name: string; lat: string; lon: string }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Fix Leaflet Default Marker Icons in Next.js (DSGVO-safe inline SVG, no external unpkg requests)
  useEffect(() => {
    import('leaflet').then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      const markerSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="25" height="41" viewBox="0 0 25 41"><path fill="%230d9488" stroke="%23ffffff" stroke-width="1.5" d="M12.5 0C5.596 0 0 5.596 0 12.5c0 9.375 12.5 28.5 12.5 28.5S25 21.875 25 12.5C25 5.596 19.404 0 12.5 0zm0 17a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"/></svg>`;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: markerSvg,
        iconUrl: markerSvg,
        shadowUrl: '',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
    });
  }, []);

  // Address Search via internal server-side proxy (DSGVO compliant, zero client IP leak to OSM)
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `/api/craft/geocoding?q=${encodeURIComponent(searchQuery.trim())}`
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Geocoding search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (item: { lat: string; lon: string }) => {
    const newCenter: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
    setCenter(newCenter);
    if (type === 'none') {
      setType('circle');
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = async () => {
    setValidationError(null);
    if (type === 'polygon' && polygon.length < 3) {
      setValidationError('Ein Polygon-Geofence benötigt mindestens 3 gesetzte Eckpunkte auf der Karte.');
      return;
    }

    setIsSaving(true);
    try {
      const config: GeofenceConfig = {
        type,
        center: type === 'circle' ? center : (polygon.length > 0 ? polygon[0] : center),
        radius: type === 'circle' ? radius : undefined,
        polygon: type === 'polygon' ? polygon : undefined,
      };
      await onSave(config);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save geofence:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-2xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 shadow-sm">
        {/* Type Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Geofence-Modus
          </label>
          <div className="flex rounded-xl bg-gray-100 dark:bg-white/5 p-1">
            <button
              type="button"
              onClick={() => setType('none')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === 'none'
                  ? 'bg-white dark:bg-teal-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              Kein
            </button>
            <button
              type="button"
              onClick={() => setType('circle')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === 'circle'
                  ? 'bg-white dark:bg-teal-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <CircleIcon className="w-3.5 h-3.5" />
              Radius
            </button>
            <button
              type="button"
              onClick={() => setType('polygon')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                type === 'polygon'
                  ? 'bg-white dark:bg-teal-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Pentagon className="w-3.5 h-3.5" />
              Polygon
            </button>
          </div>
        </div>

        {/* Radius Slider / Polygon Controls */}
        <div className="space-y-2">
          {type === 'circle' && (
            <>
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {t('craft.geofence.radius_label')}
                </label>
                <span className="text-xs font-bold text-teal-600 dark:text-teal-400">
                  {radius} m
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="1000"
                step="10"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-teal-600"
              />
            </>
          )}

          {type === 'polygon' && (
            <div className="flex items-center justify-between pt-3">
              <span className="text-xs text-gray-500">
                {polygon.length} Eckpunkte gesetzt
              </span>
              <button
                type="button"
                onClick={() => setPolygon([])}
                className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Zurücksetzen
              </button>
            </div>
          )}

          {type === 'none' && (
            <div className="pt-3 text-xs text-gray-400 italic">
              Automatischer Geofence-Check für dieses Projekt deaktiviert.
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex items-end justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:scale-[0.98] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-500/20 transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : savedSuccess ? (
              <Check className="w-4 h-4" />
            ) : (
              <MapPin className="w-4 h-4" />
            )}
            {savedSuccess ? 'Gespeichert!' : 'Geofence Speichern'}
          </button>
        </div>
      </div>

      {validationError && (
        <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-medium animate-in fade-in">
          {validationError}
        </div>
      )}

      {/* Nominatim Search Bar */}
      <div className="relative">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('craft.geofence.search_address')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#121824] border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
          >
            {isSearching ? 'Sucht…' : 'Suchen'}
          </button>
        </form>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl bg-white dark:bg-[#161f2e] border border-gray-200 dark:border-white/10 shadow-xl overflow-hidden divide-y divide-gray-100 dark:divide-white/5">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => selectSearchResult(item)}
                className="w-full text-left px-4 py-3 text-xs hover:bg-gray-50 dark:hover:bg-white/5 text-gray-700 dark:text-gray-200 flex items-start gap-2"
              >
                <MapPin className="w-3.5 h-3.5 text-teal-500 shrink-0 mt-0.5" />
                <span>{item.display_name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map View */}
      <div className="relative w-full h-[520px] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-md">
        {typeof window !== 'undefined' && (
          <MapContainer
            center={center}
            zoom={16}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="/api/craft/tiles/{z}/{x}/{y}"
            />

            {/* Map Click Handler for setting center / polygon points */}
            <MapClickHandler
              type={type}
              onCircleClick={(latlng) => setCenter(latlng)}
              onPolygonClick={(latlng) => setPolygon((prev) => [...prev, latlng])}
            />

            {/* Circle Geofence Rendering */}
            {type === 'circle' && (
              <>
                <Marker position={center} />
                <Circle
                  center={center}
                  radius={radius}
                  pathOptions={{
                    color: '#0d9488',
                    fillColor: '#14b8a6',
                    fillOpacity: 0.25,
                    weight: 2,
                  }}
                />
              </>
            )}

            {/* Polygon Geofence Rendering */}
            {type === 'polygon' && polygon.length > 0 && (
              <Polygon
                positions={polygon}
                pathOptions={{
                  color: '#0d9488',
                  fillColor: '#14b8a6',
                  fillOpacity: 0.3,
                  weight: 2,
                }}
              />
            )}
          </MapContainer>
        )}
      </div>
    </div>
  );
}
