# 🚀 Figma AI Agent - 开发环境设置

## 快速启动

### Windows用户
```bash
# 一键启动所有服务
start-dev.bat
```

### Mac/Linux用户
```bash
# 一键启动所有服务
chmod +x start-dev.sh
./start-dev.sh
```

## 手动启动步骤

如果你想手动启动各个服务，请按以下顺序：

### 1. 启动MCP服务器 (Terminal 1)
```bash
cd packages/mcp-server
npm install
npm run build
npm run start
```

### 2. 启动Backend (Terminal 2)
```bash
npm run dev:backend
```

### 3. 启动Frontend Plugin (Terminal 3)
```bash
npm run dev:plugin
```

## 🔧 在Figma中设置Plugin

1. 打开Figma或FigJam
2. 进入 **Plugins** → **Development** → **Import plugin from manifest**
3. 选择 `packages/plugin/manifest.json` 文件
4. 点击 **Import**

## 🎯 使用方法

1. 在FigJam中运行你的plugin
2. 在聊天界面中输入自然语言，例如：
   - "创建一个便签，内容是'会议要点'"
   - "在坐标(200,300)创建一个蓝色便签，内容是'重要提醒'"
   - "添加一个大的黄色便签，内容是'项目时间线'"

## 🏗️ 系统架构

```
用户输入 → Frontend Plugin → Backend (Claude API + MCP Client) → MCP Server → 返回工具调用 → Backend → Frontend → Figma API → 创建便签
```

### 组件说明

- **Frontend Plugin**: React界面，处理用户交互和Figma API调用
- **Backend**: Express + WebSocket服务器，集成Claude API和MCP客户端
- **MCP Server**: 提供Figma工具定义和参数验证

## 🐛 故障排除

### 常见问题

1. **MCP连接失败**
   - 确保MCP服务器先启动
   - 检查端口是否被占用

2. **Plugin构建错误**
   - 运行 `npm run build` 重新构建
   - 检查TypeScript错误

3. **WebSocket连接失败**
   - 确保Backend正在运行
   - 检查端口3000是否可用

### 日志查看

- **MCP Server**: 在MCP Server终端查看
- **Backend**: 在Backend终端查看JSON格式日志
- **Frontend**: 在Figma开发者控制台查看

## 📝 开发注意事项

1. **修改MCP工具**: 编辑 `packages/mcp-server/src/index.ts`
2. **修改Backend逻辑**: 编辑 `packages/backend/src/` 下的文件
3. **修改Frontend界面**: 编辑 `packages/plugin/src/` 下的文件

每次修改后，相应的服务会自动重新加载（除了MCP服务器需要手动重启）。

## 🎉 成功标志

当所有服务正常运行时，你应该看到：

- ✅ MCP Server: "Figma MCP Server running on stdio"
- ✅ Backend: "Server started successfully" + "MCP service initialized successfully"
- ✅ Frontend: "success Built in X.XXXs"

现在你可以在FigJam中使用AI创建便签了！
