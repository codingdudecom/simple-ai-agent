const fs = require('fs');
const path = require('path');

const tool = {
  type: "function",
  function: {
    name: "list_directory_contents",
    description: "List all files and folders in the current directory",
    parameters: {},
  },
};

const execute = async ({}) => {
  const currentDirectory = process.cwd();
  try {
    const contents = await fs.promises.readdir(currentDirectory);
    return { contents };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = { tool, execute };