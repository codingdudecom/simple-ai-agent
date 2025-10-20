const tool = {
  type: "function",
  function: {
    name: "get_user_location",
    description: "Get the location of the user",
    parameters: {},
  },
};

const execute = async ({}) => {
  // In a real application, you would call a weather API here
  return {
    location: "Bucharest",
  };
};

module.exports = { tool, execute };