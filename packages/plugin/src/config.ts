import { WS_CONFIG } from "./constants";

export type Environment = "development" | "production";

/**
 * Environment Configuration Manager
 * Provides flexible environment detection and configuration management
 */
class ConfigManager {
  private _environment: Environment;
  
  constructor() {
    this._environment = this.detectEnvironment();
  }

  /**
   * Detect current environment based on available indicators
   */
  private detectEnvironment(): Environment {
    // Check for explicit environment override (could be set by build tools)
    if (typeof window !== 'undefined' && (window as any).__PLUGIN_ENV__) {
      return (window as any).__PLUGIN_ENV__ as Environment;
    }
    
    // Check hostname indicators
    if (typeof window !== 'undefined' && window.location) {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'development';
      }
    }
    
    // Check for development indicators in URLs
    const devIndicators = ['localhost', '127.0.0.1', 'dev', 'staging'];
    if (typeof window !== 'undefined' && window.location) {
      const url = window.location.href.toLowerCase();
      if (devIndicators.some(indicator => url.includes(indicator))) {
        return 'development';
      }
    }
    
    // Default to production for safety
    return 'production';
  }

  /**
   * Get current environment
   */
  get environment(): Environment {
    return this._environment;
  }

  /**
   * Check if in development mode
   */
  get isDevelopment(): boolean {
    return this._environment === 'development';
  }

  /**
   * Check if in production mode
   */
  get isProduction(): boolean {
    return this._environment === 'production';
  }

  /**
   * Get API base URL based on environment
   */
  get apiBaseUrl(): string {
    return this.isDevelopment 
      ? this.getEnvVar('API_URL', 'http://localhost:3000')
      : this.getEnvVar('API_URL', 'https://figchat-api.herokuapp.com'); // Better default than temp.com
  }

  /**
   * Get WebSocket base URL based on environment
   */
  get wsBaseUrl(): string {
    return this.isDevelopment
      ? this.getEnvVar('WS_URL', 'ws://localhost:3000')
      : this.getEnvVar('WS_URL', 'wss://figchat-api.herokuapp.com'); // Better default than temp.com
  }

  /**
   * Get environment variable with fallback
   */
  private getEnvVar(key: string, fallback: string): string {
    // Try multiple sources for environment variables
    const sources = [
      () => (window as any).__PLUGIN_CONFIG__?.[key],
      () => (window as any).process?.env?.[key],
      () => (globalThis as any).__ENV__?.[key]
    ];

    for (const source of sources) {
      try {
        const value = source();
        if (typeof value === 'string' && value.trim()) {
          return value.trim();
        }
      } catch (error) {
        // Ignore and try next source
      }
    }

    return fallback;
  }

  /**
   * Override environment (useful for testing)
   */
  setEnvironment(env: Environment): void {
    this._environment = env;
    console.log(`[ConfigManager] Environment overridden to: ${env}`);
  }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export configuration object
export const config = {
  environment: configManager.environment,
  isDevelopment: configManager.isDevelopment,
  isProduction: configManager.isProduction,
  apiBaseUrl: configManager.apiBaseUrl,
  wsBaseUrl: configManager.wsBaseUrl,
  reconnectMaxAttempts: WS_CONFIG.RECONNECT_MAX_ATTEMPTS,
  reconnectInitialDelay: WS_CONFIG.RECONNECT_INITIAL_DELAY,
  reconnectMaxDelay: WS_CONFIG.RECONNECT_MAX_DELAY,
};

// Export config manager for advanced usage
export { configManager };

// Log configuration in development
if (configManager.isDevelopment) {
  console.log("[Plugin Config] Configuration loaded:", {
    environment: config.environment,
    api: config.apiBaseUrl,
    ws: config.wsBaseUrl,
    reconnect: {
      maxAttempts: config.reconnectMaxAttempts,
      initialDelay: config.reconnectInitialDelay,
      maxDelay: config.reconnectMaxDelay,
    }
  });
}
