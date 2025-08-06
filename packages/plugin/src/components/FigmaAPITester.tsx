/** @jsx h */
import { h } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Button, Text } from "@create-figma-plugin/ui";
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

export function FigmaAPITester() {
  const [apiClient, setApiClient] = useState<FigmaAPIClient | null>(null);
  const [testResult, setTestResult] = useState<string>("");
  const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);
  const [selectedElements, setSelectedElements] = useState<FigmaElement[]>([]);

  useEffect(() => {
    // 初始化 API 客户端
    const apiService = new FigmaAPIService();
    const client = createFigmaAPIClient(apiService, {
      validateInputs: true,
      enableEventListening: true
    });
    setApiClient(client);

    // 添加事件监听器
    client.addEventListener('element_created', (data: any) => {
      setTestResult(prev => prev + `\n✅ 元素已创建: ${data.elementId}`);
    });

    client.addEventListener('element_updated', (data: any) => {
      setTestResult(prev => prev + `\n✅ 元素已更新: ${data.elementId}`);
    });

    client.addEventListener('element_deleted', (data: any) => {
      setTestResult(prev => prev + `\n✅ 元素已删除: ${data.elementId}`);
    });

    return () => {
      client.clearCache();
    };
  }, []);

  const addResult = (message: string) => {
    setTestResult(prev => prev + `\n${message}`);
  };

  const clearResults = () => {
    setTestResult("");
  };

  // ========================================
  // 页面信息测试
  // ========================================

  const testGetPageInfo = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 获取页面信息...");
      const info = await apiClient.getCurrentPageInfo();
      setPageInfo(info);
      addResult(`✅ 页面信息获取成功: ${info.name} (${info.elements.length} 个元素)`);
      addResult(`📊 编辑器类型: ${info.editorType}`);
      addResult(`🎯 选中元素: ${info.selection.length} 个`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testGetSelectedElements = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 获取选中元素...");
      const elements = await apiClient.getSelectedElements();
      setSelectedElements(elements);
      addResult(`✅ 选中元素: ${elements.length} 个`);
      elements.forEach(el => {
        addResult(`  - ${el.name} (${el.type})`);
      });
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testGetPageStatistics = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 获取页面统计...");
      const stats = await apiClient.getPageStatistics();
      addResult(`✅ 统计信息:`);
      addResult(`  - 总元素: ${stats.totalElements}`);
      addResult(`  - 可见元素: ${stats.visibleCount}`);
      addResult(`  - 锁定元素: ${stats.lockedCount}`);
      addResult(`  - 选中元素: ${stats.selectedCount}`);
      addResult(`  - 总面积: ${Math.round(stats.totalArea)} px²`);
      
      Object.entries(stats.elementsByType).forEach(([type, count]) => {
        addResult(`  - ${type}: ${count} 个`);
      });
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // ========================================
  // 元素创建测试
  // ========================================

  const testCreateStickyNote = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 创建便签...");
      const options: StickyNoteCreateOptions = {
        text: "测试便签 - " + new Date().toLocaleTimeString(),
        x: Math.random() * 200,
        y: Math.random() * 200,
        color: 'yellow',
        width: 200,
        height: 200
      };
      
      const result = await apiClient.createStickyNote(options);
      addResult(`✅ ${result.message}`);
      addResult(`📝 元素ID: ${result.elementId}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testCreateRectangle = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 创建矩形...");
      const options: ShapeCreateOptions = {
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 100,
        height: 80,
        name: "测试矩形",
        fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 1 } }],
        cornerRadius: 10
      };
      
      const result = await apiClient.createRectangle(options);
      addResult(`✅ ${result.message}`);
      addResult(`📦 元素ID: ${result.elementId}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testCreateEllipse = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 创建椭圆...");
      const options: ShapeCreateOptions = {
        x: Math.random() * 200,
        y: Math.random() * 200,
        width: 120,
        height: 120,
        name: "测试椭圆",
        fills: [{ type: 'SOLID', color: { r: 1, g: 0.4, b: 0.7 } }]
      };
      
      const result = await apiClient.createEllipse(options);
      addResult(`✅ ${result.message}`);
      addResult(`⭕ 元素ID: ${result.elementId}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testCreateText = async () => {
    if (!apiClient) return;
    try {
      addResult("🔄 创建文本...");
      const options: TextCreateOptions = {
        text: "Hello Figma API! 你好世界！",
        x: Math.random() * 200,
        y: Math.random() * 200,
        fontSize: 24,
        fontFamily: "Inter",
        fontWeight: "Bold",
        textAlign: 'CENTER',
        textColor: { r: 0.1, g: 0.1, b: 0.1 },
        name: "测试文本"
      };
      
      const result = await apiClient.createText(options);
      addResult(`✅ ${result.message}`);
      addResult(`📝 元素ID: ${result.elementId}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // ========================================
  // 元素管理测试
  // ========================================

  const testUpdateSelectedElement = async () => {
    if (!apiClient || selectedElements.length === 0) {
      addResult("❌ 请先选择一个元素");
      return;
    }

    try {
      const element = selectedElements[0];
      addResult(`🔄 更新元素: ${element.name}...`);
      
      const updateOptions: ElementUpdateOptions = {
        x: element.x + 20,
        y: element.y + 20,
        opacity: 0.8,
        name: element.name + " (已更新)"
      };
      
      const result = await apiClient.updateElement(element.id, updateOptions);
      addResult(`✅ ${result.message}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testDuplicateSelectedElement = async () => {
    if (!apiClient || selectedElements.length === 0) {
      addResult("❌ 请先选择一个元素");
      return;
    }

    try {
      const element = selectedElements[0];
      addResult(`🔄 复制元素: ${element.name}...`);
      
      const result = await apiClient.duplicateElement(element.id, 30, 30);
      addResult(`✅ ${result.message}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testDeleteSelectedElements = async () => {
    if (!apiClient || selectedElements.length === 0) {
      addResult("❌ 请先选择元素");
      return;
    }

    try {
      addResult(`🔄 删除 ${selectedElements.length} 个元素...`);
      const elementIds = selectedElements.map(el => el.id);
      
      const result = await apiClient.deleteElements(elementIds);
      addResult(`✅ ${result.message}`);
      addResult(`✅ 成功删除: ${result.successful.length} 个`);
      addResult(`❌ 删除失败: ${result.failed.length} 个`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  // ========================================
  // 布局测试
  // ========================================

  const testArrangeHorizontally = async () => {
    if (!apiClient || selectedElements.length < 2) {
      addResult("❌ 请先选择至少2个元素");
      return;
    }

    try {
      addResult("🔄 水平排列元素...");
      const elementIds = selectedElements.map(el => el.id);
      
      const result = await apiClient.arrangeElements(elementIds, {
        direction: 'horizontal',
        spacing: 20,
        padding: 10
      });
      
      addResult(`✅ ${result.message}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testArrangeVertically = async () => {
    if (!apiClient || selectedElements.length < 2) {
      addResult("❌ 请先选择至少2个元素");
      return;
    }

    try {
      addResult("🔄 垂直排列元素...");
      const elementIds = selectedElements.map(el => el.id);
      
      const result = await apiClient.arrangeElements(elementIds, {
        direction: 'vertical',
        spacing: 15,
        padding: 10
      });
      
      addResult(`✅ ${result.message}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  const testArrangeGrid = async () => {
    if (!apiClient || selectedElements.length < 3) {
      addResult("❌ 请先选择至少3个元素");
      return;
    }

    try {
      addResult("🔄 网格排列元素...");
      const elementIds = selectedElements.map(el => el.id);
      
      const result = await apiClient.arrangeElements(elementIds, {
        direction: 'grid',
        spacing: 10,
        padding: 10,
        columns: 3
      });
      
      addResult(`✅ ${result.message}`);
    } catch (error) {
      addResult(`❌ 错误: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  };

  return (
    <div style={{ padding: "16px" }}>
      <Text style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "16px" }}>
        🧪 Figma API 测试工具
      </Text>

      {/* 页面信息测试 */}
      <div style={{ marginBottom: "16px" }}>
        <Text style={{ fontWeight: "bold", marginBottom: "8px" }}>📄 页面信息</Text>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button onClick={testGetPageInfo}>获取页面信息</Button>
          <Button onClick={testGetSelectedElements}>获取选中元素</Button>
          <Button onClick={testGetPageStatistics}>获取统计信息</Button>
        </div>
      </div>

      {/* 元素创建测试 */}
      <div style={{ marginBottom: "16px" }}>
        <Text style={{ fontWeight: "bold", marginBottom: "8px" }}>➕ 创建元素</Text>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button onClick={testCreateStickyNote}>创建便签</Button>
          <Button onClick={testCreateRectangle}>创建矩形</Button>
          <Button onClick={testCreateEllipse}>创建椭圆</Button>
          <Button onClick={testCreateText}>创建文本</Button>
        </div>
      </div>

      {/* 元素管理测试 */}
      <div style={{ marginBottom: "16px" }}>
        <Text style={{ fontWeight: "bold", marginBottom: "8px" }}>🔧 元素管理</Text>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button onClick={testUpdateSelectedElement}>更新选中元素</Button>
          <Button onClick={testDuplicateSelectedElement}>复制选中元素</Button>
          <Button onClick={testDeleteSelectedElements} secondary>删除选中元素</Button>
        </div>
      </div>

      {/* 布局测试 */}
      <div style={{ marginBottom: "16px" }}>
        <Text style={{ fontWeight: "bold", marginBottom: "8px" }}>📐 布局排列</Text>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Button onClick={testArrangeHorizontally}>水平排列</Button>
          <Button onClick={testArrangeVertically}>垂直排列</Button>
          <Button onClick={testArrangeGrid}>网格排列</Button>
        </div>
      </div>

      {/* 控制按钮 */}
      <div style={{ marginBottom: "16px" }}>
        <Button onClick={clearResults} secondary>清空结果</Button>
      </div>

      {/* 测试结果显示 */}
      <div style={{ marginTop: "16px" }}>
        <Text style={{ fontWeight: "bold", marginBottom: "8px" }}>📋 测试结果:</Text>
        <div style={{ 
          background: "#f0f0f0", 
          padding: "12px", 
          borderRadius: "4px",
          fontSize: "12px",
          fontFamily: "monospace",
          height: "200px",
          overflow: "auto",
          whiteSpace: "pre-wrap"
        }}>
          {testResult || "准备就绪，请点击上方按钮开始测试..."}
        </div>
      </div>

      {/* 当前状态信息 */}
      {pageInfo && (
        <div style={{ marginTop: "16px", fontSize: "12px" }}>
          <Text style={{ fontWeight: "bold" }}>📊 当前页面状态:</Text>
          <div>页面: {pageInfo.name} ({pageInfo.editorType})</div>
          <div>元素: {pageInfo.elements.length} 个</div>
          <div>选中: {selectedElements.length} 个</div>
        </div>
      )}
    </div>
  );
}