/** Optional shapes for Google Identity Services loaded from accounts.google.com/gsi/client */
export {};

declare global {
  namespace google.maps {
    class Map {
      constructor(el: HTMLElement, opts: Record<string, unknown>);
      setCenter(latLng: { lat: number; lng: number }): void;
      setZoom(zoom: number): void;
      fitBounds(bounds: LatLngBounds, padding?: number): void;
    }

    class Marker {
      constructor(opts: Record<string, unknown>);
      setMap(map: Map | null): void;
      addListener(event: string, handler: () => void): void;
    }

    class LatLngBounds {
      extend(latLng: { lat: number; lng: number }): void;
    }

    enum SymbolPath {
      CIRCLE
    }
  }

  interface Window {
    google?: {
      accounts?: {
        id?: {
          disableAutoSelect?: () => void;
          revoke?: (
            hint: string,
            callback: (done: { successful?: boolean; error?: string }) => void
          ) => void;
        };
      };
      maps?: typeof google.maps;
    };
  }
}
