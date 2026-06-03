export type ViewerCoords = {
  lat: number;
  lng: number;
};

export async function readViewerLocation(): Promise<ViewerCoords | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 120_000 }
    );
  });
}
