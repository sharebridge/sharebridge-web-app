export type ViewerCoords = {
  lat: number;
  lng: number;
};

export type ViewerLocationFailureReason =
  | "unsupported"
  | "denied"
  | "timeout"
  | "error";

export type ViewerLocationResult =
  | { status: "granted"; coords: ViewerCoords }
  | { status: "unavailable"; reason: ViewerLocationFailureReason };

const STORAGE_KEY = "sb_viewer_coords";

export function loadCachedViewerCoords(): ViewerCoords | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as { lat?: unknown; lng?: unknown };
    if (
      typeof parsed.lat === "number" &&
      typeof parsed.lng === "number" &&
      Number.isFinite(parsed.lat) &&
      Number.isFinite(parsed.lng)
    ) {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    return null;
  }
  return null;
}

export function cacheViewerCoords(coords: ViewerCoords): void {
  if (typeof sessionStorage === "undefined") {
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(coords));
}

export async function readViewerLocation(): Promise<ViewerLocationResult> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return { status: "unavailable", reason: "unsupported" };
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "granted",
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
        });
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? "denied"
            : error.code === error.TIMEOUT
              ? "timeout"
              : "error";
        resolve({ status: "unavailable", reason });
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
    );
  });
}
