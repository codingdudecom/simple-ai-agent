require('dotenv').config();

const Cerebras = require('@cerebras/cerebras_cloud_sdk');
const chalk = require('chalk');
const readline = require("readline");

const toolsKit = require("./tools");


// Initialize the Cerebras model
const cerebras = new Cerebras({
  apiKey: process.env['CEREBRAS_API_KEY'], // This is the default and can be omitted
});

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to get user input
function getUserInput(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (input) => {
      resolve(input);
    });
  });
}

async function main() {
  const { tools, execute: toolsExecution } = await toolsKit.loadTools();

  console.log(chalk.cyan("Cerebras Agent Initialized"));
  console.log(chalk.cyan("Ask me anything! Type 'exit' to quit."));


  const messages = [];

  // Main agent loop
  while (true) {
    const userInput = await getUserInput(chalk.magenta("> "));

    if (userInput.toLowerCase() === "exit") {
      rl.close();
      break;
    }

    messages.push({ role: "user", content: userInput });

    // Inner loop for tool calling
    while (true) {
      const chatCompletion = await cerebras.chat.completions.create({
        messages,
        model: 'qwen-3-coder-480b',
        tools: tools,
      });

      const message = chatCompletion?.choices[0]?.message;

      if (message?.tool_calls) {
        for (const toolCall of message.tool_calls) {

          const toolName = toolCall.function.name;
          console.log(toolName);
          const toolArgs = JSON.parse(toolCall.function.arguments);
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
        console.log(chalk.red(JSON.stringify(message)));
        // messages.push(message);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

main();
