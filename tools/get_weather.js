const tool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
      },
      required: ["location"],
    },
  },
};

const execute = async ({ location }) => {
  // In a real application, you would call a weather API here
  return {
    location,
    temperature: "72F",
    forecast: "Sunny",
  };
};

module.exports = { tool, execute };