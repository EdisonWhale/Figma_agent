/**
 * Plugin Constants
 * Centralized location for all plugin constants
 */

// Import shared constants from common package
import { WS_MESSAGE_TYPES, CONNECTION_STATUS } from "common/index";

// Re-export shared constants
export { WS_MESSAGE_TYPES, CONNECTION_STATUS };

// UI Configuration
export const UI_CONFIG = {
  WINDOW_WIDTH: 320,
  WINDOW_HEIGHT: 480,
  TEXTAREA_ROWS: 4,
} as const;

// WebSocket Configuration
export const WS_CONFIG = {
  RECONNECT_MAX_ATTEMPTS: 5,
  RECONNECT_INITIAL_DELAY: 1000, // 1 second
  RECONNECT_MAX_DELAY: 30000, // 30 seconds
} as const;

// Message Limits
export const MESSAGE_LIMITS = {
  MAX_LENGTH: 10000,
  MIN_LENGTH: 1,
} as const;

// Connection Status and WebSocket Message Types are imported from common package above

// CSS Class Names
export const CSS_CLASSES = {
  BUBBLE: "bubble",
  USER: "user",
  AI: "ai",
  STREAMING: "streaming",
  TYPING_INDICATOR: "typingIndicator",
  CONNECTION_STATUS: "connectionStatus",
  STATUS_DOT: "statusDot",
  STATUS_TEXT: "statusText",
  STATUS_CONNECTING: "statusConnecting",
  STATUS_CONNECTED: "statusConnected",
  STATUS_ERROR: "statusError",
  STATUS_DISCONNECTED: "statusDisconnected",
} as const;

// Keyboard Keys
export const KEYS = {
  ENTER: "Enter",
  SHIFT: "Shift",
  CONTROL: "Control",
  META: "Meta", // Command key on Mac
} as const;

// Helper function to detect platform
export const getPlatform = (): "mac" | "windows" | "other" => {
  if (typeof navigator !== "undefined") {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("mac")) return "mac";
    if (platform.includes("win")) return "windows";
  }
  return "other";
};

// Helper function to check if send key combination is pressed
export const isSendKeyPressed = (event: KeyboardEvent): boolean => {
  const platform = getPlatform();
  const isEnter = event.key === KEYS.ENTER;
  
  if (platform === "mac") {
    // On Mac: Command + Return
    return isEnter && event.metaKey && !event.shiftKey && !event.ctrlKey;
  } else {
    // On Windows/Linux: Ctrl + Enter
    return isEnter && event.ctrlKey && !event.shiftKey && !event.metaKey;
  }
};

// Helper function to get the send shortcut text
export const getSendShortcutText = (): string => {
  const platform = getPlatform();
  return platform === "mac" ? "Cmd+Return" : "Ctrl+Enter";
};

// Default Messages
export const DEFAULT_MESSAGES = {
  INITIAL_PROMPT: "Send a message to start chatting.",
  CONNECTING: "Connecting...",
  CONNECTION_LOST: "Error: Cannot send message, connection lost.",
  CONNECTION_FAILED:
    "Connection failed. Please try refreshing the plugin later.",
  PLACEHOLDER_CONNECTED: `Send a message (${getSendShortcutText()} to send, Shift+Enter for newline)`,
  PLACEHOLDER_CONNECTING: "Connecting...",
} as const;
