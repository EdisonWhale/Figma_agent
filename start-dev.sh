#!/bin/bash

echo "Starting Figma AI Agent Development Environment..."
echo

echo "Step 1: Building MCP Server..."
cd packages/mcp-server
npm run build
if [ $? -ne 0 ]; then
    echo "MCP Server build failed!"
    exit 1
fi

echo
echo "Step 2: Starting MCP Server..."
gnome-terminal --title="MCP Server" -- bash -c "npm run start; exec bash" &

echo
echo "Step 3: Starting Backend..."
cd ../..
gnome-terminal --title="Backend" -- bash -c "npm run dev:backend; exec bash" &

echo
echo "Step 4: Starting Frontend Plugin..."
gnome-terminal --title="Frontend Plugin" -- bash -c "npm run dev:plugin; exec bash" &

echo
echo "✅ All services started!"
echo
echo "Services running:"
echo "- MCP Server: Running in separate terminal"
echo "- Backend: http://localhost:3000 (WebSocket ready)"
echo "- Frontend Plugin: Building and watching for changes"
echo
echo "To use:"
echo "1. Open Figma/FigJam"
echo "2. Import the plugin from packages/plugin/manifest.json"
echo "3. Run the plugin in FigJam"
echo "4. Start chatting with the AI to create sticky notes!"
echo
echo "Press Ctrl+C to stop this script (services will continue running)"
wait
