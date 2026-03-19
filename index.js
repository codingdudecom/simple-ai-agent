const dotenv = require('dotenv');
dotenv.config();

const Cerebras = require('@cerebras/cerebras_cloud_sdk');
const { Ollama } = require('ollama');
const chalk = require('chalk');
const readline = require("readline");
const fs = require('fs');
const path = require('path');

const toolsKit = require("./tools");

let AI_PROVIDER;
let MODEL;
let aiClient;

async function getChatCompletion(messages, model, tools) {
  if (AI_PROVIDER === 'cerebras') {
    return aiClient.chat.completions.create({
      messages,
      model,
      tools,
    });
  } else if (AI_PROVIDER === 'ollama') {
    const response = await aiClient.chat({
      model,
      messages,
      tools,
      options: {
          num_ctx: 65536   // or 16384 depending on the model
      }
    });

    // Make ollama response OpenAI-compatible
    return {
      choices: [
        {
          message: response.message,
        }
      ]
    }
  }
}

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let isExiting = false;
function cleanupAndExit(code = 0) {
  if (isExiting) return;
  isExiting = true;
  try {
    rl.close();
  } catch {}
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {}
  }
  process.stdin.pause();
  process.exit(code);
}

rl.on('SIGINT', () => {
  console.log(chalk.yellow("\nReceived SIGINT, shutting down..."));
  cleanupAndExit(130);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow("\nReceived SIGINT, shutting down..."));
  cleanupAndExit(130);
});
process.on('SIGTERM', () => cleanupAndExit(143));
process.on('SIGHUP', () => cleanupAndExit(129));

// Function to get user input
function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      const value = input.replace(/\r$/, '').trim();

      if (value.toLowerCase() === "exit") {
        resolve(null);
        cleanupAndExit(0);
        return;
      }
      resolve(value);
    });
  });
}

function formatEnvValue(value) {
  if (value === undefined || value === null) return '';
  const str = String(value);
  if (str === '') return '';
  if (/[\s#=]/.test(str)) {
    const escaped = str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return str;
}

function writeEnvFile(envPath, envVars) {
  const lines = Object.keys(envVars)
    .sort()
    .map((key) => `${key}=${formatEnvValue(envVars[key])}`);
  fs.writeFileSync(envPath, lines.join('\n') + '\n', 'utf8');
}

async function promptChoice(prompt, choices) {
  while (true) {
    console.log(prompt);
    choices.forEach((choice, index) => {
      console.log(`  ${index + 1}) ${choice.label}`);
    });
    const input = await getUserInput(chalk.magenta("Select an option: "));
    if (input === null) return null;
    const number = Number.parseInt(input, 10);
    if (!Number.isNaN(number) && number >= 1 && number <= choices.length) {
      return choices[number - 1].value;
    }
    console.log(chalk.red("Invalid selection. Please choose a number from the list."));
  }
}

async function promptRequired(promptText, { defaultValue } = {}) {
  while (true) {
    const suffix = defaultValue ? ` (default: ${defaultValue})` : '';
    const input = await getUserInput(chalk.magenta(`${promptText}${suffix}: `));
    if (input === null) return null;
    const value = input || defaultValue || '';
    if (value.trim() !== '') {
      return value.trim();
    }
    console.log(chalk.red("Please enter a value."));
  }
}

async function ensureProviderConfigured() {
  const envPath = path.join(process.cwd(), '.env');
  const envFile = fs.existsSync(envPath)
    ? dotenv.parse(fs.readFileSync(envPath, 'utf8'))
    : {};

  let provider = (process.env.AI_PROVIDER || envFile.AI_PROVIDER || '').toLowerCase();
  const needsProvider = provider !== 'cerebras' && provider !== 'ollama';

  const updates = {};

  if (needsProvider) {
    provider = await promptChoice("No AI provider configured. Choose one to set up:", [
      { label: "Cerebras (cloud)", value: "cerebras" },
      { label: "Ollama (local)", value: "ollama" },
    ]);
    if (!provider) {
      process.exit();
      return;
    }
  }

  updates.AI_PROVIDER = provider;

  if (provider === 'cerebras') {
    const apiKey = process.env.CEREBRAS_API_KEY || envFile.CEREBRAS_API_KEY;
    const model = process.env.CEREBRAS_MODEL || envFile.CEREBRAS_MODEL;
    updates.CEREBRAS_API_KEY = apiKey || await promptRequired("Enter your Cerebras API key");
    updates.CEREBRAS_MODEL = model || await promptRequired("Enter the Cerebras model name");
  } else if (provider === 'ollama') {
    const host = process.env.OLLAMA_HOST || envFile.OLLAMA_HOST;
    const model = process.env.OLLAMA_MODEL || envFile.OLLAMA_MODEL;
    updates.OLLAMA_HOST = host || await promptRequired("Enter the Ollama host", {
      defaultValue: "http://localhost:11434",
    });
    updates.OLLAMA_MODEL = model || await promptRequired("Enter the Ollama model name");
  }

  const envExists = fs.existsSync(envPath);
  const hasChanges = Object.keys(updates).some(
    (key) => updates[key] && envFile[key] !== updates[key]
  );
  const needsWrite = needsProvider || hasChanges || !envExists;

  if (needsWrite) {
    const finalEnv = { ...envFile, ...updates };
    writeEnvFile(envPath, finalEnv);
    console.log(chalk.green("Wrote configuration to .env"));
  }

  dotenv.config({ path: envPath, override: true });
}

async function main() {
  await ensureProviderConfigured();

  AI_PROVIDER = (process.env['AI_PROVIDER'] || 'cerebras').toLowerCase();
  MODEL = process.env[`${AI_PROVIDER.toUpperCase()}_MODEL`];

  if (AI_PROVIDER === 'cerebras') {
    aiClient = new Cerebras({
      apiKey: process.env['CEREBRAS_API_KEY'],
    });
  } else if (AI_PROVIDER === 'ollama') {
    aiClient = new Ollama({
      host: process.env['OLLAMA_HOST'],
    });
  } else {
    throw new Error(`Unsupported AI provider: ${AI_PROVIDER}`);
  }

  const { tools, execute: toolsExecution } = await toolsKit.loadTools();

  console.log(chalk.cyan(`${AI_PROVIDER.charAt(0).toUpperCase() + AI_PROVIDER.slice(1)} Agent Initialized`));
  console.log(chalk.cyan(tools.map(o => o.function.name)));
  console.log(chalk.cyan("Ask me anything! Type 'exit' to quit."));


  const messages = [];

  // Main agent loop
  while (true) {
    const userInput = await getUserInput(chalk.magenta("> "));

    if (userInput === null) {
      break;
    }

    messages.push({ role: "user", content: userInput });

    // Inner loop for tool calling
    while (true) {
      const chatCompletion = await getChatCompletion(messages, MODEL, tools);

      const message = chatCompletion?.choices[0]?.message;
      messages.push(message);

      if (message?.tool_calls) {
        if (message.content) {
          console.log(chalk.cyan(`> Thought:\n\n${message.content}`));
        }

        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;

          const toolArgs = typeof(toolCall.function.arguments) == "object"?toolCall.function.arguments:JSON.parse(toolCall.function.arguments);
          const matchingTool = toolsExecution[toolName];

          if (matchingTool) {
            console.log(chalk.yellow(`+ Calling tool ${toolName}`));
            console.log(chalk.yellow(`+ |-args: ${JSON.stringify(toolArgs)}`));
            const result = await matchingTool(toolArgs);

            const text = JSON.stringify(result);
            const truncated = text.length > 100 ? text.slice(0, 100) + '...' : text;
            console.log(chalk.yellow(`= Tool response ${truncated}`));
            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolName,
              content: JSON.stringify(result),
            });
          }
        }
      } else {
        console.log(chalk.cyan(`> Final answer:\n\n${message.content}`));
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

main().catch((err) => {
  console.error(chalk.red("Fatal error:"), err);
  cleanupAndExit(1);
});
