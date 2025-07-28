/**
 * Performance Monitoring Utilities
 * Tools for measuring and monitoring application performance
 */
import { logger } from "./logger";

// Performance Timer Class
export class PerformanceTimer {
  private startTime: number;
  private endTime?: number;
  private label: string;
  private metadata: Record<string, any>;

  constructor(label: string, metadata: Record<string, any> = {}) {
    this.label = label;
    this.metadata = metadata;
    this.startTime = performance.now();
  }

  public end(): number {
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    logger.debug(
      {
        operation: this.label,
        duration: `${duration.toFixed(2)}ms`,
        ...this.metadata,
      },
      `[Performance] ${this.label} completed`
    );

    return duration;
  }

  public getDuration(): number | null {
    if (this.endTime) {
      return this.endTime - this.startTime;
    }
    return performance.now() - this.startTime;
  }
}

// Performance Decorator
export function measurePerformance(label?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const operationLabel = label || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const timer = new PerformanceTimer(operationLabel, {
        className: target.constructor.name,
        methodName: propertyName,
        argsCount: args.length,
      });

      try {
        const result = await method.apply(this, args);
        timer.end();
        return result;
      } catch (error) {
        const duration = timer.getDuration();
        logger.error(
          {
            operation: operationLabel,
            duration: `${duration?.toFixed(2)}ms`,
            error: error instanceof Error ? error.message : String(error),
          },
          `[Performance] ${operationLabel} failed`
        );
        throw error;
      }
    };

    return descriptor;
  };
}

// Memory Usage Monitor
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private intervalId?: NodeJS.Timeout;
  private isMonitoring = false;

  public static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  public startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    this.logMemoryUsage();

    this.intervalId = setInterval(() => {
      this.logMemoryUsage();
    }, intervalMs);

    logger.info(
      { intervalMs },
      "[Performance] Memory monitoring started"
    );
  }

  public stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    this.isMonitoring = false;
    logger.info({}, "[Performance] Memory monitoring stopped");
  }

  public getMemoryUsage(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }

  private logMemoryUsage(): void {
    const usage = this.getMemoryUsage();
    const formatBytes = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

    logger.debug(
      {
        memory: {
          rss: formatBytes(usage.rss),
          heapTotal: formatBytes(usage.heapTotal),
          heapUsed: formatBytes(usage.heapUsed),
          external: formatBytes(usage.external),
          arrayBuffers: formatBytes(usage.arrayBuffers),
        },
      },
      "[Performance] Memory usage report"
    );
  }
}

// Request Performance Tracker
export class RequestTracker {
  private static activeRequests = new Map<string, PerformanceTimer>();

  public static startRequest(requestId: string, metadata: Record<string, any> = {}): void {
    const timer = new PerformanceTimer(`Request-${requestId}`, {
      requestId,
      ...metadata,
    });
    
    this.activeRequests.set(requestId, timer);
  }

  public static endRequest(requestId: string): number | null {
    const timer = this.activeRequests.get(requestId);
    if (timer) {
      const duration = timer.end();
      this.activeRequests.delete(requestId);
      return duration;
    }
    return null;
  }

  public static getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  public static getActiveRequests(): string[] {
    return Array.from(this.activeRequests.keys());
  }
}

// Performance Metrics Collector
export class MetricsCollector {
  private static metrics = new Map<string, number[]>();

  public static recordMetric(name: string, value: number): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    const values = this.metrics.get(name)!;
    values.push(value);
    
    // Keep only last 100 values to prevent memory leak
    if (values.length > 100) {
      values.shift();
    }
  }

  public static getMetricStats(name: string): {
    count: number;
    min: number;
    max: number;
    avg: number;
    latest: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) {
      return null;
    }

    const count = values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / count;
    const latest = values[values.length - 1];

    return { count, min, max, avg, latest };
  }

  public static getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    
    for (const [name] of this.metrics) {
      result[name] = this.getMetricStats(name);
    }
    
    return result;
  }

  public static clearMetrics(): void {
    this.metrics.clear();
  }
}

// Utility Functions
export function measureAsync<T>(
  operation: () => Promise<T>,
  label: string,
  metadata: Record<string, any> = {}
): Promise<T> {
  const timer = new PerformanceTimer(label, metadata);
  
  return operation()
    .then((result) => {
      timer.end();
      return result;
    })
    .catch((error) => {
      const duration = timer.getDuration();
      logger.error(
        {
          operation: label,
          duration: `${duration?.toFixed(2)}ms`,
          error: error instanceof Error ? error.message : String(error),
          ...metadata,
        },
        `[Performance] ${label} failed`
      );
      throw error;
    });
}

export function measureSync<T>(
  operation: () => T,
  label: string,
  metadata: Record<string, any> = {}
): T {
  const timer = new PerformanceTimer(label, metadata);
  
  try {
    const result = operation();
    timer.end();
    return result;
  } catch (error) {
    const duration = timer.getDuration();
    logger.error(
      {
        operation: label,
        duration: `${duration?.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error),
        ...metadata,
      },
      `[Performance] ${label} failed`
    );
    throw error;
  }
}
