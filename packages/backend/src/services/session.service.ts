/**
 * Session Service
 * Manages user sessions and chat history
 */
import { randomUUID } from "crypto";
import { BackendChatMessage } from "../types/chat.types";
import { logger } from "@utils/logger";
import { SESSION_CONFIG } from "@constants/index";

export interface CreatedElement {
  id: string;
  type: string;
  text?: string;
  color?: string;
  x?: number;
  y?: number;
  createdAt: number;
  toolCall: string; // The tool call that created this element
}

export interface SessionData {
  previousResponseId: string | null;
  chatHistory: BackendChatMessage[];
  lastAccessed: number;
  recentElements: CreatedElement[]; // Track recently created elements
}

export class SessionService {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private sessionLocks = new Map<string, Promise<void>>(); // Session-level locks

  constructor() {
    this.setupSessionCleanup();
  }

  /**
   * Execute operation with session lock to prevent race conditions
   */
  private async withSessionLock<T>(sessionId: string, operation: () => Promise<T> | T): Promise<T> {
    // Wait for any existing lock on this session
    const existingLock = this.sessionLocks.get(sessionId);
    if (existingLock) {
      await existingLock;
    }

    // Create new lock for this operation
    const lockPromise = (async () => {
      try {
        return await operation();
      } finally {
        // Remove lock when operation completes
        this.sessionLocks.delete(sessionId);
      }
    })();

    this.sessionLocks.set(sessionId, lockPromise.then(() => {})); // Store as Promise<void>
    return await lockPromise;
  }

  /**
   * Get existing session or create a new one
   */
  public getOrCreateSession(requestedSessionId?: string): {
    sessionId: string;
    sessionData: SessionData;
    isNewSession: boolean;
  } {
    let sessionId = requestedSessionId;
    let isNewSession = false;
    let sessionData: SessionData | undefined = undefined;

    // Try to get existing session
    if (sessionId) {
      sessionData = this.sessions.get(sessionId);
      if (sessionData && this.isSessionValid(sessionData)) {
        sessionData.lastAccessed = Date.now();
        logger.debug({ sessionId }, "[Session] Existing session retrieved");
        return { sessionId, sessionData, isNewSession };
      } else {
        logger.debug(
          { sessionId },
          "[Session] Requested session invalid or expired"
        );
      }
    }

    // Create new session
    sessionId = randomUUID();
    sessionData = {
      previousResponseId: null,
      chatHistory: [],
      lastAccessed: Date.now(),
      recentElements: [], // Initialize empty array for tracking created elements
    };

    this.sessions.set(sessionId, sessionData);
    isNewSession = true;

    logger.info({ sessionId }, "[Session] New session created");
    return { sessionId, sessionData, isNewSession };
  }

  /**
   * Update session with new response data
   */
  public updateSession(
    sessionId: string,
    responseId: string,
    message: BackendChatMessage
  ): void {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.previousResponseId = responseId;
      sessionData.chatHistory.push(message);
      sessionData.lastAccessed = Date.now();

      logger.trace(
        { sessionId, historyLength: sessionData.chatHistory.length },
        "[Session] Session updated"
      );
    } else {
      logger.warn(
        { sessionId },
        "[Session] Attempted to update non-existent session"
      );
    }
  }

  /**
   * Add message to session history
   */
  public addMessageToSession(
    sessionId: string,
    message: BackendChatMessage
  ): void {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData) {
      sessionData.chatHistory.push(message);
      sessionData.lastAccessed = Date.now();

      logger.trace(
        { sessionId, messageRole: message.role },
        "[Session] Message added to session"
      );
    } else {
      logger.warn(
        { sessionId },
        "[Session] Attempted to add message to non-existent session"
      );
    }
  }

  /**
   * Get session data
   */
  public getSession(sessionId: string): SessionData | null {
    const sessionData = this.sessions.get(sessionId);
    if (sessionData && this.isSessionValid(sessionData)) {
      sessionData.lastAccessed = Date.now();
      return sessionData;
    }
    return null;
  }

  /**
   * Delete session
   */
  public deleteSession(sessionId: string): boolean {
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      logger.info({ sessionId }, "[Session] Session deleted");
    }
    return deleted;
  }

  /**
   * Get active session count
   */
  public getActiveSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Check if session is still valid
   */
  private isSessionValid(sessionData: SessionData): boolean {
    const now = Date.now();
    return now - sessionData.lastAccessed < SESSION_CONFIG.TTL;
  }

  /**
   * Setup automatic session cleanup
   */
  private setupSessionCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, SESSION_CONFIG.CLEANUP_INTERVAL);

    logger.info(
      {
        intervalMs: SESSION_CONFIG.CLEANUP_INTERVAL,
        ttlMs: SESSION_CONFIG.TTL,
      },
      "[Session] Cleanup task started"
    );
  }

  /**
   * Add a recently created element to session (thread-safe)
   */
  public async addCreatedElement(sessionId: string, element: Omit<CreatedElement, 'createdAt'>): Promise<void> {
    await this.withSessionLock(sessionId, () => {
      const session = this.sessions.get(sessionId);
      if (session) {
        const createdElement: CreatedElement = {
          ...element,
          createdAt: Date.now(),
        };
        
        // Add to recent elements (keep only last 10 elements)
        session.recentElements.push(createdElement);
        if (session.recentElements.length > 10) {
          session.recentElements = session.recentElements.slice(-10);
        }
        
        session.lastAccessed = Date.now();
        
        logger.info(
          { sessionId, elementId: element.id, type: element.type },
          "[Session] Element added to session with lock"
        );
      } else {
        logger.warn(
          { sessionId, elementId: element.id },
          "[Session] Attempted to add element to non-existent session"
        );
      }
    });
  }

  /**
   * Get recent elements from session, optionally filtered by type or text
   */
  public getRecentElements(
    sessionId: string, 
    filter?: { type?: string; text?: string; limit?: number }
  ): CreatedElement[] {
    const session = this.sessions.get(sessionId);
    if (!session) return [];

    let elements = [...session.recentElements];
    
    // Filter by type
    if (filter?.type) {
      elements = elements.filter(el => el.type.toLowerCase() === filter.type?.toLowerCase());
    }
    
    // Filter by text (partial match)
    if (filter?.text) {
      elements = elements.filter(el => 
        el.text?.toLowerCase().includes(filter.text?.toLowerCase() || '')
      );
    }
    
    // Sort by creation time (newest first)
    elements.sort((a, b) => b.createdAt - a.createdAt);
    
    // Limit results
    if (filter?.limit) {
      elements = elements.slice(0, filter.limit);
    }
    
    return elements;
  }

  /**
   * Get the most recently created element, optionally filtered
   */
  public getMostRecentElement(
    sessionId: string,
    filter?: { type?: string; text?: string }
  ): CreatedElement | null {
    const elements = this.getRecentElements(sessionId, { ...filter, limit: 1 });
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, sessionData] of this.sessions.entries()) {
      if (!this.isSessionValid(sessionData)) {
        this.sessions.delete(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(
        { cleanedCount, remainingCount: this.sessions.size },
        "[Session] Expired sessions cleaned up"
      );
    }
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    logger.info({}, "[Session] Service destroyed");
  }
}
