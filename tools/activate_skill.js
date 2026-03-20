const fs = require('fs');
const path = require('path');
const os = require('os');
const { load } = require('js-yaml');

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n([\s\S]*))?/;
const IGNORED_DIRS = new Set(['node_modules', '.git']);

const tool = {
  type: "function",
  function: {
    name: "activate_skill",
    description: "Activate a skill by reading SKILL.md files in a skill folder and returning their descriptions",
    parameters: {
      type: "object",
      properties: {
        skillPath: {
          type: "string",
          description: "Absolute path to the skill folder"
        }
      },
      required: ["skillPath"],
      additionalProperties: false
    },
  },
};

function resolveHome(inputPath) {
  if (!inputPath) return inputPath;
  if (inputPath === '~') return os.homedir();
  if (inputPath.startsWith('~/')) return path.join(os.homedir(), inputPath.slice(2));
  return inputPath;
}

function parseSimpleFrontmatter(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const result = {};
  for (const line of lines) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!key || !value) continue;
    if (key === 'name' || key === 'description') {
      result[key] = value.replace(/^['\"]|['\"]$/g, '');
    }
  }
  if (typeof result.name === 'string' && typeof result.description === 'string') {
    return { name: result.name, description: result.description };
  }
  return null;
}

function parseFrontmatter(content) {
  try {
    const parsed = load(content);
    if (parsed && typeof parsed === 'object') {
      const { name, description } = parsed;
      if (typeof name === 'string' && typeof description === 'string') {
        return { name, description };
      }
    }
  } catch (yamlError) {
    // Fall back to simple parser
  }

  return parseSimpleFrontmatter(content);
}

function parseSkillContent(content, filePath) {
  const match = content.match(FRONTMATTER_REGEX);
  if (!match) {
    return null;
  }

  const frontmatter = parseFrontmatter(match[1]);
  if (!frontmatter) {
    return null;
  }

  const sanitizedName = frontmatter.name.replace(/[:\\/<>*?"|]/g, '-');

  return {
    name: sanitizedName,
    description: frontmatter.description,
    location: filePath,
    body: match[2]?.trim() ?? '',
  };
}

async function collectSkillFiles(dir) {
  const results = [];
  const entries = await fs.promises.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      const nested = await collectSkillFiles(fullPath);
      results.push(...nested);
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      results.push(fullPath);
    }
  }

  return results;
}

const execute = async ({ skillPath }) => {
  if (!skillPath || typeof skillPath !== 'string') {
    return { error: 'skillPath must be a non-empty string' };
  }

  const resolvedPath = path.resolve(resolveHome(skillPath));

  let stats;
  try {
    stats = await fs.promises.stat(resolvedPath);
  } catch (error) {
    return { error: `Skill path not found: ${resolvedPath}` };
  }

  if (!stats.isDirectory()) {
    return { error: `Skill path is not a directory: ${resolvedPath}` };
  }

  const skillFiles = await collectSkillFiles(resolvedPath);
  if (!skillFiles.length) {
    return { error: 'No SKILL.md files found in the provided directory', skillPath: resolvedPath };
  }

  const skills = [];
  for (const filePath of skillFiles) {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const parsed = parseSkillContent(content, filePath);
    if (parsed) {
      skills.push(parsed);
    }
  }

  if (!skills.length) {
    return { error: 'No valid SKILL.md files found (missing or invalid frontmatter)', skillPath: resolvedPath };
  }

  // return { skillPath: resolvedPath, count: skills.length, skills };
  return skills.map(({ name, body }) =>
    `<skill_content name="${name}">${body}</skill_content>`
  ).join('\n');
};

module.exports = { tool, execute };
