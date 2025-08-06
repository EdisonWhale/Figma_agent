/**
 * Figma API 直接测试脚本
 * 在浏览器控制台中运行，测试所有 Figma API 功能
 * 
 * 使用方法：
 * 1. 在 Figma 插件中打开开发者工具
 * 2. 复制这个脚本到控制台
 * 3. 运行各种测试函数
 */

// 全局变量存储API实例
let figmaAPI = null;
let figmaClient = null;

// 初始化 API 客户端
async function initFigmaAPI() {
  try {
    // 动态导入模块（如果在插件环境中）
    const { FigmaAPIService } = await import('./packages/plugin/src/services/figmaAPI.js');
    const { createFigmaAPIClient } = await import('./packages/plugin/src/services/figmaAPIClient.js');
    
    figmaAPI = new FigmaAPIService();
    figmaClient = createFigmaAPIClient(figmaAPI, {
      validateInputs: true,
      enableEventListening: true
    });
    
    console.log('✅ Figma API 客户端初始化成功');
    
    // 添加事件监听器
    figmaClient.addEventListener('element_created', (data) => {
      console.log('🎉 元素已创建:', data);
    });
    
    figmaClient.addEventListener('element_updated', (data) => {
      console.log('🔄 元素已更新:', data);
    });
    
    figmaClient.addEventListener('element_deleted', (data) => {
      console.log('🗑️ 元素已删除:', data);
    });
    
    return figmaClient;
  } catch (error) {
    console.error('❌ 初始化失败:', error);
    console.log('💡 请确保在 Figma 插件环境中运行此脚本');
  }
}

// ========================================
// 页面信息测试函数
// ========================================

async function testGetPageInfo() {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 获取页面信息...');
    const pageInfo = await figmaClient.getCurrentPageInfo();
    
    console.log('✅ 页面信息:', {
      name: pageInfo.name,
      elementCount: pageInfo.elements.length,
      selectionCount: pageInfo.selection.length,
      editorType: pageInfo.editorType
    });
    
    console.log('📊 元素列表:', pageInfo.elements.map(el => ({
      id: el.id,
      name: el.name,
      type: el.type,
      position: { x: el.x, y: el.y },
      size: { width: el.width, height: el.height }
    })));
    
    return pageInfo;
  } catch (error) {
    console.error('❌ 获取页面信息失败:', error);
  }
}

async function testGetSelectedElements() {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 获取选中元素...');
    const elements = await figmaClient.getSelectedElements();
    
    console.log(`✅ 选中 ${elements.length} 个元素:`);
    elements.forEach((el, index) => {
      console.log(`  ${index + 1}. ${el.name} (${el.type}) - ID: ${el.id}`);
    });
    
    return elements;
  } catch (error) {
    console.error('❌ 获取选中元素失败:', error);
  }
}

async function testGetPageStatistics() {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 获取页面统计...');
    const stats = await figmaClient.getPageStatistics();
    
    console.log('✅ 页面统计:', {
      totalElements: stats.totalElements,
      visibleCount: stats.visibleCount,
      lockedCount: stats.lockedCount,
      selectedCount: stats.selectedCount,
      totalArea: Math.round(stats.totalArea) + ' px²',
      elementsByType: stats.elementsByType
    });
    
    return stats;
  } catch (error) {
    console.error('❌ 获取页面统计失败:', error);
  }
}

// ========================================
// 元素创建测试函数
// ========================================

async function testCreateStickyNote(text = '测试便签', options = {}) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 创建便签...');
    const stickyOptions = {
      text: text + ' - ' + new Date().toLocaleTimeString(),
      x: Math.random() * 200,
      y: Math.random() * 200,
      color: 'yellow',
      width: 200,
      height: 200,
      ...options
    };
    
    const result = await figmaClient.createStickyNote(stickyOptions);
    console.log('✅ 便签创建成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 创建便签失败:', error);
  }
}

async function testCreateRectangle(options = {}) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 创建矩形...');
    const rectOptions = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 100,
      height: 80,
      name: '测试矩形',
      fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 1 } }],
      cornerRadius: 10,
      ...options
    };
    
    const result = await figmaClient.createRectangle(rectOptions);
    console.log('✅ 矩形创建成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 创建矩形失败:', error);
  }
}

async function testCreateEllipse(options = {}) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 创建椭圆...');
    const ellipseOptions = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: 120,
      height: 120,
      name: '测试椭圆',
      fills: [{ type: 'SOLID', color: { r: 1, g: 0.4, b: 0.7 } }],
      ...options
    };
    
    const result = await figmaClient.createEllipse(ellipseOptions);
    console.log('✅ 椭圆创建成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 创建椭圆失败:', error);
  }
}

async function testCreateText(text = 'Hello Figma API!', options = {}) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  try {
    console.log('🔄 创建文本...');
    const textOptions = {
      text: text,
      x: Math.random() * 200,
      y: Math.random() * 200,
      fontSize: 24,
      fontFamily: 'Inter',
      fontWeight: 'Bold',
      textAlign: 'CENTER',
      textColor: { r: 0.1, g: 0.1, b: 0.1 },
      name: '测试文本',
      ...options
    };
    
    const result = await figmaClient.createText(textOptions);
    console.log('✅ 文本创建成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 创建文本失败:', error);
  }
}

// ========================================
// 元素管理测试函数
// ========================================

async function testUpdateElement(elementId, properties = {}) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  if (!elementId) {
    console.log('❌ 请提供元素ID');
    return;
  }
  
  try {
    console.log('🔄 更新元素...');
    const defaultProperties = {
      x: Math.random() * 50 + 100,
      y: Math.random() * 50 + 100,
      opacity: 0.8,
      name: '已更新的元素 - ' + new Date().toLocaleTimeString()
    };
    
    const updateProperties = { ...defaultProperties, ...properties };
    const result = await figmaClient.updateElement(elementId, updateProperties);
    console.log('✅ 元素更新成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 更新元素失败:', error);
  }
}

async function testDuplicateElement(elementId, offsetX = 30, offsetY = 30) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  if (!elementId) {
    console.log('❌ 请提供元素ID');
    return;
  }
  
  try {
    console.log('🔄 复制元素...');
    const result = await figmaClient.duplicateElement(elementId, offsetX, offsetY);
    console.log('✅ 元素复制成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 复制元素失败:', error);
  }
}

async function testDeleteElement(elementId) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  if (!elementId) {
    console.log('❌ 请提供元素ID');
    return;
  }
  
  try {
    console.log('🔄 删除元素...');
    const result = await figmaClient.deleteElement(elementId);
    console.log('✅ 元素删除成功');
    return result;
  } catch (error) {
    console.error('❌ 删除元素失败:', error);
  }
}

async function testSelectElements(elementIds) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  if (!elementIds || !Array.isArray(elementIds) || elementIds.length === 0) {
    console.log('❌ 请提供元素ID数组');
    return;
  }
  
  try {
    console.log('🔄 选择元素...');
    const result = await figmaClient.selectElements(elementIds);
    console.log(`✅ 选择了 ${elementIds.length} 个元素`);
    return result;
  } catch (error) {
    console.error('❌ 选择元素失败:', error);
  }
}

// ========================================
// 布局测试函数
// ========================================

async function testArrangeElements(elementIds, direction = 'horizontal', spacing = 20) {
  if (!figmaClient) {
    console.log('❌ 请先运行 initFigmaAPI()');
    return;
  }
  
  if (!elementIds || !Array.isArray(elementIds) || elementIds.length < 2) {
    console.log('❌ 请提供至少2个元素ID');
    return;
  }
  
  try {
    console.log(`🔄 ${direction} 排列元素...`);
    const layoutOptions = {
      direction: direction,
      spacing: spacing,
      padding: 10
    };
    
    if (direction === 'grid') {
      layoutOptions.columns = 3;
    }
    
    const result = await figmaClient.arrangeElements(elementIds, layoutOptions);
    console.log('✅ 元素排列成功:', result);
    return result;
  } catch (error) {
    console.error('❌ 排列元素失败:', error);
  }
}

// ========================================
// 综合测试函数
// ========================================

async function runBasicTests() {
  console.log('🚀 开始基础测试...\n');
  
  if (!figmaClient) {
    console.log('🔄 初始化 API 客户端...');
    await initFigmaAPI();
  }
  
  if (!figmaClient) {
    console.log('❌ 无法初始化 API 客户端');
    return;
  }
  
  try {
    // 1. 获取页面信息
    console.log('\n1️⃣ 测试页面信息...');
    const pageInfo = await testGetPageInfo();
    
    // 2. 创建一些元素
    console.log('\n2️⃣ 创建测试元素...');
    const sticky = await testCreateStickyNote('基础测试便签');
    const rect = await testCreateRectangle();
    const ellipse = await testCreateEllipse();
    const text = await testCreateText('Hello Test!');
    
    // 3. 获取统计信息
    console.log('\n3️⃣ 获取页面统计...');
    await testGetPageStatistics();
    
    // 4. 选择元素
    if (rect && ellipse) {
      console.log('\n4️⃣ 测试元素选择...');
      await testSelectElements([rect.elementId, ellipse.elementId]);
    }
    
    // 5. 更新元素
    if (text) {
      console.log('\n5️⃣ 测试元素更新...');
      await testUpdateElement(text.elementId, { 
        text: '已更新的文本!',
        fontSize: 32,
        textColor: { r: 1, g: 0, b: 0 }
      });
    }
    
    // 6. 复制元素
    if (sticky) {
      console.log('\n6️⃣ 测试元素复制...');
      await testDuplicateElement(sticky.elementId);
    }
    
    console.log('\n✅ 基础测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
  }
}

async function runLayoutTests() {
  console.log('🎨 开始布局测试...\n');
  
  if (!figmaClient) {
    await initFigmaAPI();
  }
  
  try {
    // 创建多个元素用于布局测试
    console.log('🔄 创建布局测试元素...');
    const elements = [];
    
    for (let i = 0; i < 6; i++) {
      const rect = await testCreateRectangle({
        name: `布局测试矩形 ${i + 1}`,
        fills: [{ 
          type: 'SOLID', 
          color: { 
            r: Math.random(), 
            g: Math.random(), 
            b: Math.random() 
          } 
        }]
      });
      if (rect) elements.push(rect.elementId);
    }
    
    if (elements.length >= 6) {
      // 测试水平排列
      console.log('\n1️⃣ 测试水平排列...');
      await testArrangeElements(elements.slice(0, 3), 'horizontal', 15);
      
      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 测试垂直排列
      console.log('\n2️⃣ 测试垂直排列...');
      await testArrangeElements(elements.slice(3, 6), 'vertical', 15);
      
      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 测试网格排列
      console.log('\n3️⃣ 测试网格排列...');
      await testArrangeElements(elements, 'grid', 10);
    }
    
    console.log('\n✅ 布局测试完成！');
    
  } catch (error) {
    console.error('❌ 布局测试失败:', error);
  }
}

// ========================================
// 帮助函数
// ========================================

function showHelp() {
  console.log(`
🧪 Figma API 测试脚本帮助

📋 初始化:
  initFigmaAPI()                    - 初始化 API 客户端

📊 页面信息:
  testGetPageInfo()                 - 获取当前页面信息
  testGetSelectedElements()         - 获取选中的元素
  testGetPageStatistics()          - 获取页面统计信息

➕ 创建元素:
  testCreateStickyNote(text)        - 创建便签
  testCreateRectangle()             - 创建矩形
  testCreateEllipse()               - 创建椭圆
  testCreateText(text)              - 创建文本

🔧 元素管理:
  testUpdateElement(id, props)      - 更新元素属性
  testDuplicateElement(id)          - 复制元素
  testDeleteElement(id)             - 删除元素
  testSelectElements([id1, id2])    - 选择元素

📐 布局排列:
  testArrangeElements(ids, dir)     - 排列元素 (horizontal/vertical/grid)

🚀 综合测试:
  runBasicTests()                   - 运行基础功能测试
  runLayoutTests()                  - 运行布局功能测试

💡 使用示例:
  await initFigmaAPI();
  await runBasicTests();
  await testCreateText('你好世界');
  `);
}

// 导出到全局作用域
if (typeof window !== 'undefined') {
  window.FigmaAPITester = {
    initFigmaAPI,
    testGetPageInfo,
    testGetSelectedElements,
    testGetPageStatistics,
    testCreateStickyNote,
    testCreateRectangle,
    testCreateEllipse,
    testCreateText,
    testUpdateElement,
    testDuplicateElement,
    testDeleteElement,
    testSelectElements,
    testArrangeElements,
    runBasicTests,
    runLayoutTests,
    showHelp
  };
}

// 自动显示帮助
console.log('🧪 Figma API 测试脚本已加载');
console.log('运行 showHelp() 查看所有可用函数');
console.log('运行 initFigmaAPI() 开始测试');