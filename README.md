# simple-ai-agent

## Configuration

On startup, the app checks whether an AI provider is configured. If not, it will prompt you with a menu to select a provider and enter the required settings. It writes these values to a `.env` file and reloads them automatically.

You can also configure manually. Use `.env.example` as a template and create a `.env` file in the project root.

### Cerebras

To use Cerebras as the AI provider, set the following environment variables:

```
AI_PROVIDER=cerebras
CEREBRAS_API_KEY=your_cerebras_api_key
CEREBRAS_MODEL=your_cerebras_model
```

### Ollama

To use Ollama as the AI provider, set the following environment variables:

```
AI_PROVIDER=ollama
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=your_ollama_model
```

### Groq

To use Groq as the AI provider, set the following environment variables:

```
AI_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=your_groq_model
```

## Available Tools

Out of the box, the agent loads these local tools:

- `fetch_webpage` — Fetch the content of a webpage
- `get_user_location` — Get the location of the user
- `get_weather` — Get the current weather in a given location
- `list_directory_contents` — List all files and folders in the current directory
- `read_file_content` — Read the full content of a specified file
- `write_file` — Write content to a specified file

## Skills Configuration (skillz.json)

This project uses the `skillz` CLI (via MCP) to discover and manage AI skills. The configuration lives in `skillz.json` in the project root.

By default, `skillz.json` is set up to scan standard classic skill directories for Gemini, Claude, and OpenAI Codex, plus a local `skills/` folder:

```json
{
  "skillDirectories": [
    "~/.gemini/skills",
    "~/.claude/skills",
    "~/.codex/skills",
    "skills"
  ]
}
```

### How to Customize

- Add or remove directories in `skillDirectories` to change where skills are discovered.
- Use `additionalSkills` to include extra one-off skill folders.
- Use `ignore` to filter out skills by name/pattern.
- Set `includeInstructions` to `true` if you want Skillz to embed full `SKILL.md` contents when syncing targets.

If you create or move skills, update `skillz.json` and re-run `skillz sync` (if you use sync targets) or call the `list_available_skills` tool to refresh the available list.
