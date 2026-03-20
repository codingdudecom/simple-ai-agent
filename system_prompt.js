const path = require('path');

async function getAgentDefinition() {
  return `**Agent Definition**
You are a practical, reliable AI agent that helps users accomplish tasks in this project.
You can call tools when it improves accuracy or efficiency.`;
}

async function getGoals() {
  return `**Goals**
- Deliver correct, actionable results.
- Prefer clarity and brevity over verbosity.
- Use tools when they materially improve outcomes.`;
}

async function getRestrictions() {
  return `**Restrictions**
- Do not fabricate tool results or file contents.
- Do not claim to have performed actions you did not perform.
- When unsure, ask a concise follow-up question.`;
}

async function getGuidelines() {
  return `**Guidelines**
- Be explicit about assumptions.
- Keep output structured and easy to scan.
- If a task can be solved with existing tools or files, prefer that.`;
}

async function getSkillsSection() {
  try {
    const [{ loadConfig }, { scanAllSkillDirectories }, { setQuiet }] = await Promise.all([
      import('skillz/dist/core/config.js'),
      import('skillz/dist/core/skill-scanner.js'),
      import('skillz/dist/utils/logger.js'),
    ]);

    if (typeof setQuiet === 'function') {
      setQuiet(true);
    }

    const cwd = process.cwd();
    const config = await loadConfig(cwd);

    if (!config) {
      return `**Available Skills**
- No skillz configuration found.
- Expected config at: ${path.join(cwd, 'skillz.json')}`;
    }

    const skills = await scanAllSkillDirectories(config);
    if (!skills.length) {
      return `**Available Skills**
- None detected.`;
    }

    const lines = [
      `**Available Skills**

The following skills provide specialized instructions for specific tasks.
When a task matches a skill's description, call the activate_skill tool with the skill's absolute path to load its full instructions.`,
    ];
    // for (const skill of skills) {
    //   lines.push(`- ${skill.name}: ${skill.description}`);
    // }
    return lines.join('\n') + '\n\n<available_skills>\n' + JSON.stringify(skills.map(({ name, description, path }) => ({ name, description, path })), null, 2) + '\n</available_skills>';
  } catch (error) {
    return `**Available Skills**
- Error loading skills: ${error.message}`;
  }
}

async function buildSystemPrompt() {
  const sections = await Promise.all([
    getAgentDefinition(),
    getGoals(),
    getRestrictions(),
    getGuidelines(),
    getSkillsSection(),
  ]);
  return sections.join('\n\n');
}

module.exports = {
  buildSystemPrompt,
  getAgentDefinition,
  getGoals,
  getRestrictions,
  getGuidelines,
  getSkillsSection,
};
