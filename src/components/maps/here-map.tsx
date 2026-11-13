"use client";
import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map, Marker } from "leaflet";
import { toast } from "sonner";
import { DEFAULT_CAMPUS_CENTER } from "@/lib/campus";

interface LatLng { lat: number; lng: number }

interface MapPickerProps {
  /** Initial map center (used when no marker provided). */
  center?: LatLng;
  /** Initial zoom level (1 = world, 18 = street). */
  zoom?: number;
  /** Controlled marker position. */
  marker?: LatLng;
  /** Fires whenever the marker is dragged or the map is clicked. */
  onMove: (lat: number, lng: number) => void;
  /** Optional className for the wrapper. */
  className?: string;
}

const DEFAULT_CENTER: LatLng = DEFAULT_CAMPUS_CENTER;

/**
 * Interactive OpenStreetMap picker.
 * - Draggable marker for the selected point
 * - Click anywhere on the map to move the marker
 * - Calls `onMove(lat, lng)` whenever the marker position changes
 */
export function HereMapPicker({
  center = DEFAULT_CENTER,
  zoom = 15,
  marker,
  onMove,
  className,
}: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const latest = useRef({ center, zoom, marker, onMove });
  useEffect(() => { latest.current = { center, zoom, marker, onMove }; }, [center, zoom, marker, onMove]);

  // Initialise map once
  useEffect(() => {
    if (!containerRef.current) return;

    let cancelled = false;
    // Leaflet touches window; loading must finish before creating a map on a mounted container.
    void import("leaflet").then(L => {
      if (cancelled || !containerRef.current) return;
      const { center, zoom, marker } = latest.current;

      // Default marker icons come from image URLs that bundlers often break —
      // we use a simple CSS-only marker instead.
      const map = L.map(containerRef.current, {
        center: [center.lat, center.lng],
        zoom,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Inline-SVG marker icon — Leaflet's default PNG icons are broken by
      // bundlers (they reference leaflet/dist/images/ URLs that don't resolve).
      const customIcon = L.divIcon({
        className: "leaflet-picker-marker",
        html: `
          <div style="
            width: 24px; height: 36px; position: relative;
            transform: translate(-50%, -100%);
          ">
            <svg viewBox="0 0 24 36" width="24" height="36" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0 C5.4 0 0 5.4 0 12 c0 9 12 24 12 24 s12-15 12-24 c0-6.6-5.4-12-12-12 z"
                fill="oklch(0.577 0.245 27.325)" stroke="#fff" stroke-width="1.5"/>
              <circle cx="12" cy="12" r="4.5" fill="#fff"/>
            </svg>
          </div>
        `,
        iconSize: [24, 36],
        iconAnchor: [12, 36],
      });

      const initial = marker ?? center;
      const mapMarker = L.marker([initial.lat, initial.lng], {
        draggable: true,
        autoPan: true,
        icon: customIcon,
      }).addTo(map);
      markerRef.current = mapMarker;
      mapRef.current = map;

      mapMarker.on("dragend", () => {
        const ll = mapMarker.getLatLng();
        latest.current.onMove(ll.lat, ll.lng);
      });

      map.on("click", (ev: { latlng: { lat: number; lng: number } }) => {
        const { lat, lng } = ev.latlng;
        mapMarker.setLatLng([lat, lng]);
        latest.current.onMove(lat, lng);
      });

    }).catch(() => { if (!cancelled) toast.error("Peta gagal dimuat. Muat ulang halaman untuk mencoba lagi."); });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, []);

  // Sync marker when prop changes
  useEffect(() => {
    if (!markerRef.current || !marker) return;
    markerRef.current.setLatLng([marker.lat, marker.lng]);
  }, [marker]);

  // Recenter map when center prop changes
  useEffect(() => {
    if (!mapRef.current || !center) return;
    mapRef.current.setView([center.lat, center.lng]);
  }, [center]);

  return (
    <div
      ref={containerRef}
      className={
        "h-64 w-full rounded-xl overflow-hidden border border-border/60 bg-muted/30 " +
        (className ?? "")
      }
      style={{ minHeight: 260 }}
    />
  );
}
