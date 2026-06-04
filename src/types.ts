export type OrderInitiation = {
  order_intent_id: string;
  user_id?: string | null;
  /** Coordinator dashboard only — email of the donor who registered this intent. */
  donor_email?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_label?: string | null;
  locality_key?: string | null;
  pack_id: string;
  status: string;
  has_reference_photo: boolean;
  reference_photo_artifact_id?: string;
  reference_photo_view_url?: string;
  reference_photo_thumbnail_url?: string;
  verbal_handover_notes: string;
  presets_snapshot: Array<{
    restaurant_name?: string;
    app_name?: string;
    order_url?: string;
    menu_items?: string;
  }>;
  selected_preset: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  /** Handover completion time when set (often null until delivery-partner flow). */
  delivered_at?: string | null;
  /** Metres from viewer when neighbourhood `near_lat` / `near_lng` were sent. */
  distance_m?: number | null;
};

export type ConnectionSettings = {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
};
