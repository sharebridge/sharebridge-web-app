import { useEffect, useRef, useState } from "react";
import { mapCaption, mapEmptyMessage } from "../mapEmptyMessage";
import type { OrderInitiation } from "../types";
import { getAppConfig } from "../config";

type Props = {
  intents: OrderInitiation[];
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

export function OrderIntentsMap({
  intents,
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
      const center =
        geoRows.length > 0
          ? { lat: geoRows[0].location_lat, lng: geoRows[0].location_lng }
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
  }, [mapKey, geoRows]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !window.google?.maps) {
      return;
    }

    for (const marker of markersRef.current) {
      marker.setMap(null);
    }
    markersRef.current = [];

    if (geoRows.length === 0) {
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

    if (geoRows.length === 1) {
      map.setCenter({
        lat: geoRows[0].location_lat,
        lng: geoRows[0].location_lng
      });
      map.setZoom(14);
    } else {
      map.fitBounds(bounds, 48);
    }
  }, [geoRows, selectedId, onSelect]);

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

  if (geoRows.length === 0) {
    return (
      <div className="map-panel map-panel-empty" role="status">
        <p>
          {mapEmptyMessage(intents, coordinatorView, viewerUserId)}
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
      </p>
    </div>
  );
}
