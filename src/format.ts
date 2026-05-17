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
