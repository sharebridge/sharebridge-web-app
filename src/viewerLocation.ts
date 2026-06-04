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

/** Always requests a new fix from the device (no session cache, maximumAge 0). */
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
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 }
    );
  });
}

export function locationRequiredMessage(
  reason: ViewerLocationFailureReason
): string {
  switch (reason) {
    case "denied":
      return "Location is required for By area. Allow location access for this site in your browser settings, then try again.";
    case "timeout":
      return "Location is required for By area. Your device did not respond in time — try again outdoors or with GPS enabled.";
    case "unsupported":
      return "Location is required for By area. This browser cannot provide your position.";
    default:
      return "Location is required for By area. Your position could not be read — try again.";
  }
}
