const {
  Client,
  GatewayIntentBits,
  Partials,
  ApplicationCommandType,
  Interaction,
  InteractionType,
} = require("discord.js");

const { TOKEN } = require("./settings/config");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

module.exports = client;

const handlers = ["event_handler"];
handlers.forEach((file) => {
  require(`./handlers/${file}`)(client);
});

client.login(TOKEN);
