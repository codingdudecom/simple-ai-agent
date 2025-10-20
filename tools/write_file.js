const fs = require('fs');
const path = require('path');

const tool = {
  type: "function",
  function: {
    name: "write_file",
    description: "Write content to a specified file in the current directory or a subdirectory.",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The relative path to the file (e.g., './src/myFile.js' or 'newFile.txt').",
        },
        content: {
          type: "string",
          description: "The content to write to the file.",
        },
      },
      required: ["filePath", "content"],
    },
  },
};

const execute = async ({ filePath, content }) => {
  const absolutePath = path.join(process.cwd(), filePath);

  try {
    // Ensure the directory exists before writing the file
    const dir = path.dirname(absolutePath);
    await fs.promises.mkdir(dir, { recursive: true });
    await fs.promises.writeFile(absolutePath, content, 'utf8');
    return { message: `Successfully wrote to file: ${filePath}` };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = { tool, execute };