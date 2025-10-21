const fs = require('fs');
const path = require('path');
const { loadMcpTools } = require('./mcp_client');

async function loadTools() {
  const tools = [];
  const execute = {};

  // Load local tools
  const toolsDir = path.join(__dirname, 'tools');
  const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));

  for (const file of toolFiles) {
    const toolModule = require(path.join(toolsDir, file));
    tools.push(toolModule.tool);
    execute[toolModule.tool.function.name] = toolModule.execute;
  }

  // Load MCP tools
  try {
    const { tools: mcpTools, execute: mcpExecute } = await loadMcpTools();
    tools.push(...mcpTools);
    Object.assign(execute, mcpExecute);
  } catch (error) {
    console.error("Error loading MCP tools:", error);
  }


  return { tools, execute };
}

module.exports = { loadTools };