const tool = {
  type: "function",
  function: {
    name: "fetch_webpage",
    description: "Fetch the content of a webpage",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "The URL of the webpage to fetch",
        },
      },
      required: ["url"],
    },
  },
};

const execute = async ({ url }) => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.text();
    return { content };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = { tool, execute };