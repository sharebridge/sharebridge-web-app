import type { OrderInitiation } from "./types";

export function formatElapsedSince(
  iso: string | undefined,
  nowMs: number = Date.now()
): string {
  if (!iso?.trim()) {
    return "—";
  }
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return "—";
  }
  const diff = Math.max(0, nowMs - ms);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) {
    return "just now";
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function formatDistanceM(
  distance_m: number | null | undefined
): string {
  if (typeof distance_m !== "number" || !Number.isFinite(distance_m)) {
    return "—";
  }
  return `${Math.round(distance_m)} m`;
}

export function formatWhen(iso: string | undefined): string {
  if (!iso) {
    return "—";
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString();
}

export function paymentStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) {
    return "pending";
  }
  return status.replace(/_/g, " ");
}

export function statusLabel(status: string | null | undefined): string {
  if (!status?.trim()) {
    return "unknown";
  }
  return status.replace(/_/g, " ");
}

/** Coordinator list/detail: donor who registered the intent (not the signed-in viewer). */
export function formatDonorMeta(
  userId: string | null | undefined,
  donorEmail: string | null | undefined
): string | null {
  const id = userId?.trim();
  const email = donorEmail?.trim();
  if (email && id) {
    return `${email} · ${id}`;
  }
  if (email) {
    return email;
  }
  if (id) {
    return `Donor ${id}`;
  }
  return null;
}

export function primaryRestaurant(intent: OrderInitiation): string | null {
  const selected = intent.selected_preset;
  if (selected && typeof selected.restaurant_name === "string") {
    const name = selected.restaurant_name.trim();
    if (name) {
      return name;
    }
  }
  const snapshot = Array.isArray(intent.presets_snapshot)
    ? intent.presets_snapshot
    : [];
  for (const row of snapshot) {
    const name = row.restaurant_name?.trim();
    if (name) {
      return name;
    }
  }
  return null;
}
