const fs = require('fs');
const path = require('path');

const tools = [];
const execute = {};

const toolsDir = path.join(__dirname, 'tools');
const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js'));

for (const file of toolFiles) {
  const toolModule = require(path.join(toolsDir, file));
  tools.push(toolModule.tool);
  execute[toolModule.tool.function.name] = toolModule.execute;
}

module.exports = { tools, execute };