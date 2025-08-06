# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FigChat Assistant is a Figma/FigJam AI plugin that creates contextual sticky notes and templates through natural language. The architecture uses Claude API with MCP (Model Context Protocol) for tool-based interactions with Figma's API.

**Key Architecture Pattern**: Frontend Plugin → Backend (Claude + MCP Client) → MCP Server → Figma API

## Common Development Commands

### Build & Development
```bash
# Start all services (recommended)
./start-dev.sh        # Mac/Linux
start-dev.bat          # Windows

# Manual startup sequence
npm run dev:mcp        # Start MCP server first
npm run dev:backend    # Start backend service  
npm run dev:plugin     # Start plugin development

# Build all packages
npm run build

# Build individual packages
npm run build --workspace=packages/plugin
npm run build --workspace=packages/backend
npm run build --workspace=packages/mcp-server
```

### Testing Plugin in Figma
1. Open Figma/FigJam
2. Navigate to **Plugins** → **Development** → **Import plugin from manifest**
3. Select `packages/plugin/manifest.json`
4. Plugin appears in development plugins list

## Architecture & Data Flow

### Core Components
- **packages/plugin/**: Preact-based Figma plugin UI with WebSocket communication
- **packages/backend/**: Express server integrating Claude API with MCP client
- **packages/mcp-server/**: MCP server providing Figma tool definitions (`create_sticky_note`)
- **packages/common/**: Shared TypeScript types and utilities

### Service Communication Flow
1. **User Input** → Plugin UI collects natural language request
2. **WebSocket** → Plugin sends message to backend via WebSocket
3. **Claude API** → Backend forwards conversation to Claude with MCP tools
4. **Tool Calls** → Claude returns tool calls for sticky note creation
5. **MCP Server** → Backend validates parameters via MCP server
6. **Figma API** → Plugin executes validated tool calls on Figma canvas

### Session Management
- **Frontend**: Stateless UI, no conversation history storage
- **Backend**: In-memory session management with 24h expiration
- **Session ID**: UUID-based session identification for conversation continuity

## Key Technical Decisions

### Environment Setup
- **Backend**: Requires `ANTHROPIC_API_KEY` in `.env` file
- **Plugin**: Uses WebSocket for real-time communication with backend
- **Development**: MCP server must start before backend for tool registration

### MCP Integration Pattern
- **Tool Schema**: Zod-based parameter validation in MCP server
- **Tool Registration**: Dynamic tool discovery from MCP server to Claude
- **Error Handling**: Graceful degradation when MCP server unavailable
- **Connection Management**: Automatic reconnection with exponential backoff

### TypeScript Architecture
- **Strict Mode**: All packages use TypeScript strict mode
- **Path Mapping**: `@backend/*` aliases for backend imports
- **Shared Types**: Common types in `packages/common/` for consistency
- **Monorepo**: Workspace-based dependency management

## Development Workflow

### Making Changes
- **MCP Tools**: Edit `packages/mcp-server/src/index.ts` for new Figma capabilities
- **Backend Logic**: Modify `packages/backend/src/services/` for AI integration
- **Plugin UI**: Update `packages/plugin/src/` for user interface changes
- **Auto-reload**: Backend and plugin have hot reload; MCP server requires manual restart

### Service Dependencies
1. **MCP Server**: Must start first for tool registration
2. **Backend**: Depends on MCP server for tool definitions
3. **Plugin**: Requires backend WebSocket connection for functionality

### Error Monitoring
- **Backend**: Structured JSON logging with performance metrics
- **Plugin**: Error boundaries with user-friendly error messages
- **MCP**: Console-based logging with connection status tracking