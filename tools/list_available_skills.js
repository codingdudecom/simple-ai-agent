const path = require('path');

const tool = {
  type: "function",
  function: {
    name: "list_available_skills",
    description: "List available skills using the local skillz configuration",
    parameters: {
      type: "object",
      properties: {
        syncedOnly: {
          type: "boolean",
          description: "Return only skills that have been synced (present in .skillz-cache.json)"
        },
        unsyncedOnly: {
          type: "boolean",
          description: "Return only skills that have not been synced"
        }
      },
      additionalProperties: false
    },
  },
};

const execute = async ({ syncedOnly = false, unsyncedOnly = false } = {}) => {
  if (syncedOnly && unsyncedOnly) {
    return { error: "syncedOnly and unsyncedOnly cannot both be true" };
  }

  try {
    const [{ loadConfig }, { scanAllSkillDirectories }, { loadCache }, { setQuiet }] = await Promise.all([
      import('skillz/dist/core/config.js'),
      import('skillz/dist/core/skill-scanner.js'),
      import('skillz/dist/core/cache-manager.js'),
      import('skillz/dist/utils/logger.js'),
    ]);

    // Suppress skillz logging during tool execution
    if (typeof setQuiet === 'function') {
      setQuiet(true);
    }

    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      return {
        error: "No skillz configuration found. Run `skillz init` first or add a skillz.json file.",
        configPath: path.join(cwd, 'skillz.json'),
      };
    }

    const skills = await scanAllSkillDirectories(config);

    let filteredSkills = skills;
    if (syncedOnly || unsyncedOnly) {
      const cache = await loadCache(cwd);
      const syncedNames = new Set(cache ? Object.keys(cache.skills || {}) : []);
      if (syncedOnly) {
        filteredSkills = skills.filter((skill) => syncedNames.has(skill.name));
      } else if (unsyncedOnly) {
        filteredSkills = skills.filter((skill) => !syncedNames.has(skill.name));
      }
    }

    return {
      count: filteredSkills.length,
      skills: filteredSkills.map((skill) => ({
        name: skill.name,
        description: skill.description,
        path: skill.path,
      })),
    };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = { tool, execute };
