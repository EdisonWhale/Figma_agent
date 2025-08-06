/**
 * FigmaAPIClient - Comprehensive Figma API Client
 * Unified interface for AI Agent to interact with Figma/FigJam through MCP protocol
 * Built on top of existing FigmaAPIService architecture
 */

import { FigmaAPIService, FigmaAPIResponse } from './figmaAPI';
import {
  FigmaElement,
  PageInfo,
  NodeType,
  ShapeCreateOptions,
  TextCreateOptions,
  StickyNoteCreateOptions,
  ConnectorCreateOptions,
  ElementUpdateOptions,
  ElementQuery,
  ElementCreationResult,
  ElementDeletionResult,
  ElementUpdateResult,
  BulkOperationResult,
  ElementStatistics,
  OverlapInfo,
  DistanceInfo,
  LayoutOptions,
  BoundingBox,
  CacheOptions,
  CacheEntry,
  FigmaAPIError,
  ValidationResult,
  Vector
} from '../../../common/src/types/figma.types';

/**
 * Configuration options for FigmaAPIClient
 */
export interface FigmaAPIClientConfig {
  cache?: CacheOptions;
  retryAttempts?: number;
  timeout?: number;
  validateInputs?: boolean;
  enableEventListening?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<FigmaAPIClientConfig> = {
  cache: {
    ttl: 300000, // 5 minutes
    maxSize: 1000,
    refreshOnAccess: true
  },
  retryAttempts: 3,
  timeout: 10000,
  validateInputs: true,
  enableEventListening: false
};

/**
 * Main FigmaAPIClient class
 * Provides comprehensive Figma/FigJam API functionality for AI Agents
 */
export class FigmaAPIClient {
  private apiService: FigmaAPIService;
  private config: Required<FigmaAPIClientConfig>;
  private elementCache: Map<string, CacheEntry<FigmaElement>>;
  private pageCache: CacheEntry<PageInfo> | null;
  private requestCounter: number;
  private eventListeners: Map<string, Function[]>;

  constructor(
    apiService: FigmaAPIService,
    config: FigmaAPIClientConfig = {}
  ) {
    this.apiService = apiService;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.elementCache = new Map();
    this.pageCache = null;
    this.requestCounter = 0;
    this.eventListeners = new Map();
    
    console.log('[FigmaAPIClient] Initialized with config:', this.config);
  }

  // ========================================
  // Page Information Methods
  // ========================================

  /**
   * Get current page information with all elements
   */
  async getCurrentPageInfo(forceRefresh = false): Promise<PageInfo> {
    const now = Date.now();
    
    // Check cache first
    if (!forceRefresh && this.pageCache && 
        (now - this.pageCache.timestamp) < (this.config.cache?.ttl ?? 300000)) {
      this.pageCache.accessCount++;
      this.pageCache.lastAccessed = now;
      console.log('[FigmaAPIClient] Returning cached page info');
      return this.pageCache.data;
    }

    try {
      console.log('[FigmaAPIClient] Fetching current page info from Figma');
      const response = await this.sendAPICall<PageInfo>('get_current_page_info', {});
      
      // Cache the result
      this.pageCache = {
        data: response,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now
      };
      
      // Update element cache
      response.elements.forEach(element => {
        this.elementCache.set(element.id, {
          data: element,
          timestamp: now,
          accessCount: 1,
          lastAccessed: now
        });
      });

      this.emitEvent('page_changed', { pageInfo: response });
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to get page info: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PAGE_INFO_ERROR',
        'get_current_page_info'
      );
    }
  }

  /**
   * Get currently selected elements
   */
  async getSelectedElements(): Promise<FigmaElement[]> {
    const pageInfo = await this.getCurrentPageInfo();
    const selectedElements = pageInfo.elements.filter(el => 
      pageInfo.selection.includes(el.id)
    );
    
    console.log(`[FigmaAPIClient] Found ${selectedElements.length} selected elements`);
    return selectedElements;
  }

  /**
   * Query elements by various criteria
   */
  async queryElements(query: ElementQuery): Promise<FigmaElement[]> {
    const pageInfo = await this.getCurrentPageInfo();
    let results = pageInfo.elements;

    // Filter by types
    if (query.types && query.types.length > 0) {
      results = results.filter(el => query.types!.includes(el.type));
    }

    // Filter by names
    if (query.names && query.names.length > 0) {
      results = results.filter(el => query.names!.includes(el.name));
    }

    // Filter by name pattern
    if (query.namePattern) {
      const regex = new RegExp(query.namePattern, 'i');
      results = results.filter(el => regex.test(el.name));
    }

    // Filter by region
    if (query.region) {
      const { x, y, width, height } = query.region;
      results = results.filter(el => {
        return el.x >= x && el.y >= y && 
               el.x + el.width <= x + width && 
               el.y + el.height <= y + height;
      });
    }

    // Filter by properties
    if (query.properties) {
      results = results.filter(el => {
        return Object.entries(query.properties!).every(([key, value]) => {
          const elementValue = (el as any)[key];
          if (typeof value === 'object' && value !== null) {
            return JSON.stringify(elementValue) === JSON.stringify(value);
          }
          return elementValue === value;
        });
      });
    }

    console.log(`[FigmaAPIClient] Query returned ${results.length} elements`);
    return results;
  }

  /**
   * Get elements by type
   */
  async getElementsByType(type: NodeType): Promise<FigmaElement[]> {
    return this.queryElements({ types: [type] });
  }

  /**
   * Get elements in a region
   */
  async getElementsByRegion(x: number, y: number, width: number, height: number): Promise<FigmaElement[]> {
    return this.queryElements({ region: { x, y, width, height } });
  }

  /**
   * Search elements by name pattern
   */
  async searchElementsByName(namePattern: string): Promise<FigmaElement[]> {
    return this.queryElements({ namePattern });
  }

  // ========================================
  // Element Creation Methods
  // ========================================

  /**
   * Create a sticky note
   */
  async createStickyNote(options: StickyNoteCreateOptions): Promise<ElementCreationResult> {
    if (this.config.validateInputs) {
      const validation = this.validateStickyNoteOptions(options);
      if (!validation.valid) {
        throw new FigmaAPIError(`Invalid sticky note options: ${validation.errors.join(', ')}`, 'VALIDATION_ERROR');
      }
    }

    try {
      console.log('[FigmaAPIClient] Creating sticky note:', options);
      const response = await this.sendAPICall<ElementCreationResult>('create_sticky_note', options);
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'STICKY' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to create sticky note: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_ERROR',
        'create_sticky_note'
      );
    }
  }

  /**
   * Create a rectangle
   */
  async createRectangle(options: ShapeCreateOptions = {}): Promise<ElementCreationResult> {
    const defaultOptions = {
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 100,
      height: options.height || 100,
      fills: options.fills || [{ type: 'SOLID' as const, color: { r: 0.5, g: 0.5, b: 0.5 } }],
      ...options
    };

    try {
      console.log('[FigmaAPIClient] Creating rectangle:', defaultOptions);
      const response = await this.sendAPICall<ElementCreationResult>('create_rectangle', defaultOptions);
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'RECTANGLE' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to create rectangle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_ERROR',
        'create_rectangle'
      );
    }
  }

  /**
   * Create an ellipse
   */
  async createEllipse(options: ShapeCreateOptions = {}): Promise<ElementCreationResult> {
    const defaultOptions = {
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 100,
      height: options.height || 100,
      fills: options.fills || [{ type: 'SOLID' as const, color: { r: 0.5, g: 0.5, b: 0.5 } }],
      ...options
    };

    try {
      console.log('[FigmaAPIClient] Creating ellipse:', defaultOptions);
      const response = await this.sendAPICall<ElementCreationResult>('create_ellipse', defaultOptions);
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'ELLIPSE' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to create ellipse: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_ERROR',
        'create_ellipse'
      );
    }
  }

  /**
   * Create a text element
   */
  async createText(options: TextCreateOptions): Promise<ElementCreationResult> {
    if (this.config.validateInputs) {
      const validation = this.validateTextOptions(options);
      if (!validation.valid) {
        throw new FigmaAPIError(`Invalid text options: ${validation.errors.join(', ')}`, 'VALIDATION_ERROR');
      }
    }

    const defaultOptions = {
      x: options.x || 0,
      y: options.y || 0,
      width: options.width || 200,
      height: options.height || 50,
      fontSize: options.fontSize || 16,
      fontFamily: options.fontFamily || 'Inter',
      fontWeight: options.fontWeight || 'Regular',
      textAlign: options.textAlign || 'LEFT' as const,
      textColor: options.textColor || { r: 0, g: 0, b: 0 },
      ...options
    };

    try {
      console.log('[FigmaAPIClient] Creating text:', defaultOptions);
      const response = await this.sendAPICall<ElementCreationResult>('create_text', defaultOptions);
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'TEXT' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to create text: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_ERROR',
        'create_text'
      );
    }
  }

  /**
   * Create a connector between two elements
   */
  async createConnector(options: ConnectorCreateOptions): Promise<ElementCreationResult> {
    if (this.config.validateInputs) {
      if (!options.startElementId || !options.endElementId) {
        throw new FigmaAPIError('Both startElementId and endElementId are required', 'VALIDATION_ERROR');
      }
    }

    try {
      console.log('[FigmaAPIClient] Creating connector:', options);
      const response = await this.sendAPICall<ElementCreationResult>('create_connector', options);
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'CONNECTOR' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to create connector: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CREATION_ERROR',
        'create_connector'
      );
    }
  }

  // ========================================
  // Element Management Methods
  // ========================================

  /**
   * Delete a single element
   */
  async deleteElement(elementId: string): Promise<boolean> {
    try {
      console.log('[FigmaAPIClient] Deleting element:', elementId);
      await this.sendAPICall<ElementDeletionResult>('delete_element', { elementId });
      
      this.elementCache.delete(elementId);
      this.invalidatePageCache();
      this.emitEvent('element_deleted', { elementId });
      
      return true;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to delete element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DELETION_ERROR',
        'delete_element',
        elementId
      );
    }
  }

  /**
   * Delete multiple elements
   */
  async deleteElements(elementIds: string[]): Promise<BulkOperationResult> {
    try {
      console.log('[FigmaAPIClient] Deleting elements:', elementIds);
      const response = await this.sendAPICall<BulkOperationResult>('delete_elements', { elementIds });
      
      // Remove from cache
      elementIds.forEach(id => this.elementCache.delete(id));
      this.invalidatePageCache();
      
      // Emit events for successful deletions
      response.successful.forEach(elementId => {
        this.emitEvent('element_deleted', { elementId });
      });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to delete elements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'BULK_DELETION_ERROR',
        'delete_elements'
      );
    }
  }

  /**
   * Update element properties
   */
  async updateElement(elementId: string, properties: ElementUpdateOptions): Promise<ElementUpdateResult> {
    if (this.config.validateInputs) {
      const validation = this.validateUpdateOptions(properties);
      if (!validation.valid) {
        throw new FigmaAPIError(`Invalid update options: ${validation.errors.join(', ')}`, 'VALIDATION_ERROR');
      }
    }

    try {
      console.log('[FigmaAPIClient] Updating element:', elementId, properties);
      const response = await this.sendAPICall<ElementUpdateResult>('update_element', {
        elementId,
        properties
      });

      // Update cached element
      const cached = this.elementCache.get(elementId);
      if (cached) {
        Object.assign(cached.data, properties);
        cached.lastAccessed = Date.now();
      }
      
      this.invalidatePageCache();
      this.emitEvent('element_updated', { elementId, changes: properties });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to update element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UPDATE_ERROR',
        'update_element',
        elementId
      );
    }
  }

  /**
   * Move an element to a new position
   */
  async moveElement(elementId: string, x: number, y: number): Promise<ElementUpdateResult> {
    return this.updateElement(elementId, { x, y });
  }

  /**
   * Resize an element
   */
  async resizeElement(elementId: string, width: number, height: number): Promise<ElementUpdateResult> {
    return this.updateElement(elementId, { width, height });
  }

  /**
   * Select elements
   */
  async selectElements(elementIds: string[]): Promise<boolean> {
    try {
      console.log('[FigmaAPIClient] Selecting elements:', elementIds);
      await this.sendAPICall<void>('select_elements', { elementIds });
      
      // Update page cache selection
      if (this.pageCache) {
        this.pageCache.data.selection = elementIds;
      }
      
      this.emitEvent('selection_changed', { 
        previousSelection: this.pageCache?.data.selection || [],
        currentSelection: elementIds 
      });
      
      return true;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to select elements: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'SELECTION_ERROR',
        'select_elements'
      );
    }
  }

  /**
   * Duplicate an element
   */
  async duplicateElement(elementId: string, offsetX = 20, offsetY = 20): Promise<ElementCreationResult> {
    try {
      console.log('[FigmaAPIClient] Duplicating element:', elementId, { offsetX, offsetY });
      const response = await this.sendAPICall<ElementCreationResult>('duplicate_element', {
        elementId,
        offsetX,
        offsetY
      });
      
      this.invalidatePageCache();
      this.emitEvent('element_created', { elementId: response.elementId, type: 'DUPLICATE' });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to duplicate element: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DUPLICATION_ERROR',
        'duplicate_element',
        elementId
      );
    }
  }

  // ========================================
  // Analysis and Utility Methods
  // ========================================

  /**
   * Get detailed element information
   */
  async getElementDetails(elementId: string, forceRefresh = false): Promise<FigmaElement> {
    const now = Date.now();
    
    // Check cache first
    if (!forceRefresh) {
      const cached = this.elementCache.get(elementId);
      if (cached && (now - cached.timestamp) < (this.config.cache?.ttl ?? 300000)) {
        cached.accessCount++;
        cached.lastAccessed = now;
        return cached.data;
      }
    }

    try {
      const response = await this.sendAPICall<FigmaElement>('get_element_details', { elementId });
      
      // Cache the result
      this.elementCache.set(elementId, {
        data: response,
        timestamp: now,
        accessCount: 1,
        lastAccessed: now
      });
      
      return response;
    } catch (error) {
      throw new FigmaAPIError(
        `Failed to get element details: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'ELEMENT_DETAILS_ERROR',
        'get_element_details',
        elementId
      );
    }
  }

  /**
   * Get page statistics
   */
  async getPageStatistics(): Promise<ElementStatistics> {
    const pageInfo = await this.getCurrentPageInfo();
    const elements = pageInfo.elements;
    
    const elementsByType = elements.reduce((acc, el) => {
      acc[el.type] = (acc[el.type] || 0) + 1;
      return acc;
    }, {} as Record<NodeType, number>);

    const visibleElements = elements.filter(el => el.visible);
    const lockedElements = elements.filter(el => el.locked);
    
    const totalArea = elements.reduce((area, el) => area + (el.width * el.height), 0);
    
    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(elements);

    return {
      totalElements: elements.length,
      elementsByType,
      selectedCount: pageInfo.selection.length,
      visibleCount: visibleElements.length,
      lockedCount: lockedElements.length,
      totalArea,
      boundingBox
    };
  }

  /**
   * Calculate distance between two elements
   */
  calculateDistance(element1: FigmaElement, element2: FigmaElement): number {
    const center1 = {
      x: element1.x + element1.width / 2,
      y: element1.y + element1.height / 2
    };
    const center2 = {
      x: element2.x + element2.width / 2,
      y: element2.y + element2.height / 2
    };
    
    const dx = center1.x - center2.x;
    const dy = center1.y - center2.y;
    
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Check if two elements overlap
   */
  checkOverlap(element1: FigmaElement, element2: FigmaElement): OverlapInfo | null {
    const left1 = element1.x;
    const right1 = element1.x + element1.width;
    const top1 = element1.y;
    const bottom1 = element1.y + element1.height;
    
    const left2 = element2.x;
    const right2 = element2.x + element2.width;
    const top2 = element2.y;
    const bottom2 = element2.y + element2.height;
    
    // Check if they overlap
    if (right1 <= left2 || left1 >= right2 || bottom1 <= top2 || top1 >= bottom2) {
      return null; // No overlap
    }
    
    // Calculate overlap area
    const overlapLeft = Math.max(left1, left2);
    const overlapRight = Math.min(right1, right2);
    const overlapTop = Math.max(top1, top2);
    const overlapBottom = Math.min(bottom1, bottom2);
    
    const overlapArea = (overlapRight - overlapLeft) * (overlapBottom - overlapTop);
    const area1 = element1.width * element1.height;
    const area2 = element2.width * element2.height;
    const minArea = Math.min(area1, area2);
    
    return {
      element1: element1.id,
      element2: element2.id,
      overlapArea,
      overlapPercentage: (overlapArea / minArea) * 100
    };
  }

  /**
   * Arrange elements in a layout
   */
  async arrangeElements(elementIds: string[], options: LayoutOptions): Promise<BulkOperationResult> {
    const elements = await Promise.all(
      elementIds.map(id => this.getElementDetails(id))
    );
    
    const updates: Array<{ elementId: string; properties: ElementUpdateOptions }> = [];
    
    switch (options.direction) {
      case 'horizontal':
        updates.push(...this.calculateHorizontalLayout(elements, options));
        break;
      case 'vertical':
        updates.push(...this.calculateVerticalLayout(elements, options));
        break;
      case 'grid':
        updates.push(...this.calculateGridLayout(elements, options));
        break;
    }
    
    // Apply all updates
    const results = await Promise.allSettled(
      updates.map(update => this.updateElement(update.elementId, update.properties))
    );
    
    const successful: string[] = [];
    const failed: Array<{ elementId: string; error: string }> = [];
    
    results.forEach((result, index) => {
      const elementId = updates[index].elementId;
      if (result.status === 'fulfilled') {
        successful.push(elementId);
      } else {
        failed.push({ elementId, error: result.reason.message });
      }
    });
    
    return {
      successful,
      failed,
      message: `Layout applied: ${successful.length} successful, ${failed.length} failed`
    };
  }

  // ========================================
  // Cache and Event Management
  // ========================================

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.elementCache.clear();
    this.pageCache = null;
    console.log('[FigmaAPIClient] All caches cleared');
  }

  /**
   * Add event listener
   */
  addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  /**
   * Remove event listener
   */
  removeEventListener(eventType: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(eventType: string, data: any): void {
    if (!this.config.enableEventListening) return;
    
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[FigmaAPIClient] Error in event listener for ${eventType}:`, error);
        }
      });
    }
  }

  // ========================================
  // Private Helper Methods
  // ========================================

  /**
   * Send API call with error handling and retries
   */
  private async sendAPICall<T>(action: string, data: any): Promise<T> {
    const id = this.generateId();
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const response = await this.apiService.sendAPICall(action, id, data);
        
        if (response.success) {
          return response.result as T;
        } else {
          throw new Error(response.error || 'Unknown API error');
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.retryAttempts) {
          const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
          console.warn(`[FigmaAPIClient] Attempt ${attempt} failed for ${action}, retrying in ${delay}ms:`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`Failed after ${this.config.retryAttempts} attempts`);
  }

  /**
   * Generate unique request ID
   */
  private generateId(): string {
    return `figma-api-${Date.now()}-${++this.requestCounter}`;
  }

  /**
   * Invalidate page cache
   */
  private invalidatePageCache(): void {
    this.pageCache = null;
  }

  /**
   * Validate sticky note options
   */
  private validateStickyNoteOptions(options: StickyNoteCreateOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.text || options.text.trim().length === 0) {
      errors.push('Text content is required');
    }

    if (options.text && options.text.length > 1000) {
      warnings.push('Text content is very long and may be truncated');
    }

    if (options.x !== undefined && (options.x < -10000 || options.x > 10000)) {
      warnings.push('X position is outside typical canvas bounds');
    }

    if (options.y !== undefined && (options.y < -10000 || options.y > 10000)) {
      warnings.push('Y position is outside typical canvas bounds');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate text options
   */
  private validateTextOptions(options: TextCreateOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!options.text || options.text.trim().length === 0) {
      errors.push('Text content is required');
    }

    if (options.fontSize !== undefined && (options.fontSize < 1 || options.fontSize > 400)) {
      errors.push('Font size must be between 1 and 400');
    }

    if (options.textColor) {
      const { r, g, b } = options.textColor;
      if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
        errors.push('Text color values must be between 0 and 1');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate update options
   */
  private validateUpdateOptions(options: ElementUpdateOptions): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (options.opacity !== undefined && (options.opacity < 0 || options.opacity > 1)) {
      errors.push('Opacity must be between 0 and 1');
    }

    if (options.width !== undefined && options.width <= 0) {
      errors.push('Width must be greater than 0');
    }

    if (options.height !== undefined && options.height <= 0) {
      errors.push('Height must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Calculate bounding box for elements
   */
  private calculateBoundingBox(elements: FigmaElement[]): BoundingBox {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach(el => {
      minX = Math.min(minX, el.x);
      minY = Math.min(minY, el.y);
      maxX = Math.max(maxX, el.x + el.width);
      maxY = Math.max(maxY, el.y + el.height);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  /**
   * Calculate horizontal layout positions
   */
  private calculateHorizontalLayout(
    elements: FigmaElement[],
    options: LayoutOptions
  ): Array<{ elementId: string; properties: ElementUpdateOptions }> {
    const spacing = options.spacing || 10;
    const padding = options.padding || 0;
    
    let currentX = padding;
    
    return elements.map(element => ({
      elementId: element.id,
      properties: {
        x: currentX,
        y: element.y
      }
    })).map((update, index) => {
      if (index > 0) {
        currentX += elements[index - 1].width + spacing;
        update.properties.x = currentX;
      }
      return update;
    });
  }

  /**
   * Calculate vertical layout positions
   */
  private calculateVerticalLayout(
    elements: FigmaElement[],
    options: LayoutOptions
  ): Array<{ elementId: string; properties: ElementUpdateOptions }> {
    const spacing = options.spacing || 10;
    const padding = options.padding || 0;
    
    let currentY = padding;
    
    return elements.map(element => ({
      elementId: element.id,
      properties: {
        x: element.x,
        y: currentY
      }
    })).map((update, index) => {
      if (index > 0) {
        currentY += elements[index - 1].height + spacing;
        update.properties.y = currentY;
      }
      return update;
    });
  }

  /**
   * Calculate grid layout positions
   */
  private calculateGridLayout(
    elements: FigmaElement[],
    options: LayoutOptions
  ): Array<{ elementId: string; properties: ElementUpdateOptions }> {
    const columns = options.columns || Math.ceil(Math.sqrt(elements.length));
    const spacing = options.spacing || 10;
    const padding = options.padding || 0;
    
    return elements.map((element, index) => {
      const row = Math.floor(index / columns);
      const col = index % columns;
      
      return {
        elementId: element.id,
        properties: {
          x: padding + col * (element.width + spacing),
          y: padding + row * (element.height + spacing)
        }
      };
    });
  }
}

// Export factory function for easy instantiation
export function createFigmaAPIClient(
  apiService: FigmaAPIService,
  config?: FigmaAPIClientConfig
): FigmaAPIClient {
  return new FigmaAPIClient(apiService, config);
}