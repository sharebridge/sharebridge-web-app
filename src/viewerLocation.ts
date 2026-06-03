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
