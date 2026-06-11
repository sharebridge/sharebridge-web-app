/** Initiator-facing integration-service routes (legacy `/v1/donor-*` still accepted). */
export const ORDER_INTENTS_PATH = "/v1/order-intents";

export const INITIATOR_SETUP = {
  suggestVendors: "/v1/initiator-setup/suggest-vendors",
  preferences: "/v1/initiator-setup/preferences",
  preferencesDeleteItem: "/v1/initiator-setup/preferences/delete-item"
} as const;

export const INSTRUCTION_PACK_PATH = "/v1/instruction-pack";
