import type { OrderInitiation } from "./types";

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

export function statusLabel(status: string): string {
  return status.replaceAll("_", " ");
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
  for (const row of intent.presets_snapshot) {
    const name = row.restaurant_name?.trim();
    if (name) {
      return name;
    }
  }
  return null;
}
