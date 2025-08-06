/**
 * Typed Error Handling System
 * Provides comprehensive error classification and recovery strategies
 */

// Base error types
export type PluginErrorType = 
  | 'connection'
  | 'authentication' 
  | 'api'
  | 'timeout'
  | 'validation'
  | 'figma_api'
  | 'websocket'
  | 'configuration'
  | 'unknown';

// Error severity levels
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

// Recovery action types
export type RecoveryAction = 
  | 'retry'
  | 'reconnect' 
  | 'refresh'
  | 'reconfigure'
  | 'manual'
  | 'none';

/**
 * Comprehensive error interface
 */
export interface PluginError {
  id: string;
  type: PluginErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string; // User-friendly message
  details?: Record<string, any>;
  recoveryAction?: RecoveryAction;
  recoveryHandler?: () => void | Promise<void>;
  timestamp: number;
  context?: string; // Where the error occurred
}

/**
 * Error recovery strategies
 */
export interface ErrorRecoveryStrategy {
  action: RecoveryAction;
  label: string;
  description: string;
  handler: () => void | Promise<void>;
  isAutomatic?: boolean;
  maxAttempts?: number;
}

/**
 * Error handling callbacks
 */
export interface ErrorHandlerCallbacks {
  onError: (error: PluginError) => void;
  onRecovery: (error: PluginError, strategy: ErrorRecoveryStrategy) => void;
  onRecoverySuccess: (error: PluginError) => void;
  onRecoveryFailure: (error: PluginError, reason: string) => void;
}

/**
 * Error factory for creating typed errors
 */
export class PluginErrorFactory {
  private static generateId(): string {
    return `error-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Create connection error
   */
  static connection(
    message: string, 
    details?: Record<string, any>,
    recoveryHandler?: () => void | Promise<void>
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'connection',
      severity: 'high',
      message,
      userMessage: 'Connection lost. Trying to reconnect...',
      details,
      recoveryAction: 'reconnect',
      recoveryHandler,
      timestamp: Date.now(),
      context: 'WebSocket'
    };
  }

  /**
   * Create API error
   */
  static api(
    message: string,
    statusCode?: number,
    details?: Record<string, any>
  ): PluginError {
    const severity: ErrorSeverity = statusCode && statusCode >= 500 ? 'high' : 'medium';
    const userMessage = statusCode && statusCode >= 500 
      ? 'Server error occurred. Please try again later.'
      : 'Request failed. Please check your input and try again.';

    return {
      id: this.generateId(),
      type: 'api',
      severity,
      message,
      userMessage,
      details: { ...details, statusCode },
      recoveryAction: 'retry',
      timestamp: Date.now(),
      context: 'API'
    };
  }

  /**
   * Create timeout error
   */
  static timeout(
    operation: string,
    timeoutMs: number,
    retryHandler?: () => void | Promise<void>
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'timeout',
      severity: 'medium',
      message: `Operation '${operation}' timed out after ${timeoutMs}ms`,
      userMessage: 'Request took too long. Please try again.',
      details: { operation, timeoutMs },
      recoveryAction: 'retry',
      recoveryHandler: retryHandler,
      timestamp: Date.now(),
      context: operation
    };
  }

  /**
   * Create Figma API error
   */
  static figmaAPI(
    action: string,
    message: string,
    details?: Record<string, any>
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'figma_api',
      severity: 'high',
      message: `Figma API error in ${action}: ${message}`,
      userMessage: 'Failed to interact with Figma. Please try again.',
      details: { action, ...details },
      recoveryAction: 'retry',
      timestamp: Date.now(),
      context: 'Figma API'
    };
  }

  /**
   * Create validation error
   */
  static validation(
    field: string,
    value: any,
    reason: string
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'validation',
      severity: 'low',
      message: `Validation failed for ${field}: ${reason}`,
      userMessage: `Please check your input for ${field}.`,
      details: { field, value, reason },
      recoveryAction: 'manual',
      timestamp: Date.now(),
      context: 'Validation'
    };
  }

  /**
   * Create WebSocket error
   */
  static websocket(
    event: string,
    message: string,
    reconnectHandler?: () => void | Promise<void>
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'websocket',
      severity: 'high',
      message: `WebSocket ${event}: ${message}`,
      userMessage: 'Connection error occurred. Attempting to reconnect...',
      details: { event },
      recoveryAction: 'reconnect',
      recoveryHandler: reconnectHandler,
      timestamp: Date.now(),
      context: 'WebSocket'
    };
  }

  /**
   * Create configuration error
   */
  static configuration(
    key: string,
    message: string
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'configuration',
      severity: 'critical',
      message: `Configuration error for ${key}: ${message}`,
      userMessage: 'Plugin configuration error. Please check settings.',
      details: { key },
      recoveryAction: 'reconfigure',
      timestamp: Date.now(),
      context: 'Configuration'
    };
  }

  /**
   * Create unknown error
   */
  static unknown(
    message: string,
    originalError?: Error,
    context?: string
  ): PluginError {
    return {
      id: this.generateId(),
      type: 'unknown',
      severity: 'medium',
      message,
      userMessage: 'An unexpected error occurred. Please try again.',
      details: { 
        originalError: originalError?.message,
        stack: originalError?.stack 
      },
      recoveryAction: 'retry',
      timestamp: Date.now(),
      context: context || 'Unknown'
    };
  }
}

/**
 * Error manager for handling plugin errors
 */
export class PluginErrorManager {
  private errors: Map<string, PluginError> = new Map();
  private callbacks?: ErrorHandlerCallbacks;
  private recoveryAttempts: Map<string, number> = new Map();

  constructor(callbacks?: ErrorHandlerCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Handle an error
   */
  handleError(error: PluginError): void {
    console.error(`[PluginErrorManager] Error occurred:`, error);
    
    this.errors.set(error.id, error);
    this.callbacks?.onError(error);

    // Attempt automatic recovery if available
    if (error.recoveryAction && error.recoveryHandler) {
      this.attemptRecovery(error);
    }
  }

  /**
   * Attempt error recovery
   */
  async attemptRecovery(error: PluginError): Promise<void> {
    const attempts = this.recoveryAttempts.get(error.id) || 0;
    const maxAttempts = 3; // Default max attempts

    if (attempts >= maxAttempts) {
      console.warn(`[PluginErrorManager] Max recovery attempts reached for error ${error.id}`);
      return;
    }

    this.recoveryAttempts.set(error.id, attempts + 1);

    const strategy: ErrorRecoveryStrategy = {
      action: error.recoveryAction!,
      label: this.getRecoveryLabel(error.recoveryAction!),
      description: this.getRecoveryDescription(error.recoveryAction!),
      handler: error.recoveryHandler!,
      isAutomatic: true,
      maxAttempts
    };

    try {
      console.log(`[PluginErrorManager] Attempting recovery for error ${error.id} (attempt ${attempts + 1})`);
      this.callbacks?.onRecovery(error, strategy);
      
      await strategy.handler();
      
      this.callbacks?.onRecoverySuccess(error);
      this.errors.delete(error.id);
      this.recoveryAttempts.delete(error.id);
      
      console.log(`[PluginErrorManager] Recovery successful for error ${error.id}`);
    } catch (recoveryError) {
      const reason = recoveryError instanceof Error ? recoveryError.message : 'Unknown recovery error';
      console.error(`[PluginErrorManager] Recovery failed for error ${error.id}:`, reason);
      this.callbacks?.onRecoveryFailure(error, reason);
    }
  }

  /**
   * Get user-friendly recovery label
   */
  private getRecoveryLabel(action: RecoveryAction): string {
    const labels: Record<RecoveryAction, string> = {
      retry: 'Retry',
      reconnect: 'Reconnect',
      refresh: 'Refresh',
      reconfigure: 'Reconfigure',
      manual: 'Fix Manually',
      none: 'No Action'
    };
    return labels[action];
  }

  /**
   * Get recovery description
   */
  private getRecoveryDescription(action: RecoveryAction): string {
    const descriptions: Record<RecoveryAction, string> = {
      retry: 'Try the operation again',
      reconnect: 'Reconnect to the service',
      refresh: 'Refresh the plugin',
      reconfigure: 'Check plugin configuration',
      manual: 'Manual intervention required',
      none: 'No automatic recovery available'
    };
    return descriptions[action];
  }

  /**
   * Get all active errors
   */
  getActiveErrors(): PluginError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Clear specific error
   */
  clearError(errorId: string): void {
    this.errors.delete(errorId);
    this.recoveryAttempts.delete(errorId);
  }

  /**
   * Clear all errors
   */
  clearAllErrors(): void {
    this.errors.clear();
    this.recoveryAttempts.clear();
  }
}