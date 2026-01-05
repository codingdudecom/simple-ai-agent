require('dotenv').config();

const Cerebras = require('@cerebras/cerebras_cloud_sdk');
const { Ollama } = require('ollama');
const chalk = require('chalk');
const readline = require("readline");

const toolsKit = require("./tools");

const AI_PROVIDER = process.env['AI_PROVIDER'] || 'cerebras';
const MODEL = process.env[`${AI_PROVIDER.toUpperCase()}_MODEL`];

let aiClient;

if (AI_PROVIDER === 'cerebras') {
  aiClient = new Cerebras({
    apiKey: process.env['CEREBRAS_API_KEY'],
  });
} else if (AI_PROVIDER === 'ollama') {
  aiClient = new Ollama({
    host: process.env['OLLAMA_HOST'],
  });
}

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

// Function to get user input
function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      const value = input.replace(/\r$/, '').trim();

      if (value.toLowerCase() === "exit") {
        resolve(null);
        rl.close();
        process.exit();
        return;
      }
      resolve(value);
    });
  });
}

async function main() {
  const { tools, execute: toolsExecution } = await toolsKit.loadTools();

  console.log(chalk.cyan(`${AI_PROVIDER.charAt(0).toUpperCase() + AI_PROVIDER.slice(1)} Agent Initialized`));
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

      if (message?.tool_calls) {
        for (const toolCall of message.tool_calls) {
          const toolName = toolCall.function.name;

          const toolArgs = typeof(toolCall.function.arguments) == "object"?toolCall.function.arguments:JSON.parse(toolCall.function.arguments);
          const matchingTool = toolsExecution[toolName];

          if (matchingTool) {
            console.log(chalk.yellow(`+ Calling tool ${toolName}`));
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

main();
