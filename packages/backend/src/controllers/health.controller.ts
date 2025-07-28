/**
 * Health Check Controller
 * Handles health check endpoints and system status reporting
 */
import { Request, Response } from "express";
import { SessionService } from "@services/session.service";
import { logger } from "@utils/logger";
import { HTTP_STATUS } from "@constants/index";
import {
  MetricsCollector,
  RequestTracker,
  MemoryMonitor,
} from "@utils/performance.utils";

export class HealthController {
  private sessionService: SessionService;

  constructor() {
    this.sessionService = new SessionService();
  }

  /**
   * Get system health status
   */
  public async getHealthStatus(_req: Request, res: Response): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const uptime = process.uptime();
      const activeSessions = this.sessionService.getActiveSessionCount();
      const activeRequests = RequestTracker.getActiveRequestCount();

      const healthStatus = {
        status: "ok",
        version: process.env.npm_package_version || "unknown",
        uptime: this.formatUptime(uptime),
        memory: {
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        },
        sessions: {
          active: activeSessions,
        },
        requests: {
          active: activeRequests,
        },
        environment: process.env.NODE_ENV || "unknown",
        timestamp: new Date().toISOString(),
      };

      logger.debug({ status: "ok" }, "Health check successful");
      res.status(HTTP_STATUS.OK).json(healthStatus);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Error during health check"
      );

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        status: "error",
        message: "Health check failed",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Get detailed system metrics
   */
  public async getMetrics(_req: Request, res: Response): Promise<void> {
    try {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      const uptime = process.uptime();
      const activeSessions = this.sessionService.getActiveSessionCount();
      const activeRequests = RequestTracker.getActiveRequestCount();
      const performanceMetrics = MetricsCollector.getAllMetrics();

      const metrics = {
        system: {
          uptime: uptime,
          memory: memoryUsage,
          cpu: cpuUsage,
          platform: process.platform,
          nodeVersion: process.version,
        },
        application: {
          sessions: {
            active: activeSessions,
          },
          requests: {
            active: activeRequests,
            activeRequestIds: RequestTracker.getActiveRequests(),
          },
          performance: performanceMetrics,
          environment: process.env.NODE_ENV || "unknown",
        },
        timestamp: new Date().toISOString(),
      };

      logger.debug(
        { metricsCount: Object.keys(performanceMetrics).length },
        "System metrics requested"
      );
      res.status(HTTP_STATUS.OK).json(metrics);
    } catch (error) {
      logger.error(
        { error: error instanceof Error ? error.message : String(error) },
        "Error retrieving system metrics"
      );

      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: "Failed to retrieve system metrics",
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Format uptime in human-readable format
   */
  private formatUptime(uptime: number): string {
    const hours = Math.floor(uptime / 60 / 60);
    const minutes = Math.floor((uptime / 60) % 60);
    const seconds = Math.floor(uptime % 60);
    return `${hours}h ${minutes}m ${seconds}s`;
  }
}
