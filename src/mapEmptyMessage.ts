import type { OrderInitiation } from "./types";

function hasGeo(intent: OrderInitiation): boolean {
  return (
    typeof intent.location_lat === "number" &&
    Number.isFinite(intent.location_lat) &&
    typeof intent.location_lng === "number" &&
    Number.isFinite(intent.location_lng)
  );
}

export function mapCaption(
  geoCount: number,
  totalCount: number,
  coordinatorView: boolean
): string {
  if (coordinatorView) {
    return `${geoCount} of ${totalCount} initiations with coordinates. Tap a pin to select.`;
  }
  return `${geoCount} of ${totalCount} initiations on the map (your orders only). Tap a pin to select.`;
}

export function mapEmptyMessage(
  intents: OrderInitiation[],
  coordinatorView: boolean,
  viewerUserId: string
): string {
  if (coordinatorView) {
    if (intents.length === 0) {
      return "No initiations yet.";
    }
    return "No initiations with GPS coordinates yet. Register an intent from the mobile app with location enabled.";
  }

  const viewer = viewerUserId.trim();
  const own = intents.filter((row) => row.user_id?.trim() === viewer);
  const ownWithGeo = own.filter(hasGeo);

  if (own.length > 0 && ownWithGeo.length === 0) {
    return "None of your initiations include GPS coordinates. On mobile, allow location when you start an initiation.";
  }
  if (intents.length > 0) {
    return "Map shows pins for your own initiations only. Other initiators' orders appear in List with distance (m); their exact locations are not shown here.";
  }
  return "No initiations in this feed yet. Register from the mobile app or use By area after allowing location.";
}
