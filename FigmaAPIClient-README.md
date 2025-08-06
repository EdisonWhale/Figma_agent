# FigmaAPIClient - 规范化的 Figma API 调用系统

## 概述

这是一个完整的 Figma/FigJam API 调用系统，专为 AI Agent 程序设计，通过 MCP (Model Context Protocol) 协议提供强大的 Figma 操作能力。系统包含三个核心组件：

1. **FigmaAPIClient** - 核心 API 客户端
2. **FigmaAIAgent** - 智能 AI 代理
3. **MCP 服务器扩展** - 完整的工具定义

## 🚀 核心特性

### 📋 元素识别与查询
- 获取页面所有元素信息
- 按类型、位置、名称筛选元素
- 智能缓存管理
- 实时元素状态追踪

### 🎨 图形创建能力
- **便签**: 支持多种颜色和自定义大小
- **基础图形**: 矩形、椭圆、自定义填充和描边
- **文本元素**: 支持字体、大小、颜色、对齐方式
- **连接线**: FigJam 中元素间的智能连接
- **复合图形**: 支持复杂的图形组合

### 🔧 元素操作功能
- 移动、调整大小、旋转
- 批量操作支持
- 选择和复制功能
- 属性更新和样式修改
- 智能布局排列

### 🤖 AI 智能特性
- **页面分析**: 自动分析布局质量和优化建议
- **智能创建**: 思维导图、工作流程图自动生成
- **页面整理**: 自动按类型整理和排列元素
- **颜色和谐**: 基于设计原理的智能配色
- **布局优化**: 自动网格布局和间距调整

## 📁 项目结构

```
packages/
├── common/src/types/
│   └── figma.types.ts          # 完整的类型定义
├── plugin/src/services/
│   ├── figmaAPIClient.ts       # 核心 API 客户端
│   ├── figmaAIAgent.ts         # AI 智能代理
│   └── index.ts                # 导出文件
├── plugin/src/examples/
│   └── usage.ts                # 使用示例
├── plugin/src/main.ts          # 扩展的主线程处理器
└── mcp-server/src/index.ts     # 扩展的 MCP 服务器
```

## 🛠️ 安装和设置

### 1. 类型定义
新增的 `figma.types.ts` 包含了完整的 Figma API 类型定义：

```typescript
import {
  FigmaElement,
  PageInfo,
  StickyNoteCreateOptions,
  TextCreateOptions,
  ShapeCreateOptions,
  // ... 更多类型
} from '@common/types/figma.types';
```

### 2. 基础 API 客户端

```typescript
import { createFigmaAPIClient, FigmaAPIService } from './services';

// 创建客户端实例
const apiService = new FigmaAPIService();
const figmaClient = createFigmaAPIClient(apiService, {
  validateInputs: true,
  enableEventListening: true,
  cache: {
    ttl: 300000, // 5分钟缓存
    maxSize: 1000
  }
});
```

### 3. AI 智能代理

```typescript
import { createFigmaAIAgent } from './services';

// 创建 AI 代理实例
const aiAgent = createFigmaAIAgent({
  enableSmartPositioning: true,
  enableColorHarmony: true,
  defaultSpacing: 20,
  preferredColors: ['blue', 'green', 'yellow', 'pink', 'purple']
});
```

## 📖 使用示例

### 基础操作

```typescript
// 获取页面信息
const pageInfo = await figmaClient.getCurrentPageInfo();
console.log(`页面包含 ${pageInfo.elements.length} 个元素`);

// 创建便签
const sticky = await figmaClient.createStickyNote({
  text: "这是一个便签",
  x: 100,
  y: 100,
  color: 'yellow',
  width: 240,
  height: 120
});

// 创建文本
const text = await figmaClient.createText({
  text: "标题文本",
  x: 200,
  y: 50,
  fontSize: 24,
  fontWeight: 'Bold',
  textAlign: 'CENTER'
});

// 查询特定类型的元素
const textElements = await figmaClient.getElementsByType('TEXT');
const stickyNotes = await figmaClient.getElementsByType('STICKY');
```

### 智能操作

```typescript
// AI 页面分析
const analysis = await aiAgent.analyzeCurrentPage();
console.log(analysis);
// 输出包含元素统计、布局分析、优化建议等

// 创建智能思维导图
const mindMapResult = await aiAgent.createMindMap({
  centralTopic: "产品开发",
  subtopics: ["需求分析", "设计", "开发", "测试", "发布"],
  radius: 200,
  centerX: 400,
  centerY: 300
});

// 智能页面整理
const organizationResult = await aiAgent.organizePageElements();
// 自动按类型分组并排列所有元素
```

### 批量操作

```typescript
// 批量创建元素
const elements = [];
for (let i = 0; i < 5; i++) {
  const element = await figmaClient.createRectangle({
    x: i * 120,
    y: 100,
    width: 100,
    height: 80,
    fills: [{ type: 'SOLID', color: { r: 0.2, g: 0.6, b: 1 } }]
  });
  elements.push(element.elementId);
}

// 智能排列
await figmaClient.arrangeElements(elements, {
  direction: 'horizontal',
  spacing: 20,
  alignment: 'center'
});

// 批量更新
const updatePromises = elements.map(id => 
  figmaClient.updateElement(id, { opacity: 0.8 })
);
await Promise.all(updatePromises);
```

## 🔌 MCP 工具集成

系统提供了完整的 MCP 工具定义，Claude 可以通过以下工具与 Figma 交互：

### 页面信息工具
- `get_current_page_info` - 获取当前页面完整信息
- `query_elements` - 按条件查询元素
- `get_element_details` - 获取特定元素详情
- `get_page_statistics` - 获取页面统计信息

### 创建工具
- `create_sticky_note` - 创建便签
- `create_rectangle` - 创建矩形
- `create_ellipse` - 创建椭圆
- `create_text` - 创建文本元素
- `create_connector` - 创建连接线

### 管理工具
- `delete_element` / `delete_elements` - 删除元素
- `update_element` - 更新元素属性
- `select_elements` - 选择元素
- `duplicate_element` - 复制元素
- `arrange_elements` - 智能排列元素

## 🎯 AI Agent 能力

### 智能页面分析
- 元素密度和布局质量评估
- 对齐和间距一致性检查
- 重叠元素检测
- 个性化优化建议

### 自动化创建
- **思维导图**: 自动生成带智能配色的思维导图
- **工作流程图**: 创建水平或垂直的流程图
- **仪表板布局**: 复杂的多组件布局

### 智能优化
- 按元素类型自动分组和排列
- 基于设计原理的颜色和谐
- 自适应网格布局
- 一致性间距调整

## 📊 性能特性

### 缓存系统
- 智能元素缓存，减少 API 调用
- 可配置的 TTL 和缓存大小
- 自动缓存失效机制

### 错误处理
- 完整的错误类型定义
- 自动重试机制（指数退避）
- 优雅的降级处理

### 事件系统
- 元素创建、更新、删除事件
- 选择变化事件
- 页面变化事件

## 🔄 与现有系统集成

这个系统完全兼容你现有的架构：

1. **扩展现有 FigmaAPIService** - 基于你的 WebSocket 通信机制
2. **保持 MCP 协议一致性** - 遵循现有的工具调用模式
3. **TypeScript 类型安全** - 完整的类型定义和验证
4. **插件架构兼容** - 无缝集成到现有插件系统

## 🚀 开始使用

1. **基础使用**:
```typescript
import { createFigmaAPIClient, FigmaAPIService } from './services';

const apiService = new FigmaAPIService();
const client = createFigmaAPIClient(apiService);

// 开始创建和管理 Figma 元素
const sticky = await client.createStickyNote({
  text: "Hello World!",
  x: 100,
  y: 100
});
```

2. **AI 增强使用**:
```typescript
import { createFigmaAIAgent } from './services';

const aiAgent = createFigmaAIAgent();

// 让 AI 分析和优化你的页面
const analysis = await aiAgent.analyzeCurrentPage();
const organized = await aiAgent.organizePageElements();
```

3. **完整的 MCP 集成** - 所有功能都通过 MCP 协议暴露给 Claude，支持自然语言交互。

## 💡 高级功能

- **智能定位**: 自动寻找最佳位置放置新元素
- **颜色和谐**: 基于色彩理论的智能配色
- **布局优化**: 自动网格对齐和间距调整
- **批量操作**: 高性能的批量元素管理
- **事件驱动**: 实时响应元素变化

这个系统为你的 AI Agent 提供了完整的 Figma 操作能力，既可以进行精确的 API 调用，也可以通过 AI 智能进行高级的设计操作。