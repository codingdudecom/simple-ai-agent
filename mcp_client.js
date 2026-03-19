const { MCPClient } = require('mcp-client');
const fs = require('fs');
const path = require('path');

const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRIES = 2;
const DEFAULT_RETRY_DELAY_MS = 500;
const DEFAULT_RETRY_BACKOFF = 2;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isTimeoutError(error) {
  return (
    error &&
    (error.code === -32001 ||
      error.code === 'RequestTimeout' ||
      (typeof error.message === 'string' && error.message.includes('Request timed out')))
  );
}

async function withRetries(fn, opts) {
  const retries = Number.isFinite(opts.retries) ? opts.retries : DEFAULT_RETRIES;
  const delayMs = Number.isFinite(opts.delayMs) ? opts.delayMs : DEFAULT_RETRY_DELAY_MS;
  const backoff = Number.isFinite(opts.backoff) ? opts.backoff : DEFAULT_RETRY_BACKOFF;

  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (!isTimeoutError(error) || attempt >= retries) {
        throw error;
      }
      const waitMs = Math.round(delayMs * Math.pow(backoff, attempt));
      attempt += 1;
      await sleep(waitMs);
    }
  }
}

function getRequestOptions(settings, serverConfig) {
  const timeout =
    serverConfig.timeoutMs ??
    serverConfig.timeout ??
    settings.mcpDefaultTimeoutMs ??
    DEFAULT_TIMEOUT_MS;
  return { timeout };
}

function getRetryOptions(settings, serverConfig) {
  return {
    retries: serverConfig.retries ?? settings.mcpDefaultRetries ?? DEFAULT_RETRIES,
    delayMs: serverConfig.retryDelayMs ?? settings.mcpRetryDelayMs ?? DEFAULT_RETRY_DELAY_MS,
    backoff: serverConfig.retryBackoff ?? settings.mcpRetryBackoff ?? DEFAULT_RETRY_BACKOFF,
  };
}

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

        const requestOptions = getRequestOptions(settings, serverConfig);
        const retryOptions = getRetryOptions(settings, serverConfig);

        const mcpTools = await withRetries(
          () => client.getAllTools({ requestOptions }),
          retryOptions
        );

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
                return await withRetries(
                  () =>
                    client.callTool(
                      {
                        name: tool.name,
                        arguments: args,
                      },
                      { requestOptions }
                    ),
                  retryOptions
                );
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
