import { WS_CONFIG } from "./constants";

export type Environment = "development" | "production";

// --- Configuration ---
const IS_PRODUCTION_BUILD = false;

const DEV_API_URL = "http://localhost:3000";
const DEV_WS_URL = "ws://localhost:3000";

const PROD_API_URL = "https://temp.com";
const PROD_WS_URL = "wss://temp.com";

export const config = {
  apiBaseUrl: IS_PRODUCTION_BUILD ? PROD_API_URL : DEV_API_URL,
  wsBaseUrl: IS_PRODUCTION_BUILD ? PROD_WS_URL : DEV_WS_URL,
  reconnectMaxAttempts: WS_CONFIG.RECONNECT_MAX_ATTEMPTS,
  reconnectInitialDelay: WS_CONFIG.RECONNECT_INITIAL_DELAY,
  reconnectMaxDelay: WS_CONFIG.RECONNECT_MAX_DELAY,
};

console.log("[Plugin Config] Using Base URLs:", {
  api: config.apiBaseUrl,
  ws: config.wsBaseUrl,
});
