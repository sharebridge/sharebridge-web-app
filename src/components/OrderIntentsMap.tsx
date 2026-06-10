import { useEffect, useRef, useState } from "react";
import type { SeekerDemandRow } from "../api/demandBoard";
import { mapCaption, mapEmptyMessage } from "../mapEmptyMessage";
import type { OrderInitiation } from "../types";
import { getAppConfig } from "../config";

type Props = {
  intents: OrderInitiation[];
  seekerDemands?: SeekerDemandRow[];
  selectedId: string | null;
  onSelect: (orderIntentId: string) => void;
  coordinatorView: boolean;
  viewerUserId: string;
};

type GeoIntent = OrderInitiation & {
  location_lat: number;
  location_lng: number;
};

function intentsWithGeo(intents: OrderInitiation[]): GeoIntent[] {
  return intents.filter(
    (row): row is GeoIntent =>
      typeof row.location_lat === "number" &&
      Number.isFinite(row.location_lat) &&
      typeof row.location_lng === "number" &&
      Number.isFinite(row.location_lng)
  );
}

type GeoDemand = SeekerDemandRow & {
  location_lat: number;
  location_lng: number;
};

function demandsWithGeo(rows: SeekerDemandRow[]): GeoDemand[] {
  return rows.filter(
    (row): row is GeoDemand =>
      typeof row.location_lat === "number" &&
      Number.isFinite(row.location_lat) &&
      typeof row.location_lng === "number" &&
      Number.isFinite(row.location_lng)
  );
}

export function OrderIntentsMap({
  intents,
  seekerDemands = [],
  selectedId,
  onSelect,
  coordinatorView,
  viewerUserId
}: Props) {
  const mapKey = getAppConfig().googleMapsApiKey;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const geoRows = intentsWithGeo(intents);
  const geoDemands = demandsWithGeo(seekerDemands);

  useEffect(() => {
    if (!mapKey) {
      return;
    }
    if (mapInstance.current || !mapRef.current) {
      return;
    }

    let cancelled = false;

    const init = () => {
      if (cancelled || !mapRef.current || !window.google?.maps) {
        return;
      }
      const centerSource = geoRows[0] ?? geoDemands[0];
      const center = centerSource
        ? {
            lat: centerSource.location_lat,
            lng: centerSource.location_lng
          }
        : { lat: 12.94, lng: 80.24 };
      mapInstance.current = new google.maps.Map(mapRef.current, {
        center,
        zoom: geoRows.length > 1 ? 12 : 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
      });
      setMapError(null);
    };

    if (window.google?.maps) {
      init();
      return () => {
        cancelled = true;
      };
    }

    const scriptId = "sharingbridge-google-maps";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    const onReady = () => init();

    if (existing) {
      existing.addEventListener("load", onReady);
      return () => {
        cancelled = true;
        existing.removeEventListener("load", onReady);
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(mapKey)}`;
    script.onload = onReady;
    script.onerror = () => {
      if (!cancelled) {
        setMapError("Could not load Google Maps. Check VITE_GOOGLE_MAPS_API_KEY.");
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
    };
  }, [mapKey, geoRows, geoDemands]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.google?.maps) {
      return;
    }

    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = [];

    if (geoRows.length === 0 && geoDemands.length === 0) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();
    for (const row of geoRows) {
      const position = { lat: row.location_lat, lng: row.location_lng };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map,
        position,
        title: row.order_intent_id,
        icon:
          selectedId === row.order_intent_id
            ? undefined
            : {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2
              }
      });
      marker.addListener("click", () => onSelect(row.order_intent_id));
      markersRef.current.push(marker);
    }

    for (const row of geoDemands) {
      const position = { lat: row.location_lat, lng: row.location_lng };
      bounds.extend(position);
      const marker = new google.maps.Marker({
        map,
        position,
        title: row.need_description,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: "#ea580c",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2
        }
      });
      markersRef.current.push(marker);
    }

    const pinCount = geoRows.length + geoDemands.length;
    if (pinCount === 1) {
      const only = geoRows[0] ?? geoDemands[0];
      map.setCenter({
        lat: only.location_lat,
        lng: only.location_lng
      });
      map.setZoom(14);
    } else if (pinCount > 1) {
      map.fitBounds(bounds, 48);
    }
  }, [geoRows, geoDemands, selectedId, onSelect]);

  if (!mapKey) {
    return (
      <div className="map-panel map-panel-empty" role="status">
        <p>
          Set <code>VITE_GOOGLE_MAPS_API_KEY</code> at build time to show order
          intents on a map. List view still shows all rows with distance (m).
        </p>
      </div>
    );
  }

  if (geoRows.length === 0 && geoDemands.length === 0) {
    return (
      <div className="map-panel map-panel-empty" role="status">
        <p>
          {mapEmptyMessage(intents, coordinatorView, viewerUserId)}
          {" "}
          Seeker demands with GPS appear as orange pins when recorded from mobile.
        </p>
      </div>
    );
  }

  return (
    <div className="map-panel">
      {mapError ? (
        <div className="banner banner-error" role="alert">
          {mapError}
        </div>
      ) : null}
      <div ref={mapRef} className="order-intents-map" aria-label="Order intents map" />
      <p className="map-caption">
        {mapCaption(geoRows.length, intents.length, coordinatorView)}
        {geoDemands.length > 0
          ? ` · ${geoDemands.length} seeker demand pin${geoDemands.length === 1 ? "" : "s"} (orange)`
          : ""}
      </p>
    </div>
  );
}
