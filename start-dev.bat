@echo off
echo Starting Figma AI Agent Development Environment...
echo.

echo Step 1: Building MCP Server...
cd packages\mcp-server
call npm run build
if %errorlevel% neq 0 (
    echo MCP Server build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Starting MCP Server...
start "MCP Server" cmd /k "npm run start"

echo.
echo Step 3: Starting Backend...
cd ..\..
start "Backend" cmd /k "npm run dev:backend"

echo.
echo Step 4: Starting Frontend Plugin...
start "Frontend Plugin" cmd /k "npm run dev:plugin"

echo.
echo ✅ All services started!
echo.
echo Services running:
echo - MCP Server: Running in separate window
echo - Backend: http://localhost:3000 (WebSocket ready)
echo - Frontend Plugin: Building and watching for changes
echo.
echo To use:
echo 1. Open Figma/FigJam
echo 2. Import the plugin from packages/plugin/manifest.json
echo 3. Run the plugin in FigJam
echo 4. Start chatting with the AI to create sticky notes!
echo.
echo Press any key to exit...
pause > nul
