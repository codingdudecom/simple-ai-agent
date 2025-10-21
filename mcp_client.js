const { MCPClient } = require('mcp-client');
const fs = require('fs');
const path = require('path');

async function loadMcpTools() {
  const settingsPath = path.join(__dirname, 'settings.json');
  if (!fs.existsSync(settingsPath)) {
    return { tools: [], execute: {} };
  }

  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  const mcpServers = settings.mcpServers;

  if (!mcpServers) {
    return { tools: [], execute: {} };
  }

  const allTools = [];
  const allExecute = {};

  for (const serverName in mcpServers) {
    const serverConfig = mcpServers[serverName];
    const client = new MCPClient({
        name: `Cerebras-Agent-${serverName}`,
        version: '1.0.0'
    });

    try {
        await client.connect({
            type: 'stdio',
            command: serverConfig.command,
            args: serverConfig.args,
            env: serverConfig.env,
        });

        const mcpTools = await client.getAllTools();

        const tools = mcpTools.map(tool => ({
            type: 'function',
            function: {
                name: `${serverName}-${tool.name}`, // Prefix with server name
                description: `[${serverName}] ${tool.description}`,
                parameters: tool.inputSchema,
            },
        }));

        for (const tool of mcpTools) {
            const toolName = `${serverName}-${tool.name}`;
            allExecute[toolName] = async (args) => {
                return await client.callTool({
                    name: tool.name,
                    arguments: args,
                });
            };
        }

        allTools.push(...tools);

    } catch (error) {
        console.error(`Error connecting to or fetching tools from ${serverName}:`, error);
    }
  }

  return { tools: allTools, execute: allExecute };
}

module.exports = { loadMcpTools };