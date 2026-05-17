export type OrderInitiation = {
  order_intent_id: string;
  pack_id: string;
  status: string;
  has_reference_photo: boolean;
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
};

export type ConnectionSettings = {
  apiBaseUrl: string;
  authToken: string;
  userId: string;
};
