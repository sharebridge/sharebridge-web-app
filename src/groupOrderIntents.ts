import type { OrderInitiation } from "./types";

export type OrderGroupMode = "donor" | "day" | "city";

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

/** Placeholder until order intents carry a city field from the API. */
export function cityGroupLabel(_intent: OrderInitiation): string {
  return "City (coming soon)";
}

function groupKey(intent: OrderInitiation, mode: OrderGroupMode): string {
  switch (mode) {
    case "donor":
      return intent.user_id?.trim() || "__unknown_donor__";
    case "day":
      return dayGroupLabel(intent);
    case "city":
      return "__city_pending__";
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
    case "city":
      return cityGroupLabel(intent);
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
  const sorted = [...intents].sort(compareNewestFirst);
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
  } else if (mode === "donor") {
    groups.sort((a, b) => a.label.localeCompare(b.label));
  }
  return groups;
}
