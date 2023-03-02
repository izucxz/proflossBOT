const fetch = require("node-fetch");
const { InteractionType } = require("discord.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Events,
} = require("discord.js");
const client = require("../index.js");
const axios = require("axios");
const Web3 = require("web3");
// A map to store saved Ethereum addresses for each user
const savedAddresses = new Map();

client.on("interactionCreate", async (interaction) => {
  // code
  if (interaction.type == InteractionType.ApplicationCommand) {
    const { commandName } = interaction;
    const options = interaction.options;

    switch (commandName) {
      case "ping":
        {
          await interaction.reply({
            content: "`Pong`",
          });
        }
        break;

      case "gas":
        {
          const apiKey = "YVWJPBY1SA6PGZUGUJDAVAG9G9HGVEPFQR";
          const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.status == "1") {
            const { SafeGasPrice, ProposeGasPrice, FastGasPrice } = data.result;
            await interaction.reply({
              embeds: [
                {
                  title: "⛽ Current gas prices",
                  fields: [
                    {
                      name: "Slow 🐌 | >10 minutes",
                      value: `${SafeGasPrice} Gwei`,
                    },
                    {
                      name: "Average 🏃‍♀️ | 3 minutes",
                      value: `${ProposeGasPrice} Gwei`,
                    },
                    {
                      name: "Fast ⚡ | 15 seconds",
                      value: `${FastGasPrice} Gwei`,
                    },
                  ],
                },
              ],
            });
          } else {
            await interaction.reply({
              content: "Failed to fetch gas prices.",
            });
          }
        }
        break;

      case "eth":
        {
          const url =
            "https://api.etherscan.io/api?module=stats&action=ethprice";
          const response = await fetch(url);
          const data = await response.json();
          const ethPrice = data.result.ethusd;

          await interaction.reply({
            embeds: [
              {
                title: "💸 Current ethereum price",
                description: `$${ethPrice} USD`,
                color: 0x1e90ff,
              },
            ],
          });
        }
        break;

      case "opensea": {
        const { commandName, options } = interaction;
        const collectionName = options.getString("collection");

        axios
          .get(`https://api.opensea.io/api/v1/collection/${collectionName}`, {
            headers: {
              Accept: "application/json",
            },
          })
          .then((response) => {
            const data = response.data;
            const infoEmbed = {
              color: 12781105,
              title: data.collection.name,
              url: data.collection.external_url,
              thumbnail: {
                url: data.collection.large_image_url,
              },
              fields: [
                {
                  name: "Total Quantity",
                  value: data.collection.stats.count,
                  inline: true,
                },
                {
                  name: "Number of Owners",
                  value: data.collection.stats.num_owners,
                  inline: true,
                },
                {
                  name: "Floor Price",
                  value: `${data.collection.stats.floor_price}Ξ`,
                  inline: true,
                },
                {
                  name: "Twitter",
                  value: `[${data.collection.twitter_username}](https://twitter.com/${data.collection.twitter_username})`,
                  inline: true,
                },
                {
                  name: "Discord",
                  value: `[${data.collection.discord_url}](${data.collection.discord_url})`,
                  inline: true,
                },
                {
                  name: "30d Volume",
                  value: `${Math.round(
                    data.collection.stats.thirty_day_volume
                  )}Ξ`,
                  inline: true,
                },
              ],
              timestamp: new Date(),
            };

            interaction.reply({ embeds: [infoEmbed] });
          })
          .catch((error) => {
            interaction.reply({
              content: `**${collectionName}** Collection not found.`,
              ephemeral: true,
            });
          });
        break;
      }

      case "save_wallet":
        // Check if the user has specified the 'add' option
        const addOption = options.get("address");
        if (addOption) {
          const user = interaction.user;
          const address = addOption.value;

          // Check if the provided Ethereum address is valid
          const web3 = new Web3("https://mainnet.infura.io/v3/your_project_id");
          if (!web3.utils.isAddress(address)) {
            await interaction.reply({
              content: "Please provide a valid Ethereum address.",
              ephemeral: true,
            });
            return;
          }

          // Check if the user has already saved an Ethereum address
          const savedAddress = savedAddresses.get(user.id);
          if (savedAddress) {
            await interaction.reply({
              content:
                "You have already saved an Ethereum address. You cannot save another one.",
              ephemeral: true,
            });
            return;
          }

          // Save the user's Ethereum address
          savedAddresses.set(user.id, address);

          await interaction.reply({
            content: `Your Ethereum address \`${address}\` has been saved.`,
            ephemeral: true,
          });
        } else {
          await interaction.reply({
            content:
              "Please provide an Ethereum address using the `/save_wallet` command with the `add` option. Example usage: `/save_wallet add 0x123abc...`",
          });
        }
        break;

      case "wallet":
        const user = interaction.user;
        const savedAddress = savedAddresses.get(user.id);

        if (!savedAddress) {
          await interaction.reply({
            content: "`You have not saved any Ethereum addresses yet.`",
            ephemeral: true,
          });
          return;
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("secondary")
            .setLabel("➕")
            .setStyle("Secondary"),
          new ButtonBuilder()
            .setCustomId("delete_wallet")
            .setLabel("❌")
            .setStyle("Danger")
        );

        const embed = {
          color: 0xff0000,
          author: {
            name: `AlphaKing`
          },
          title: "Wallet Manager",
          fields: [
            {
              name: " ",
              value: `\`${savedAddress}\``,
            },
          ],
        };

        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
        break;

      default:
        break;
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const user = interaction.user;

    switch (interaction.customId) {
      case "delete_wallet":
        // Check if the user has already saved an Ethereum address
        const savedAddress = savedAddresses.get(user.id);
        if (!savedAddress) {
          await interaction.reply({
            content: "You have not saved any Ethereum address.",
            ephemeral: true,
          });
          return;
        }

        // Delete the saved Ethereum address for the user
        savedAddresses.delete(user.id);

        // Create the embed message with the deleted Ethereum address
        const embed = {
          color: 0xff0000,
          title: "The following address has been deleted",
          fields: [
            {
              name: " ",
              value: `\`${savedAddress}\``,
            },
          ],
          timestamp: new Date(),
        };
        await interaction.reply({ embeds: [embed], ephemeral: true });
        break;
        
      // Add cases for other button clicks if needed
    }
  }
});
