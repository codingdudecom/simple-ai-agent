const fs = require('fs');
const path = require('path');

const tool = {
  type: "function",
  function: {
    name: "read_file_content",
    description: "Get the full content of a specified file. Files should be specified by @ followed by the relative path of the file",
    parameters: {
      type: "object",
      properties: {
        filePath: {
          type: "string",
          description: "The relative path to the file, prefixed with @ (e.g., @./src/myFile.js)",
        },
      },
      required: ["filePath"],
    },
  },
};

const execute = async ({ filePath }) => {
  // Remove the '@' prefix if present
  const relativePath = filePath.startsWith('@') ? filePath.substring(1) : filePath;
  const absolutePath = path.join(process.cwd(), relativePath);

  try {
    const content = await fs.promises.readFile(absolutePath, 'utf8');
    return { content };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = { tool, execute };