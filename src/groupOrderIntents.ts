import type { OrderInitiation } from "./types";

export type OrderGroupMode = "donor" | "day" | "locality";

export type OrderIntentGroup = {
  key: string;
  label: string;
  /** Full donor line for tooltip when label is shortened (email only). */
  title?: string;
  intents: OrderInitiation[];
};

function sortTime(intent: OrderInitiation): number {
  const raw = intent.updated_at || intent.created_at;
  const ms = raw ? Date.parse(raw) : Number.NaN;
  return Number.isNaN(ms) ? 0 : ms;
}

function compareNewestFirst(a: OrderInitiation, b: OrderInitiation): number {
  return sortTime(b) - sortTime(a);
}

function compareListOrder(a: OrderInitiation, b: OrderInitiation): number {
  const da = a.distance_m;
  const db = b.distance_m;
  if (typeof da === "number" && typeof db === "number" && da !== db) {
    return da - db;
  }
  if (typeof da === "number" && typeof db !== "number") {
    return -1;
  }
  if (typeof da !== "number" && typeof db === "number") {
    return 1;
  }
  return compareNewestFirst(a, b);
}

export function dayGroupLabel(intent: OrderInitiation): string {
  const raw = intent.updated_at || intent.created_at;
  if (!raw) {
    return "Unknown date";
  }
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/** Short single-line label for group headers (full detail in title tooltip + list rows). */
export function donorGroupLabel(intent: OrderInitiation): string {
  const id = intent.user_id?.trim();
  const email = intent.donor_email?.trim();
  if (email) {
    return email;
  }
  return id ? `Donor ${id}` : "Unknown donor";
}

export function donorGroupTitle(intent: OrderInitiation): string {
  const id = intent.user_id?.trim();
  const email = intent.donor_email?.trim();
  if (email && id) {
    return `${email} (${id})`;
  }
  return donorGroupLabel(intent);
}

export const NO_LOCATION_GROUP_KEY = "__no_location__";

export function localityGroupLabel(intent: OrderInitiation): string {
  const label = intent.location_label?.trim();
  if (label) {
    return label;
  }
  const key = intent.locality_key?.trim();
  if (key) {
    return `Area ${key}`;
  }
  return "No location on record";
}

function groupKey(intent: OrderInitiation, mode: OrderGroupMode): string {
  switch (mode) {
    case "donor":
      return intent.user_id?.trim() || "__unknown_donor__";
    case "day":
      return dayGroupLabel(intent);
    case "locality":
      return intent.locality_key?.trim() || NO_LOCATION_GROUP_KEY;
    default:
      return "all";
  }
}

function groupLabel(intent: OrderInitiation, mode: OrderGroupMode): string {
  switch (mode) {
    case "donor":
      return donorGroupLabel(intent);
    case "day":
      return dayGroupLabel(intent);
    case "locality":
      return localityGroupLabel(intent);
    default:
      return "All";
  }
}

function groupTitle(intent: OrderInitiation, mode: OrderGroupMode): string | undefined {
  if (mode === "donor") {
    const full = donorGroupTitle(intent);
    return full !== donorGroupLabel(intent) ? full : undefined;
  }
  return undefined;
}

export function groupOrderIntents(
  intents: OrderInitiation[],
  mode: OrderGroupMode
): OrderIntentGroup[] {
  const sorted = [...intents].sort(compareListOrder);
  const buckets = new Map<string, OrderIntentGroup>();

  for (const intent of sorted) {
    const key = groupKey(intent, mode);
    const existing = buckets.get(key);
    if (existing) {
      existing.intents.push(intent);
      continue;
    }
    buckets.set(key, {
      key,
      label: groupLabel(intent, mode),
      title: groupTitle(intent, mode),
      intents: [intent]
    });
  }

  const groups = [...buckets.values()];
  if (mode === "day") {
    groups.sort((a, b) => sortTime(b.intents[0]) - sortTime(a.intents[0]));
  } else if (mode === "donor" || mode === "locality") {
    groups.sort((a, b) => a.label.localeCompare(b.label));
  }
  return groups;
}
