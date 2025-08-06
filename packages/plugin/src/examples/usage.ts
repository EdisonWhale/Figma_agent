/**
 * FigmaAPIClient and FigmaAIAgent Usage Examples
 * Demonstrates how to use the comprehensive Figma API system
 */

import { 
  FigmaAPIService,
  FigmaAPIClient,
  FigmaAIAgent,
  createFigmaAPIClient,
  createFigmaAIAgent
} from '../services';

// ========================================
// Basic FigmaAPIClient Usage
// ========================================

/**
 * Example: Basic API client setup and usage
 */
export async function basicAPIExample() {
  // Initialize the API service and client
  const apiService = new FigmaAPIService();
  const figmaClient = createFigmaAPIClient(apiService, {
    validateInputs: true,
    enableEventListening: true
  });

  try {
    // Get page information
    const pageInfo = await figmaClient.getCurrentPageInfo();
    console.log('Page Info:', pageInfo);

    // Create elements
    const stickyNote = await figmaClient.createStickyNote({
      text: "Hello World!",
      x: 100,
      y: 100,
      color: 'yellow'
    });
    console.log('Created sticky note:', stickyNote.elementId);

    const rectangle = await figmaClient.createRectangle({
      x: 300,
      y: 100,
      width: 150,
      height: 100,
      fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 1 } }]
    });
    console.log('Created rectangle:', rectangle.elementId);

    // Update element
    await figmaClient.updateElement(rectangle.elementId, {
      x: 350,
      opacity: 0.8
    });

    // Query elements
    const textElements = await figmaClient.getElementsByType('TEXT');
    console.log('Found text elements:', textElements.length);

    // Get statistics
    const stats = await figmaClient.getPageStatistics();
    console.log('Page statistics:', stats);

  } catch (error) {
    console.error('API Error:', error);
  }
}

/**
 * Example: Element management operations
 */
export async function elementManagementExample() {
  const apiService = new FigmaAPIService();
  const figmaClient = createFigmaAPIClient(apiService);

  try {
    // Create multiple elements
    const elements = [];
    for (let i = 0; i < 5; i++) {
      const element = await figmaClient.createStickyNote({
        text: `Note ${i + 1}`,
        x: i * 120,
        y: 200,
        color: (['yellow', 'blue', 'green', 'pink', 'purple'] as const)[i] as 'yellow' | 'blue' | 'green' | 'pink' | 'purple'
      });
      elements.push(element.elementId);
    }

    // Arrange elements in a layout
    await figmaClient.arrangeElements(elements, {
      direction: 'horizontal',
      spacing: 20,
      padding: 50,
      alignment: 'center'
    });

    // Select all elements
    await figmaClient.selectElements(elements);

    // Duplicate one element
    const duplicate = await figmaClient.duplicateElement(elements[0], 0, 150);
    console.log('Duplicated element:', duplicate.elementId);

    // Clean up - delete elements
    await figmaClient.deleteElements(elements.slice(1, 3)); // Delete middle elements

  } catch (error) {
    console.error('Element management error:', error);
  }
}

// ========================================
// AI Agent Usage Examples
// ========================================

/**
 * Example: AI-powered page analysis
 */
export async function aiAnalysisExample() {
  const aiAgent = createFigmaAIAgent({
    enableSmartPositioning: true,
    enableColorHarmony: true,
    defaultSpacing: 25
  });

  try {
    // Analyze current page
    const analysis = await aiAgent.analyzeCurrentPage();
    console.log('AI Analysis Result:');
    console.log(analysis);

    // The analysis will include:
    // - Element count and distribution
    // - Layout quality assessment
    // - Spacing and alignment analysis
    // - Optimization suggestions

  } catch (error) {
    console.error('AI analysis error:', error);
  }
}

/**
 * Example: Creating intelligent mind map
 */
export async function mindMapExample() {
  const aiAgent = createFigmaAIAgent({
    enableColorHarmony: true,
    preferredColors: ['blue', 'green', 'yellow', 'pink', 'purple']
  });

  try {
    const result = await aiAgent.createMindMap({
      centralTopic: "产品开发流程",
      subtopics: [
        "需求分析",
        "设计规划",
        "开发实现",
        "测试验证",
        "发布上线",
        "维护优化"
      ],
      radius: 250,
      centerX: 500,
      centerY: 400
    });

    console.log('Mind Map Result:', result);
    // Result will include creation summary and smart color/layout information

  } catch (error) {
    console.error('Mind map creation error:', error);
  }
}

/**
 * Example: Intelligent page organization
 */
export async function pageOrganizationExample() {
  const aiAgent = createFigmaAIAgent({
    enableAutoLayout: true,
    defaultSpacing: 30
  });

  try {
    // This will automatically organize all elements on the page
    // by type, with smart positioning and consistent spacing
    const result = await aiAgent.organizePageElements();
    console.log('Organization Result:', result);

    // The AI will:
    // - Group elements by type
    // - Apply consistent spacing
    // - Create a grid layout
    // - Add type labels if configured

  } catch (error) {
    console.error('Page organization error:', error);
  }
}

/**
 * Example: Creating workflow diagrams
 */
export async function workflowExample() {
  const aiAgent = createFigmaAIAgent();

  try {
    const result = await aiAgent.createWorkflowDiagram([
      "用户提交需求",
      "需求分析评估",
      "设计方案制定",
      "开发团队实现",
      "质量测试验证",
      "产品发布部署"
    ], "软件开发工作流");

    console.log('Workflow Result:', result);
    // Creates a horizontal workflow with smart colors and connections

  } catch (error) {
    console.error('Workflow creation error:', error);
  }
}

// ========================================
// Advanced Usage Patterns
// ========================================

/**
 * Example: Event-driven operations
 */
export async function eventDrivenExample() {
  const apiService = new FigmaAPIService();
  const figmaClient = createFigmaAPIClient(apiService, {
    enableEventListening: true
  });

  // Listen for element creation events
  figmaClient.addEventListener('element_created', (data: any) => {
    console.log('New element created:', data.elementId, data.type);
  });

  // Listen for element updates
  figmaClient.addEventListener('element_updated', (data: any) => {
    console.log('Element updated:', data.elementId, data.changes);
  });

  // Listen for selection changes
  figmaClient.addEventListener('selection_changed', (data: any) => {
    console.log('Selection changed:', data.currentSelection.length, 'items');
  });

  // Perform operations that will trigger events
  try {
    const sticky = await figmaClient.createStickyNote({
      text: "Event Test",
      x: 100,
      y: 100
    });

    await figmaClient.updateElement(sticky.elementId, {
      text: "Event Test Updated"
    });

    await figmaClient.selectElements([sticky.elementId]);

  } catch (error) {
    console.error('Event-driven example error:', error);
  }
}

/**
 * Example: Batch operations with error handling
 */
export async function batchOperationsExample() {
  const apiService = new FigmaAPIService();
  const figmaClient = createFigmaAPIClient(apiService);

  try {
    // Create multiple elements
    const createPromises = Array.from({ length: 10 }, (_, i) => 
      figmaClient.createRectangle({
        x: (i % 5) * 120,
        y: Math.floor(i / 5) * 120,
        width: 100,
        height: 80,
        fills: [{ 
          type: 'SOLID', 
          color: { 
            r: Math.random(), 
            g: Math.random(), 
            b: Math.random() 
          } 
        }]
      })
    );

    const results = await Promise.allSettled(createPromises);
    
    // Process results
    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value.elementId);
    
    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => (result as PromiseRejectedResult).reason);

    console.log(`Created ${successful.length} elements successfully`);
    if (failed.length > 0) {
      console.log(`${failed.length} operations failed:`, failed);
    }

    // Perform batch update
    if (successful.length > 0) {
      const updatePromises = successful.map(elementId =>
        figmaClient.updateElement(elementId, {
          opacity: 0.7,
          rotation: Math.random() * 45
        })
      );

      await Promise.allSettled(updatePromises);
      console.log('Batch update completed');
    }

  } catch (error) {
    console.error('Batch operations error:', error);
  }
}

/**
 * Example: Complex layout creation
 */
export async function complexLayoutExample() {
  const aiAgent = createFigmaAIAgent({
    enableSmartPositioning: true,
    enableColorHarmony: true
  });

  const apiService = new FigmaAPIService();
  const figmaClient = createFigmaAPIClient(apiService);

  try {
    // Create a dashboard-style layout
    
    // 1. Title
    const title = await figmaClient.createText({
      text: "项目仪表板",
      x: 50,
      y: 50,
      fontSize: 32,
      fontWeight: 'Bold'
    });

    // 2. KPI Cards
    const kpiData = [
      { label: "活跃用户", value: "1,234", color: 'blue' },
      { label: "新增用户", value: "456", color: 'green' },
      { label: "转化率", value: "12.3%", color: 'yellow' },
      { label: "收入", value: "¥89,000", color: 'pink' }
    ];

    const kpiCards = [];
    for (let i = 0; i < kpiData.length; i++) {
      const kpi = kpiData[i];
      const cardX = 50 + i * 250;
      
      // Background card
      const card = await figmaClient.createRectangle({
        x: cardX,
        y: 150,
        width: 220,
        height: 120,
        fills: [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }],
        cornerRadius: 8
      });

      // Label
      const label = await figmaClient.createText({
        text: kpi.label,
        x: cardX + 20,
        y: 170,
        fontSize: 14,
        textColor: { r: 0.5, g: 0.5, b: 0.5 }
      });

      // Value
      const value = await figmaClient.createText({
        text: kpi.value,
        x: cardX + 20,
        y: 210,
        fontSize: 24,
        fontWeight: 'Bold'
      });

      kpiCards.push(card.elementId, label.elementId, value.elementId);
    }

    // 3. Create mind map section
    await aiAgent.createMindMap({
      centralTopic: "项目核心",
      subtopics: ["用户体验", "技术架构", "业务指标", "团队协作"],
      centerX: 500,
      centerY: 500,
      radius: 180
    });

    // 4. Select all dashboard elements
    const allElements = [title.elementId, ...kpiCards];
    await figmaClient.selectElements(allElements);

    console.log('Complex dashboard layout created successfully!');

  } catch (error) {
    console.error('Complex layout creation error:', error);
  }
}

// ========================================
// Export all examples
// ========================================

export const examples = {
  basic: {
    basicAPIExample,
    elementManagementExample
  },
  ai: {
    aiAnalysisExample,
    mindMapExample,
    pageOrganizationExample,
    workflowExample
  },
  advanced: {
    eventDrivenExample,
    batchOperationsExample,
    complexLayoutExample
  }
};

export default examples;