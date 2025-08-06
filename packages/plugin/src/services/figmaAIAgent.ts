/**
 * FigmaAIAgent - AI Agent Integration Example
 * Demonstrates how to use FigmaAPIClient with AI capabilities
 * Provides high-level intelligent operations for Figma/FigJam
 */

import { FigmaAPIClient, createFigmaAPIClient } from './figmaAPIClient';
import { FigmaAPIService } from './figmaAPI';
import {
  FigmaElement,
  PageInfo,
  ElementStatistics,
  StickyNoteCreateOptions,
  TextCreateOptions,
  ShapeCreateOptions,
  LayoutOptions
} from '../../../common/src/types/figma.types';

/**
 * AI Agent configuration
 */
export interface AIAgentConfig {
  enableSmartPositioning?: boolean;
  enableColorHarmony?: boolean;
  enableAutoLayout?: boolean;
  defaultSpacing?: number;
  preferredColors?: string[];
}

/**
 * Mind map configuration
 */
export interface MindMapConfig {
  centralTopic: string;
  subtopics: string[];
  radius?: number;
  centerX?: number;
  centerY?: number;
  connectionStyle?: 'curved' | 'straight';
}

/**
 * Layout analysis result
 */
export interface LayoutAnalysis {
  density: 'sparse' | 'moderate' | 'dense' | 'overcrowded';
  alignment: 'good' | 'moderate' | 'poor';
  spacing: 'consistent' | 'inconsistent';
  overlaps: number;
  suggestions: string[];
}

/**
 * FigmaAIAgent - Intelligent Figma operations
 */
export class FigmaAIAgent {
  private figmaClient: FigmaAPIClient;
  private config: Required<AIAgentConfig>;

  constructor(config: AIAgentConfig = {}) {
    const apiService = new FigmaAPIService();
    this.figmaClient = createFigmaAPIClient(apiService, {
      enableEventListening: true,
      validateInputs: true
    });

    this.config = {
      enableSmartPositioning: true,
      enableColorHarmony: true,
      enableAutoLayout: true,
      defaultSpacing: 20,
      preferredColors: ['yellow', 'blue', 'green', 'pink', 'purple'],
      ...config
    };

    console.log('[FigmaAIAgent] Initialized with config:', this.config);
  }

  // ========================================
  // Page Analysis Methods
  // ========================================

  /**
   * Analyze current page and provide insights
   */
  async analyzeCurrentPage(): Promise<string> {
    try {
      console.log('[FigmaAIAgent] Analyzing current page...');
      
      // Get page information and statistics
      const [pageInfo, statistics] = await Promise.all([
        this.figmaClient.getCurrentPageInfo(),
        this.figmaClient.getPageStatistics()
      ]);

      // Perform layout analysis
      const layoutAnalysis = this.analyzeLayout(pageInfo.elements);

      // Generate insights
      const insights = [
        `📊 **页面分析报告**`,
        ``,
        `**基本信息:**`,
        `• 页面名称: ${pageInfo.name}`,
        `• 编辑器类型: ${pageInfo.editorType}`,
        `• 总元素数: ${statistics.totalElements}`,
        `• 当前选中: ${statistics.selectedCount} 个元素`,
        `• 可见元素: ${statistics.visibleCount}`,
        `• 锁定元素: ${statistics.lockedCount}`,
        ``,
        `**元素类型分布:**`
      ];

      Object.entries(statistics.elementsByType).forEach(([type, count]) => {
        insights.push(`• ${type}: ${count} 个`);
      });

      insights.push(
        ``,
        `**布局分析:**`,
        `• 密度: ${layoutAnalysis.density}`,
        `• 对齐情况: ${layoutAnalysis.alignment}`,
        `• 间距一致性: ${layoutAnalysis.spacing}`,
        `• 重叠元素: ${layoutAnalysis.overlaps} 个`,
        `• 总占用面积: ${Math.round(statistics.totalArea)} px²`
      );

      if (layoutAnalysis.suggestions.length > 0) {
        insights.push(``, `**优化建议:**`);
        layoutAnalysis.suggestions.forEach(suggestion => {
          insights.push(`• ${suggestion}`);
        });
      }

      const result = insights.join('\n');
      console.log('[FigmaAIAgent] Page analysis completed');
      return result;

    } catch (error) {
      const errorMsg = `分析失败：${error instanceof Error ? error.message : '未知错误'}`;
      console.error('[FigmaAIAgent] Analysis error:', error);
      return errorMsg;
    }
  }

  /**
   * Analyze layout quality
   */
  private analyzeLayout(elements: FigmaElement[]): LayoutAnalysis {
    if (elements.length === 0) {
      return {
        density: 'sparse',
        alignment: 'good',
        spacing: 'consistent',
        overlaps: 0,
        suggestions: ['页面为空，可以开始添加内容']
      };
    }

    // Calculate density
    const totalArea = elements.reduce((sum, el) => sum + (el.width * el.height), 0);
    const averageArea = totalArea / elements.length;
    const density = averageArea > 50000 ? 'sparse' : 
                   averageArea > 20000 ? 'moderate' : 
                   averageArea > 5000 ? 'dense' : 'overcrowded';

    // Check overlaps
    let overlapCount = 0;
    for (let i = 0; i < elements.length; i++) {
      for (let j = i + 1; j < elements.length; j++) {
        const overlap = this.figmaClient.checkOverlap(elements[i], elements[j]);
        if (overlap && overlap.overlapPercentage > 10) {
          overlapCount++;
        }
      }
    }

    // Check alignment
    const xPositions = elements.map(el => el.x);
    const yPositions = elements.map(el => el.y);
    const xVariance = this.calculateVariance(xPositions);
    const yVariance = this.calculateVariance(yPositions);
    const alignment = (xVariance < 1000 && yVariance < 1000) ? 'good' : 
                     (xVariance < 5000 && yVariance < 5000) ? 'moderate' : 'poor';

    // Check spacing consistency
    const distances: number[] = [];
    for (let i = 0; i < Math.min(elements.length, 10); i++) {
      for (let j = i + 1; j < Math.min(elements.length, 10); j++) {
        distances.push(this.figmaClient.calculateDistance(elements[i], elements[j]));
      }
    }
    const spacingVariance = this.calculateVariance(distances);
    const spacing = spacingVariance < 2000 ? 'consistent' : 'inconsistent';

    // Generate suggestions
    const suggestions: string[] = [];
    if (density === 'overcrowded') {
      suggestions.push('元素过于密集，建议增加间距或重新组织布局');
    }
    if (overlapCount > 0) {
      suggestions.push(`发现 ${overlapCount} 处元素重叠，建议调整位置`);
    }
    if (alignment === 'poor') {
      suggestions.push('元素对齐不规整，建议使用网格布局或自动对齐功能');
    }
    if (spacing === 'inconsistent') {
      suggestions.push('元素间距不一致，建议统一间距标准');
    }
    if (suggestions.length === 0) {
      suggestions.push('布局整体良好，保持当前设计风格');
    }

    return {
      density,
      alignment,
      spacing,
      overlaps: overlapCount,
      suggestions
    };
  }

  /**
   * Calculate variance of numbers
   */
  private calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    
    const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
    const variance = numbers.reduce((sum, n) => sum + Math.pow(n - mean, 2), 0) / numbers.length;
    return variance;
  }

  // ========================================
  // Intelligent Creation Methods
  // ========================================

  /**
   * Create an intelligent mind map
   */
  async createMindMap(config: MindMapConfig): Promise<string> {
    const { centralTopic, subtopics, radius = 200, centerX = 400, centerY = 300 } = config;

    try {
      console.log('[FigmaAIAgent] Creating mind map:', centralTopic);

      // Create central topic with smart color selection
      const centralColor = this.selectSmartColor(0, subtopics.length + 1);
      const centralId = await this.figmaClient.createStickyNote({
        text: centralTopic,
        x: centerX - 120,
        y: centerY - 60,
        color: centralColor,
        width: 240,
        height: 120
      });

      // Create subtopics in a circle around the center
      const subtopicIds: string[] = [];
      for (let i = 0; i < subtopics.length; i++) {
        const angle = (2 * Math.PI * i) / subtopics.length;
        const x = centerX + Math.cos(angle) * radius - 100;
        const y = centerY + Math.sin(angle) * radius - 50;
        const color = this.selectSmartColor(i + 1, subtopics.length + 1);

        const subtopicId = await this.figmaClient.createStickyNote({
          text: subtopics[i],
          x,
          y,
          color: color as 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green',
          width: 200,
          height: 100
        });

        subtopicIds.push(subtopicId.elementId);
      }

      // Create connections if in FigJam
      const connectorIds: string[] = [];
      for (const subtopicId of subtopicIds) {
        try {
          const connectorResult = await this.figmaClient.createConnector({
            startElementId: centralId.elementId,
            endElementId: subtopicId
          });
          connectorIds.push(connectorResult.elementId);
        } catch (error) {
          console.log('[FigmaAIAgent] Connector creation skipped:', error);
        }
      }

      // Select all created elements
      const allIds = [centralId.elementId, ...subtopicIds];
      await this.figmaClient.selectElements(allIds);

      const result = `✅ 思维导图创建完成！\n` +
                    `• 中心主题: ${centralTopic}\n` +
                    `• 子主题数量: ${subtopics.length}\n` +
                    `• 连接线: ${connectorIds.length} 条\n` +
                    `• 使用了智能颜色搭配和圆形布局`;

      console.log('[FigmaAIAgent] Mind map created successfully');
      return result;

    } catch (error) {
      const errorMsg = `思维导图创建失败：${error instanceof Error ? error.message : '未知错误'}`;
      console.error('[FigmaAIAgent] Mind map creation error:', error);
      return errorMsg;
    }
  }

  /**
   * Intelligent page organization
   */
  async organizePageElements(): Promise<string> {
    try {
      console.log('[FigmaAIAgent] Starting intelligent page organization...');
      
      const pageInfo = await this.figmaClient.getCurrentPageInfo();
      
      if (pageInfo.elements.length === 0) {
        return '页面没有元素需要整理';
      }

      // Group elements by type for better organization
      const elementsByType = pageInfo.elements.reduce((groups: Record<string, FigmaElement[]>, element: FigmaElement) => {
        if (!groups[element.type]) groups[element.type] = [];
        groups[element.type].push(element);
        return groups;
      }, {} as Record<string, FigmaElement[]>);

      let organizationCount = 0;
      const gridSize = 280; // Spacing between type groups
      let currentRow = 0;
      let maxItemsPerRow = 4; // Maximum items per row within each type group

      // Organize each type in its own section
      for (const [type, elements] of Object.entries(elementsByType)) {
        console.log(`[FigmaAIAgent] Organizing ${elements.length} ${type} elements`);
        
        // Calculate grid positions for this type group
        const positions = this.calculateGridPositions(elements.length, maxItemsPerRow, {
          startX: 50,
          startY: currentRow * gridSize + 50,
          spacing: this.config.defaultSpacing,
          itemWidth: 200,
          itemHeight: 150
        });

        // Apply positions to elements
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i];
          const position = positions[i];
          
          await this.figmaClient.moveElement(element.id, position.x, position.y);
          organizationCount++;
        }

        // Calculate how many rows this type used
        const rowsUsed = Math.ceil(elements.length / maxItemsPerRow);
        currentRow += rowsUsed + 1; // Add extra space between type groups
      }

      // Create type labels if enabled
      if (this.config.enableAutoLayout) {
        await this.createTypeLabels(elementsByType, gridSize);
      }

      const result = `✅ 页面整理完成！\n` +
                    `• 重新排列了 ${organizationCount} 个元素\n` +
                    `• 按 ${Object.keys(elementsByType).length} 种类型分组\n` +
                    `• 应用了智能网格布局\n` +
                    `• 统一了元素间距 (${this.config.defaultSpacing}px)`;

      console.log('[FigmaAIAgent] Page organization completed');
      return result;

    } catch (error) {
      const errorMsg = `页面整理失败：${error instanceof Error ? error.message : '未知错误'}`;
      console.error('[FigmaAIAgent] Organization error:', error);
      return errorMsg;
    }
  }

  /**
   * Create an intelligent workflow diagram
   */
  async createWorkflowDiagram(steps: string[], title = "工作流程"): Promise<string> {
    try {
      console.log('[FigmaAIAgent] Creating workflow diagram:', title);

      const startX = 100;
      const startY = 200;
      const stepWidth = 200;
      const stepHeight = 80;
      const spacing = 50;

      // Create title
      const titleId = await this.figmaClient.createText({
        text: title,
        x: startX,
        y: startY - 100,
        fontSize: 24,
        fontWeight: 'Bold',
        textAlign: 'LEFT'
      });

      // Create workflow steps
      const stepIds: string[] = [];
      const connectorIds: string[] = [];

      for (let i = 0; i < steps.length; i++) {
        const x = startX + i * (stepWidth + spacing);
        const color = this.selectSmartColor(i, steps.length);

        // Create step box
        const stepId = await this.figmaClient.createStickyNote({
          text: `${i + 1}. ${steps[i]}`,
          x,
          y: startY,
          color: color as 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green',
          width: stepWidth,
          height: stepHeight
        });

        stepIds.push(stepId.elementId);

        // Create arrow to next step
        if (i < steps.length - 1) {
          try {
            const connectorId = await this.figmaClient.createConnector({
              startElementId: stepId.elementId,
              endElementId: stepIds[i - 1] || stepId.elementId, // Temporary, will be updated
              strokeWeight: 3,
              strokeColor: { r: 0.2, g: 0.2, b: 0.2 }
            });
            connectorIds.push(connectorId.elementId);
          } catch (error) {
            console.log('[FigmaAIAgent] Connector creation skipped for workflow');
          }
        }
      }

      // Select all created elements
      const allIds = [titleId.elementId, ...stepIds];
      await this.figmaClient.selectElements(allIds);

      const result = `✅ 工作流程图创建完成！\n` +
                    `• 标题: ${title}\n` +
                    `• 工作步骤: ${steps.length} 个\n` +
                    `• 连接线: ${connectorIds.length} 条\n` +
                    `• 使用了智能颜色和水平布局`;

      console.log('[FigmaAIAgent] Workflow diagram created successfully');
      return result;

    } catch (error) {
      const errorMsg = `工作流程图创建失败：${error instanceof Error ? error.message : '未知错误'}`;
      console.error('[FigmaAIAgent] Workflow creation error:', error);
      return errorMsg;
    }
  }

  // ========================================
  // Smart Helper Methods
  // ========================================

  /**
   * Select smart colors based on harmony principles
   */
  private selectSmartColor(index: number, total: number): 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green' {
    if (!this.config.enableColorHarmony) {
      return this.config.preferredColors[index % this.config.preferredColors.length] as 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green';
    }

    // Use color harmony principles
    if (total <= 3) {
      // Primary colors for small sets
      const primaryColors = ['yellow', 'blue', 'green'] as const;
      return primaryColors[index % primaryColors.length];
    } else if (total <= 5) {
      // Extended palette
      return this.config.preferredColors[index % this.config.preferredColors.length] as 'yellow' | 'blue' | 'green' | 'pink' | 'purple' | 'red' | 'orange' | 'dark_blue' | 'dark_green';
    } else {
      // Alternating pattern for large sets
      const pattern = ['blue', 'green', 'yellow', 'pink', 'purple'] as const;
      return pattern[index % pattern.length];
    }
  }

  /**
   * Calculate grid positions for elements
   */
  private calculateGridPositions(
    itemCount: number,
    maxPerRow: number,
    options: {
      startX: number;
      startY: number;
      spacing: number;
      itemWidth: number;
      itemHeight: number;
    }
  ): Array<{ x: number; y: number }> {
    const positions: Array<{ x: number; y: number }> = [];
    
    for (let i = 0; i < itemCount; i++) {
      const row = Math.floor(i / maxPerRow);
      const col = i % maxPerRow;
      
      const x = options.startX + col * (options.itemWidth + options.spacing);
      const y = options.startY + row * (options.itemHeight + options.spacing);
      
      positions.push({ x, y });
    }
    
    return positions;
  }

  /**
   * Create type labels for organized groups
   */
  private async createTypeLabels(
    elementsByType: Record<string, FigmaElement[]>,
    gridSize: number
  ): Promise<void> {
    let currentRow = 0;
    
    for (const [type, elements] of Object.entries(elementsByType)) {
      if (elements.length === 0) continue;
      
      try {
        await this.figmaClient.createText({
          text: `${type} (${elements.length})`,
          x: 20,
          y: currentRow * gridSize + 20,
          fontSize: 16,
          fontWeight: 'Bold',
          textColor: { r: 0.3, g: 0.3, b: 0.3 }
        });
      } catch (error) {
        console.log(`[FigmaAIAgent] Failed to create label for ${type}:`, error);
      }
      
      const rowsUsed = Math.ceil(elements.length / 4);
      currentRow += rowsUsed + 1;
    }
  }

  /**
   * Find optimal position for new element
   */
  async findOptimalPosition(width = 200, height = 100): Promise<{ x: number; y: number }> {
    if (!this.config.enableSmartPositioning) {
      return { x: 100, y: 100 };
    }

    try {
      const pageInfo = await this.figmaClient.getCurrentPageInfo();
      
      if (pageInfo.elements.length === 0) {
        return { x: 100, y: 100 };
      }

      // Find the rightmost and bottommost elements
      let maxX = 0;
      let maxY = 0;
      
      pageInfo.elements.forEach(element => {
        maxX = Math.max(maxX, element.x + element.width);
        maxY = Math.max(maxY, element.y + element.height);
      });

      // Place new element with spacing
      return {
        x: maxX + this.config.defaultSpacing,
        y: 100 // Keep consistent Y position
      };
    } catch (error) {
      console.error('[FigmaAIAgent] Error finding optimal position:', error);
      return { x: 100, y: 100 };
    }
  }

  /**
   * Cleanup and dispose resources
   */
  dispose(): void {
    this.figmaClient.clearCache();
    console.log('[FigmaAIAgent] Disposed');
  }
}

// Export factory function for easy instantiation
export function createFigmaAIAgent(config?: AIAgentConfig): FigmaAIAgent {
  return new FigmaAIAgent(config);
}

// Export default instance
export const defaultAIAgent = createFigmaAIAgent();