# simple-ai-agent

## Configuration

To run the agent, you need to configure the AI provider and model using environment variables. You can create a `.env` file in the root of the project to store these variables.

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