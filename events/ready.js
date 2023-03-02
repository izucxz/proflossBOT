const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const client = require("../index.js");

client.on("ready", () => {
  console.log("bot is ready");
  // client.application.commands.set([]);
  client.guilds.cache.get("1060090594279575552").commands.set([
    {
      name: "ping",
      description: "Check bot status",
      type: ApplicationCommandType.ChatInput,
    },
    {
      name: "gas",
      description: "Get Eth gas prices",
      type: ApplicationCommandType.ChatInput,
    },
    {
      name: "opensea",
      description: "Displays information about a specific OpenSea collection",
      type: ApplicationCommandType.ChatInput,
      options: [{
        name: 'collection',
        type: 3,
        description: 'The name or slug of the OpenSea collection to get information about.',
        required: true,
      }]
    },
    {
      name: "eth",
      description: "Ethereum price data",
      type: ApplicationCommandType.ChatInput,
    },
    {
      name: 'save_wallet',
      description: 'Save your Ethereum address',
      type: ApplicationCommandType.ChatInput,
      options: [
        {
          type: 3,
          name: 'address',
          description: 'Add your Ethereum address to the saved addresses',
          required: true,
          options: [{
              type: ApplicationCommandOptionType.STRING,
              name: 'address',
              description: 'Your Ethereum address',
              required: true,
            }]
        }],
    },
    {
      name: 'wallet',
      description: 'View your saved Ethereum addresses',
      type: ApplicationCommandType.ChatInput,
    },
  ]);
});
