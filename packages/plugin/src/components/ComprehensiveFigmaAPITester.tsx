/** @jsx h */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button, Text, Textbox, Dropdown, DropdownOption } from "@create-figma-plugin/ui";
import { FigmaAPIService } from "../services/figmaAPI";
import { FigmaAPIClient, createFigmaAPIClient } from "../services/figmaAPIClient";
import {
  StickyNoteCreateOptions,
  ShapeCreateOptions,
  TextCreateOptions,
  ConnectorCreateOptions,
  ElementUpdateOptions,
  FigmaElement,
  PageInfo
} from "../../../common/src/types/figma.types";

interface TestResult {
  timestamp: string;
  operation: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

interface TestParameters {
  [key: string]: any;
}

export function ComprehensiveFigmaAPITester() {
  const [apiClient, setApiClient] = useState<FigmaAPIClient | null>(null);
  const [apiService, setApiService] = useState<FigmaAPIService | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [selectedElements, setSelectedElements] = useState<FigmaElement[]>([]);
  const [activeTab, setActiveTab] = useState<string>('page-info');
  const [parameters, setParameters] = useState<TestParameters>({});

  // Initialize API client
  useEffect(() => {
    const service = new FigmaAPIService();
    const client = createFigmaAPIClient(service, {
      validateInputs: true,
      enableEventListening: true
    });
    setApiService(service);
    setApiClient(client);

    // Add event listeners
    client.addEventListener('element_created', (data: any) => {
      addTestResult('info', `元素已创建: ${data.elementId}`, data);
    });

    client.addEventListener('element_updated', (data: any) => {
      addTestResult('info', `元素已更新: ${data.elementId}`, data);
    });

    client.addEventListener('element_deleted', (data: any) => {
      addTestResult('info', `元素已删除: ${data.elementId}`, data);
    });

    return () => {
      client.clearCache();
    };
  }, []);

  const addTestResult = (status: 'success' | 'error' | 'info', message: string, data?: any) => {
    const result: TestResult = {
      timestamp: new Date().toLocaleTimeString(),
      operation: activeTab,
      status,
      message,
      data
    };
    setTestResults(prev => [result, ...prev].slice(0, 100)); // Keep last 100 results
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const executeTest = async (testFunction: () => Promise<void>) => {
    if (!apiClient) {
      addTestResult('error', 'API客户端未初始化');
      return;
    }

    try {
      await testFunction();
    } catch (error) {
      addTestResult('error', error instanceof Error ? error.message : '未知错误');
    }
  };

  const updateParameter = (key: string, value: any) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  const getParameter = (key: string, defaultValue: any = '') => {
    return parameters[key] ?? defaultValue;
  };

  // ========================================
  // Page Information Tests
  // ========================================
  
  const testGetPageInfo = () => executeTest(async () => {
    addTestResult('info', '🔄 获取页面信息...');
    const info = await apiClient!.getCurrentPageInfo();
    setPageInfo(info);
    addTestResult('success', `✅ 页面信息获取成功: ${info.name} (${info.elements.length} 个元素)`, info);
  });

  const testGetSelectedElements = () => executeTest(async () => {
    addTestResult('info', '🔄 获取选中元素...');
    const elements = await apiClient!.getSelectedElements();
    setSelectedElements(elements);
    addTestResult('success', `✅ 选中元素: ${elements.length} 个`, elements);
  });

  const testGetPageStatistics = () => executeTest(async () => {
    addTestResult('info', '🔄 获取页面统计...');
    const stats = await apiClient!.getPageStatistics();
    addTestResult('success', `✅ 统计信息: 总元素${stats.totalElements}, 可见${stats.visibleCount}, 锁定${stats.lockedCount}`, stats);
  });

  const testQueryElements = () => executeTest(async () => {
    const nodeType = getParameter('queryType', 'STICKY');
    const namePattern = getParameter('queryPattern', '');
    
    addTestResult('info', `🔄 查询${nodeType}元素${namePattern ? ` (名称: ${namePattern})` : ''}...`);
    
    let elements;
    if (namePattern) {
      elements = await apiClient!.searchElementsByName(namePattern);
    } else {
      elements = await apiClient!.getElementsByType(nodeType as any);
    }
    
    addTestResult('success', `✅ 查询到${elements.length}个元素`, elements);
  });

  // ========================================
  // Basic Element Creation Tests
  // ========================================

  const testCreateStickyNote = () => executeTest(async () => {
    const options: StickyNoteCreateOptions = {
      text: getParameter('stickyText', `测试便签 - ${new Date().toLocaleTimeString()}`),
      x: Math.random() * 200,
      y: Math.random() * 200,
      color: getParameter('stickyColor', 'yellow') as any,
      width: parseInt(getParameter('stickyWidth', '200')),
      height: parseInt(getParameter('stickyHeight', '200'))
    };
    
    addTestResult('info', '🔄 创建便签...');
    const result = await apiClient!.createStickyNote(options);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testCreateRectangle = () => executeTest(async () => {
    const options: ShapeCreateOptions = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: parseInt(getParameter('rectWidth', '100')),
      height: parseInt(getParameter('rectHeight', '80')),
      name: getParameter('rectName', '测试矩形'),
      fills: [{ type: 'SOLID', color: { 
        r: parseFloat(getParameter('rectColorR', '0.2')),
        g: parseFloat(getParameter('rectColorG', '0.6')), 
        b: parseFloat(getParameter('rectColorB', '1'))
      }}],
      cornerRadius: parseInt(getParameter('rectCornerRadius', '10'))
    };
    
    addTestResult('info', '🔄 创建矩形...');
    const result = await apiClient!.createRectangle(options);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testCreateEllipse = () => executeTest(async () => {
    const options: ShapeCreateOptions = {
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: parseInt(getParameter('ellipseSize', '120')),
      height: parseInt(getParameter('ellipseSize', '120')),
      name: getParameter('ellipseName', '测试椭圆'),
      fills: [{ type: 'SOLID', color: { 
        r: parseFloat(getParameter('ellipseColorR', '1')),
        g: parseFloat(getParameter('ellipseColorG', '0.4')), 
        b: parseFloat(getParameter('ellipseColorB', '0.7'))
      }}]
    };
    
    addTestResult('info', '🔄 创建椭圆...');
    const result = await apiClient!.createEllipse(options);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testCreateText = () => executeTest(async () => {
    const options: TextCreateOptions = {
      text: getParameter('textContent', 'Hello Figma API! 你好世界！'),
      x: Math.random() * 200,
      y: Math.random() * 200,
      fontSize: parseInt(getParameter('fontSize', '24')),
      fontFamily: getParameter('fontFamily', 'Inter'),
      fontWeight: getParameter('fontWeight', 'Bold') as any,
      textAlign: getParameter('textAlign', 'CENTER') as any,
      textColor: { 
        r: parseFloat(getParameter('textColorR', '0.1')),
        g: parseFloat(getParameter('textColorG', '0.1')), 
        b: parseFloat(getParameter('textColorB', '0.1'))
      },
      name: getParameter('textName', '测试文本')
    };
    
    addTestResult('info', '🔄 创建文本...');
    const result = await apiClient!.createText(options);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testCreateConnector = () => executeTest(async () => {
    // 检查编辑器类型
    if (pageInfo && pageInfo.editorType !== 'figjam') {
      addTestResult('error', '❌ 连接器只能在 FigJam 中创建，请在 FigJam 中测试此功能');
      return;
    }

    // 检查选中元素数量
    if (selectedElements.length < 2) {
      addTestResult('error', '❌ 请先选择至少2个元素来创建连接器');
      addTestResult('info', '💡 提示：先创建2个便签或其他元素，然后选中它们再创建连接器');
      return;
    }

    addTestResult('info', `📋 准备连接: ${selectedElements[0].name} → ${selectedElements[1].name}`);

    const options: ConnectorCreateOptions = {
      startElementId: selectedElements[0].id,
      endElementId: selectedElements[1].id,
      strokeWeight: parseFloat(getParameter('connectorStrokeWeight', '2')),
      strokeColor: { 
        r: parseFloat(getParameter('connectorColorR', '0')),
        g: parseFloat(getParameter('connectorColorG', '0')), 
        b: parseFloat(getParameter('connectorColorB', '0'))
      }
    };
    
    addTestResult('info', '🔄 创建连接器...');
    const result = await apiClient!.createConnector(options);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  // ========================================
  // Element Management Tests
  // ========================================

  const testUpdateElement = () => executeTest(async () => {
    if (selectedElements.length === 0) {
      addTestResult('error', '❌ 请先选择一个元素');
      return;
    }

    const element = selectedElements[0];
    const updateOptions: ElementUpdateOptions = {
      x: element.x + parseInt(getParameter('updateOffsetX', '20')),
      y: element.y + parseInt(getParameter('updateOffsetY', '20')),
      opacity: parseFloat(getParameter('updateOpacity', '0.8')),
      name: getParameter('updateName', element.name + ' (已更新)')
    };
    
    addTestResult('info', `🔄 更新元素: ${element.name}...`);
    const result = await apiClient!.updateElement(element.id, updateOptions);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testDuplicateElement = () => executeTest(async () => {
    if (selectedElements.length === 0) {
      addTestResult('error', '❌ 请先选择一个元素');
      return;
    }

    const element = selectedElements[0];
    const offsetX = parseInt(getParameter('duplicateOffsetX', '30'));
    const offsetY = parseInt(getParameter('duplicateOffsetY', '30'));
    
    addTestResult('info', `🔄 复制元素: ${element.name}...`);
    const result = await apiClient!.duplicateElement(element.id, offsetX, offsetY);
    addTestResult('success', `✅ ${result.message}`, result);
  });

  const testDeleteElements = () => executeTest(async () => {
    if (selectedElements.length === 0) {
      addTestResult('error', '❌ 请先选择要删除的元素');
      return;
    }

    const elementIds = selectedElements.map(el => el.id);
    addTestResult('info', `🔄 删除 ${selectedElements.length} 个元素...`);
    const result = await apiClient!.deleteElements(elementIds);
    addTestResult('success', `✅ ${result.message} (成功:${result.successful.length}, 失败:${result.failed.length})`, result);
  });

  // ========================================
  // Layout and Arrangement Tests
  // ========================================

  const testArrangeElements = () => executeTest(async () => {
    if (selectedElements.length < 2) {
      addTestResult('error', '❌ 请先选择至少2个元素进行排列');
      addTestResult('info', '💡 提示：先创建一些元素，然后选中多个元素再进行排列测试');
      return;
    }

    const direction = getParameter('arrangeDirection', 'horizontal');
    const spacing = parseInt(getParameter('arrangeSpacing', '20'));
    const padding = parseInt(getParameter('arrangePadding', '10'));
    
    const elementIds = selectedElements.map(el => el.id);
    addTestResult('info', `📋 将排列元素: ${selectedElements.map(el => el.name).join(', ')}`);
    addTestResult('info', `🔄 ${direction}排列${elementIds.length}个元素...`);
    
    const result = await apiClient!.arrangeElements(elementIds, {
      direction: direction as any,
      spacing,
      padding,
      columns: direction === 'grid' ? parseInt(getParameter('arrangeColumns', '3')) : undefined
    });
    
    addTestResult('success', `✅ ${result.message}`, result);
  });

  // ========================================
  // Advanced Creation Tests  
  // ========================================

  const testCreateBatchStickies = () => executeTest(async () => {
    if (!apiService) return;
    
    const count = parseInt(getParameter('batchCount', '3'));
    const layout = getParameter('batchLayout', 'ROW');
    const spacing = parseInt(getParameter('batchSpacing', '20'));
    
    const data = {
      items: Array.from({length: count}, (_, i) => ({
        text: `批量便签 ${i + 1}`,
        color: ['yellow', 'green', 'blue', 'pink', 'orange'][i % 5] as any
      })),
      layout: layout as any,
      spacing,
      startPosition: { x: 100, y: 100 }
    };
    
    addTestResult('info', `🔄 批量创建${count}个便签 (${layout}布局)...`);
    const response = await apiService.sendAPICall('create_sticky_batch', 'batch-test', data);
    if (response.success) {
      addTestResult('success', `✅ 批量创建成功`, response.result);
    } else {
      addTestResult('error', `❌ 批量创建失败: ${response.error}`);
    }
  });

  const testCreateFlowchart = () => executeTest(async () => {
    if (!apiService) return;
    
    // 检查流程图创建的前置条件
    addTestResult('info', '🔍 检查流程图创建条件...');
    addTestResult('info', `📋 当前编辑器: ${pageInfo?.editorType || '未知'}`);
    
    const nodeCount = parseInt(getParameter('flowchartNodes', '4'));
    
    if (nodeCount < 1 || nodeCount > 20) {
      addTestResult('error', '❌ 节点数量必须在 1-20 之间');
      return;
    }
    
    const spacingValue = parseInt(getParameter('flowchartSpacing', '60'));
    const layoutValue = getParameter('flowchartLayout', 'vertical');
    
    const data = {
      nodes: Array.from({length: nodeCount}, (_, i) => ({
        id: `node_${i}`,
        text: `流程 ${i + 1}`,
        type: ['start', 'process', 'decision', 'end'][i % 4] as any
      })),
      connections: Array.from({length: nodeCount - 1}, (_, i) => ({
        from: `node_${i}`,
        to: `node_${i + 1}`,
        label: `步骤 ${i + 1}`
      })),
      layout: layoutValue === 'vertical' ? 'TOP_TO_BOTTOM' : 'LEFT_TO_RIGHT',
      spacing: { x: spacingValue, y: spacingValue },
      startPosition: { x: 100, y: 100 }
    };
    
    addTestResult('info', `📊 创建数据: ${nodeCount}个节点, ${data.connections.length}个连接`);
    addTestResult('info', `🔄 创建${nodeCount}节点流程图...`);
    
    const response = await apiService.sendAPICall('create_flowchart', 'flowchart-test', data);
    if (response.success) {
      addTestResult('success', `✅ 流程图创建成功`, response.result);
      addTestResult('info', `💡 提示: 请查看画布上是否出现了流程图元素`);
      
      // 刷新页面信息以显示新创建的元素
      setTimeout(() => {
        testGetPageInfo();
      }, 1000);
    } else {
      addTestResult('error', `❌ 流程图创建失败: ${response.error}`);
      addTestResult('info', `🔍 可能的原因: 1) 工具函数缺失 2) 编辑器类型限制 3) 权限问题`);
    }
  });

  const testCreateMindMap = () => executeTest(async () => {
    if (!apiService) return;
    
    const branchCount = parseInt(getParameter('mindmapBranches', '4'));
    
    const data = {
      centralTopic: getParameter('mindmapTopic', '中心主题'),
      branches: Array.from({length: branchCount}, (_, i) => ({
        text: `分支 ${i + 1}`,
        color: ['blue', 'green', 'red', 'purple', 'orange'][i % 5],
        children: [`子项 ${i + 1}.1`, `子项 ${i + 1}.2`]
      })),
      startPosition: { x: 200, y: 200 },
      branchSpacing: parseInt(getParameter('mindmapSpacing', '80'))
    };
    
    addTestResult('info', `🔄 创建思维导图 (${branchCount}个分支)...`);
    const response = await apiService.sendAPICall('create_mindmap', 'mindmap-test', data);
    if (response.success) {
      addTestResult('success', `✅ 思维导图创建成功`, response.result);
    } else {
      addTestResult('error', `❌ 思维导图创建失败: ${response.error}`);
    }
  });

  // ========================================
  // Advanced Shapes Tests
  // ========================================

  const testCreateAdvancedShape = () => executeTest(async () => {
    if (!apiService) return;
    
    const shapeType = getParameter('advancedShapeType', 'polygon');
    
    const data = shapeType === 'polygon' ? {
      pointCount: parseInt(getParameter('polygonPoints', '6')),
      x: Math.random() * 200,
      y: Math.random() * 200,
      size: parseInt(getParameter('polygonSize', '100')),
      name: `${getParameter('polygonPoints', '6')}边形`
    } : shapeType === 'star' ? {
      pointCount: parseInt(getParameter('starPoints', '5')),
      innerRadius: parseFloat(getParameter('starInnerRadius', '0.4')),
      x: Math.random() * 200,
      y: Math.random() * 200,
      size: parseInt(getParameter('starSize', '100')),
      name: `${getParameter('starPoints', '5')}角星`
    } : {
      text: getParameter('shapeText', '形状文字'),
      shapeType: getParameter('shapeWithTextType', 'rectangle'),
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: parseInt(getParameter('shapeWithTextWidth', '120')),
      height: parseInt(getParameter('shapeWithTextHeight', '60'))
    };
    
    addTestResult('info', `🔄 创建高级形状: ${shapeType}...`);
    const response = await apiService.sendAPICall(`create_${shapeType}`, 'advanced-shape-test', data);
    if (response.success) {
      addTestResult('success', `✅ ${shapeType}创建成功`, response.result);
    } else {
      addTestResult('error', `❌ ${shapeType}创建失败: ${response.error}`);
    }
  });

  const testCreateFrame = () => executeTest(async () => {
    if (!apiService) return;
    
    const data = {
      name: getParameter('frameName', '测试框架'),
      x: Math.random() * 200,
      y: Math.random() * 200,
      width: parseInt(getParameter('frameWidth', '200')),
      height: parseInt(getParameter('frameHeight', '150')),
      backgroundColor: {
        r: parseFloat(getParameter('frameColorR', '0.95')),
        g: parseFloat(getParameter('frameColorG', '0.95')),
        b: parseFloat(getParameter('frameColorB', '0.95'))
      }
    };
    
    addTestResult('info', '🔄 创建框架容器...');
    const response = await apiService.sendAPICall('create_frame', 'frame-test', data);
    if (response.success) {
      addTestResult('success', `✅ 框架创建成功`, response.result);
    } else {
      addTestResult('error', `❌ 框架创建失败: ${response.error}`);
    }
  });

  // ========================================
  // Grouping Tests
  // ========================================

  const testGroupElements = () => executeTest(async () => {
    if (!apiService) return;
    
    if (selectedElements.length < 2) {
      addTestResult('error', '❌ 请先选择至少2个元素进行分组');
      return;
    }

    const data = {
      nodeIds: selectedElements.map(el => el.id),
      groupName: getParameter('groupName', '测试分组')
    };
    
    addTestResult('info', `🔄 分组${selectedElements.length}个元素...`);
    const response = await apiService.sendAPICall('group_elements', 'group-test', data);
    if (response.success) {
      addTestResult('success', `✅ 元素分组成功`, response.result);
    } else {
      addTestResult('error', `❌ 元素分组失败: ${response.error}`);
    }
  });

  const testUngroupElements = () => executeTest(async () => {
    if (!apiService) return;
    
    if (selectedElements.length === 0) {
      addTestResult('error', '❌ 请先选择一个分组来解散');
      return;
    }

    const groupElement = selectedElements.find(el => el.type === 'GROUP');
    if (!groupElement) {
      addTestResult('error', '❌ 选中的元素中没有分组');
      return;
    }

    const data = {
      groupId: groupElement.id
    };
    
    addTestResult('info', `🔄 解散分组: ${groupElement.name}...`);
    const response = await apiService.sendAPICall('ungroup_elements', 'ungroup-test', data);
    if (response.success) {
      addTestResult('success', `✅ 分组解散成功`, response.result);
    } else {
      addTestResult('error', `❌ 分组解散失败: ${response.error}`);
    }
  });

  // ========================================
  // UI Rendering
  // ========================================

  const tabs = [
    { id: 'page-info', label: '📄 页面信息' },
    { id: 'basic-creation', label: '➕ 基础创建' },
    { id: 'element-management', label: '🔧 元素管理' },
    { id: 'layout', label: '📐 布局排列' },
    { id: 'advanced-creation', label: '🚀 高级创建' },
    { id: 'grouping', label: '📦 分组操作' },
  ];

  const renderParameterInput = (key: string, label: string, type: 'text' | 'number' | 'select' = 'text', options?: DropdownOption[]) => {
    if (type === 'select' && options) {
      return (
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ fontSize: '12px', marginBottom: '4px' }}>{label}:</Text>
          <Dropdown
            options={options}
            value={getParameter(key, typeof options[0] === 'object' ? (options[0] as any).value : options[0])}
            onChange={(event) => updateParameter(key, event.currentTarget.value)}
          />
        </div>
      );
    }

    return (
      <div style={{ marginBottom: '8px' }}>
        <Text style={{ fontSize: '12px', marginBottom: '4px' }}>{label}:</Text>
        <Textbox
          value={getParameter(key).toString()}
          onInput={(event) => updateParameter(key, type === 'number' ? parseFloat(event.currentTarget.value) || 0 : event.currentTarget.value)}
          placeholder={type === 'number' ? '0' : '请输入...'}
        />
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'page-info':
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testGetPageInfo}>获取页面信息</Button>
              <Button onClick={testGetSelectedElements}>获取选中元素</Button>
              <Button onClick={testGetPageStatistics}>获取统计信息</Button>
              <Button onClick={testQueryElements}>查询元素</Button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>查询参数</Text>
              {renderParameterInput('queryType', '元素类型', 'select', [
                { value: 'STICKY', text: '便签' },
                { value: 'RECTANGLE', text: '矩形' },
                { value: 'ELLIPSE', text: '椭圆' },
                { value: 'TEXT', text: '文本' },
                { value: 'GROUP', text: '分组' },
                { value: 'FRAME', text: '框架' }
              ])}
              {renderParameterInput('queryPattern', '名称模式 (可选)')}
            </div>
          </div>
        );

      case 'basic-creation':
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testCreateStickyNote}>创建便签</Button>
              <Button onClick={testCreateRectangle}>创建矩形</Button>
              <Button onClick={testCreateEllipse}>创建椭圆</Button>
              <Button onClick={testCreateText}>创建文本</Button>
              <Button onClick={testCreateConnector}>创建连接器</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Sticky Note Parameters */}
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>便签参数</Text>
                {renderParameterInput('stickyText', '文本内容')}
                {renderParameterInput('stickyColor', '颜色', 'select', [
                  { value: 'yellow', text: '黄色' },
                  { value: 'green', text: '绿色' },
                  { value: 'blue', text: '蓝色' },
                  { value: 'pink', text: '粉色' },
                  { value: 'orange', text: '橙色' }
                ])}
                {renderParameterInput('stickyWidth', '宽度', 'number')}
                {renderParameterInput('stickyHeight', '高度', 'number')}
              </div>

              {/* Rectangle Parameters */}
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>矩形参数</Text>
                {renderParameterInput('rectName', '名称')}
                {renderParameterInput('rectWidth', '宽度', 'number')}
                {renderParameterInput('rectHeight', '高度', 'number')}
                {renderParameterInput('rectCornerRadius', '圆角', 'number')}
                {renderParameterInput('rectColorR', '红色值 (0-1)', 'number')}
                {renderParameterInput('rectColorG', '绿色值 (0-1)', 'number')}
                {renderParameterInput('rectColorB', '蓝色值 (0-1)', 'number')}
              </div>

              {/* Text Parameters */}
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>文本参数</Text>
                {renderParameterInput('textContent', '文本内容')}
                {renderParameterInput('textName', '名称')}
                {renderParameterInput('fontSize', '字体大小', 'number')}
                {renderParameterInput('fontFamily', '字体')}
                {renderParameterInput('fontWeight', '字重', 'select', [
                  { value: 'Regular', text: '常规' },
                  { value: 'Bold', text: '粗体' },
                  { value: 'Light', text: '细体' }
                ])}
                {renderParameterInput('textAlign', '对齐', 'select', [
                  { value: 'LEFT', text: '左对齐' },
                  { value: 'CENTER', text: '居中' },
                  { value: 'RIGHT', text: '右对齐' }
                ])}
              </div>

              {/* Connector Parameters */}
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>连接器参数</Text>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
                  <div>⚠️ 需要在 <strong>FigJam</strong> 中使用</div>
                  <div>📋 需要选中至少2个元素</div>
                  <div>当前: {pageInfo?.editorType || '未知'} | 选中: {selectedElements.length} 个</div>
                </div>
                {renderParameterInput('connectorStrokeWeight', '线条粗细', 'number')}
                {renderParameterInput('connectorColorR', '红色值 (0-1)', 'number')}
                {renderParameterInput('connectorColorG', '绿色值 (0-1)', 'number')}
                {renderParameterInput('connectorColorB', '蓝色值 (0-1)', 'number')}
              </div>
            </div>
          </div>
        );

      case 'element-management':
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testUpdateElement}>更新元素</Button>
              <Button onClick={testDuplicateElement}>复制元素</Button>
              <Button onClick={testDeleteElements} secondary>删除元素</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>更新参数</Text>
                {renderParameterInput('updateOffsetX', 'X偏移', 'number')}
                {renderParameterInput('updateOffsetY', 'Y偏移', 'number')}
                {renderParameterInput('updateOpacity', '透明度 (0-1)', 'number')}
                {renderParameterInput('updateName', '新名称')}
              </div>

              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>复制参数</Text>
                {renderParameterInput('duplicateOffsetX', 'X偏移', 'number')}
                {renderParameterInput('duplicateOffsetY', 'Y偏移', 'number')}
              </div>
            </div>
          </div>
        );

      case 'layout':
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testArrangeElements}>排列元素</Button>
            </div>

            <div>
              <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>排列参数</Text>
              {renderParameterInput('arrangeDirection', '排列方向', 'select', [
                { value: 'horizontal', text: '水平' },
                { value: 'vertical', text: '垂直' },
                { value: 'grid', text: '网格' }
              ])}
              {renderParameterInput('arrangeSpacing', '间距', 'number')}
              {renderParameterInput('arrangePadding', '边距', 'number')}
              {renderParameterInput('arrangeColumns', '网格列数 (仅网格)', 'number')}
            </div>
          </div>
        );

      case 'advanced-creation':
        return (
          <div>
            <div style={{ marginBottom: '16px', padding: '12px', background: '#fff3cd', borderRadius: '6px', border: '1px solid #ffeaa7' }}>
              <Text style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', color: '#856404' }}>
                ⚠️ 高级创建功能说明
              </Text>
              <div style={{ fontSize: '12px', color: '#856404' }}>
                <div>• <strong>流程图/思维导图</strong>: 需要连接器功能，仅在 FigJam 中完全支持</div>
                <div>• <strong>批量便签</strong>: 仅在 FigJam 中支持</div>
                <div>• <strong>高级形状/框架</strong>: Figma 和 FigJam 均支持</div>
                <div>• 当前编辑器: <strong>{pageInfo?.editorType || '未知'}</strong></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testCreateBatchStickies}>批量便签</Button>
              <Button onClick={testCreateFlowchart}>流程图</Button>
              <Button onClick={testCreateMindMap}>思维导图</Button>
              <Button onClick={testCreateAdvancedShape}>高级形状</Button>
              <Button onClick={testCreateFrame}>创建框架</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>批量创建参数</Text>
                {renderParameterInput('batchCount', '数量', 'number')}
                {renderParameterInput('batchLayout', '布局', 'select', [
                  { value: 'ROW', text: '行' },
                  { value: 'COLUMN', text: '列' },
                  { value: 'GRID', text: '网格' }
                ])}
                {renderParameterInput('batchSpacing', '间距', 'number')}
              </div>

              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>流程图参数</Text>
                {renderParameterInput('flowchartNodes', '节点数', 'number')}
                {renderParameterInput('flowchartLayout', '布局', 'select', [
                  { value: 'vertical', text: '垂直' },
                  { value: 'horizontal', text: '水平' }
                ])}
                {renderParameterInput('flowchartSpacing', '间距', 'number')}
              </div>

              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>思维导图参数</Text>
                {renderParameterInput('mindmapTopic', '中心主题')}
                {renderParameterInput('mindmapBranches', '分支数', 'number')}
                {renderParameterInput('mindmapSpacing', '间距', 'number')}
              </div>

              <div>
                <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>高级形状参数</Text>
                {renderParameterInput('advancedShapeType', '形状类型', 'select', [
                  { value: 'polygon', text: '多边形' },
                  { value: 'star', text: '星形' },
                  { value: 'shape_with_text', text: '文字形状' }
                ])}
                {renderParameterInput('polygonPoints', '多边形边数', 'number')}
                {renderParameterInput('starPoints', '星形角数', 'number')}
                {renderParameterInput('starInnerRadius', '星形内半径 (0.1-0.9)', 'number')}
              </div>
            </div>
          </div>
        );

      case 'grouping':
        return (
          <div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <Button onClick={testGroupElements}>分组元素</Button>
              <Button onClick={testUngroupElements}>解散分组</Button>
            </div>

            <div>
              <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>分组参数</Text>
              {renderParameterInput('groupName', '分组名称')}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '16px', height: '100vh', overflow: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
          🧪 Figma API 综合测试工具
        </Text>
        <Button onClick={clearResults} secondary>清空结果</Button>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '4px', 
        marginBottom: '16px',
        borderBottom: '1px solid #ddd',
        paddingBottom: '8px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 12px',
              border: 'none',
              background: activeTab === tab.id ? '#007AFF' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#333',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginBottom: '16px' }}>
        {renderTabContent()}
      </div>

      {/* Results */}
      <div style={{ marginBottom: '16px' }}>
        <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>📋 测试结果 ({testResults.length}):</Text>
        <div style={{ 
          background: '#f8f8f8', 
          padding: '12px', 
          borderRadius: '4px',
          fontSize: '11px',
          fontFamily: 'monospace',
          height: '300px',
          overflow: 'auto',
          border: '1px solid #ddd'
        }}>
          {testResults.length === 0 ? (
            <div style={{ color: '#666' }}>准备就绪，请选择功能标签并点击测试按钮...</div>
          ) : (
            testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  marginBottom: '4px',
                  padding: '4px',
                  background: result.status === 'error' ? '#ffe6e6' : result.status === 'success' ? '#e6ffe6' : '#e6f3ff',
                  borderRadius: '2px',
                  borderLeft: `3px solid ${result.status === 'error' ? '#ff4444' : result.status === 'success' ? '#44ff44' : '#4444ff'}`
                }}
              >
                <div style={{ fontWeight: 'bold' }}>
                  [{result.timestamp}] {result.operation}
                </div>
                <div>{result.message}</div>
                {result.data && (
                  <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
                    数据: {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{ fontSize: '12px', color: '#666' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>页面: {pageInfo?.name || '未获取'} ({pageInfo?.editorType || 'Unknown'})</span>
          <span>元素: {pageInfo?.elements.length || 0} 个</span>
          <span>选中: {selectedElements.length} 个</span>
        </div>
        {selectedElements.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            选中元素: {selectedElements.map(el => `${el.name}(${el.type})`).join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}