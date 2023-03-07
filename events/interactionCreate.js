const fetch = require("node-fetch");
const { InteractionType } = require("discord.js");
const {
  ActionRowBuilder,
  ButtonBuilder,
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const client = require("../index.js");
const axios = require("axios");
const Web3 = require("web3");
// A map to store saved Ethereum addresses for each user
const savedAddresses = new Map();
const etherscanApiKey = "YVWJPBY1SA6PGZUGUJDAVAG9G9HGVEPFQR";

client.on("interactionCreate", async (interaction) => {
  // code
  if (interaction.type == InteractionType.ApplicationCommand) {
    const { commandName } = interaction;
    const options = interaction.options;

    switch (commandName) {
      case "ping":
        {
          await interaction.reply({
            content: "https://media.tenor.com/c9WptHOa_LMAAAAC/pong.gif",
          });
        }
        break;

      case "gas":
        {
          const url = `https://api.etherscan.io/api?module=gastracker&action=gasoracle&apikey=${etherscanApiKey}`;

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

      case "wallet_add":
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
              "Please provide an Ethereum address using the `/wallet_add` command with the `add` option. Example usage: `/wallet_add add 0x123abc...`",
          });
        }
        break;

      case "wallet":
        const user = interaction.user;
        const savedAddress = savedAddresses.get(user.id);

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("delete_wallet")
            .setLabel("❎ Delete")
            .setStyle("Secondary"),
          new ButtonBuilder()
            .setCustomId("refresh_wallet")
            .setLabel("🔄 Refresh")
            .setStyle("Secondary"),
          new ButtonBuilder()
            .setCustomId("balance")
            .setLabel("🏧 Balance")
            .setStyle("Secondary")
        );

        let embed = {
          color: 0xff0000,
          author: {
            name: ` `,
          },
          title: "Wallet Manager",
        };

        if (savedAddress) {
          embed.fields = [
            {
              name: " ",
              value: `\`${savedAddress}\``,
            },
          ];
        } else {
          embed.description = "No saved wallet";
        }

        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
        break;

      case "profit":
        const contractAddress = options.getString("contract_address");
        const requestOptions = {
          method: "GET",
          url:
            "https://api.blockspan.com/v1/collections/contract/" +
            contractAddress,
          params: { chain: "eth-main" },
          headers: {
            accept: "application/json",
            "X-API-KEY": "OXwNjFcCtiqTI1AMa4704sdNaUszfGb1",
          },
        };
        try {
          if (interaction.deferred || interaction.replied) {
            return;
          }

          // defer the interaction before processing the request
          await interaction.deferReply();

          // send an initial "loading" message
          const loadingEmbed = {
            title: "Collection Name",
            author: {
              name: " ",
            },
            description: "Showing profit/loss information",
            fields: [
              {
                name: "Floor Price",
                value: "`Loading`",
                inline: false,
              },
              {
                name: "Links",
                value: `[opensea]() ⎔ [looksrare]() ⎔ [blur]() ⎔ [x2y2]() ⎔ [website]() ⎔ [discord]()`,
                inline: true,
              },
            ],
          };
          const loadingMessage = await interaction.editReply({
            embeds: [loadingEmbed],
          });

          const response = await axios(requestOptions);
          console.log(response.data);

          // process the response data
          const name = response.data.name;
          const exchangeData = response.data.exchange_data.find(
            (data) => data.exchange === "opensea"
          );
          const banner_image_url = exchangeData.banner_image_url;
          const openseaUrl = exchangeData.exchange_url;
          const openseaExternalUrl = exchangeData.external_url;
          const openseaDiscordUrl = exchangeData.discord_url;
          const blurUrl = `https://blur.io/collection/${contractAddress}`;
          const x2y2Url = `https://x2y2.io/collection/${contractAddress}`;
          const looksrareUrl = `https://looksrare.org/collections/${contractAddress}`;

          // fetch floor price of the collection
          const floorPriceOptions = {
            method: "GET",
            url: `https://data-api.nftgo.io/eth/v1/collection/${contractAddress}/metrics`,
            headers: {
              accept: "application/json",
              "X-API-KEY": "311ce43a-f864-4143-bc73-bf90762fa428",
            },
          };
          const floorPriceResponse = await axios(floorPriceOptions);
          const floorPrice = floorPriceResponse.data.floor_price.quantity;

          // send an embed message with the collection name in the title, the banner image, and floor price
          const embed = {
            title: `${name}`,
            author: {
              name: "Alpha King",
            },
            description: "Showing profit/loss information",
            image: {
              url: banner_image_url,
            },
            fields: [
              {
                name: "Floor Price",
                value: `\`${floorPrice} ETH\``,
                inline: false,
              },
              {
                name: "Links",
                value: `[opensea](${openseaUrl}) ⎔ [looksrare](${looksrareUrl}) ⎔ [blur](${blurUrl}) ⎔ [x2y2](${x2y2Url}) ⎔ [website](${openseaExternalUrl}) ⎔ [discord](${openseaDiscordUrl})`,
                inline: true,
              },
            ],
          };
          // edit the loading message with the actual data
          await loadingMessage.edit({ embeds: [embed] });
        } catch (error) {
          console.error(error);
        }
        break;

      default:
        break;
    }
  }
});

client.on("interactionCreate", async (interaction) => {
  if (interaction.isButton()) {
    const user = interaction.user;

    // Declare savedAddress variable here
    let savedAddress;

    switch (interaction.customId) {
      case "delete_wallet":
        // Check if the user has already saved an Ethereum address
        savedAddress = savedAddresses.get(user.id);
        if (!savedAddress) {
          await interaction.reply({
            content: "You have not saved any Ethereum address.",
            ephemeral: true,
          });
          return;
        }

        // Delete the saved Ethereum address for the user
        savedAddresses.delete(user.id);

        await interaction.reply({
          content: "The address has been deleted.",
          ephemeral: true,
        });
        break;

      case "refresh_wallet":
        // Get the saved Ethereum address for the user
        savedAddress = savedAddresses.get(user.id);
        if (!savedAddress) {
          // If there's no saved Ethereum address, update the embed to show "No saved wallet"
          let embed = {
            color: 0xff0000,
            author: {
              name: ` `,
            },
            title: "Wallet Manager",
            description: "No saved wallet",
          };

          await interaction.update({
            embeds: [embed],
            ephemeral: true,
          });
        } else {
          // If there's a saved Ethereum address, update the embed with the saved address
          let embed = {
            color: 0xff0000,
            author: {
              name: ` `,
            },
            title: "Wallet Manager",
            fields: [
              {
                name: " ",
                value: `\`${savedAddress}\``,
              },
            ],
          };

          await interaction.update({
            embeds: [embed],
            ephemeral: true,
          });
        }
        break;

      case "balance":
        // Get the saved Ethereum address for the user
        savedAddress = savedAddresses.get(user.id);
        if (!savedAddress) {
          // If there's no saved Ethereum address, send an error message
          await interaction.reply({
            content: "You have not saved any Ethereum address.",
            ephemeral: true,
          });
          return;
        }

        // Get the balance of the saved Ethereum address from etherscan.io API
        // Replace with your etherscan API key
        const etherscanApiUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${savedAddress}&tag=latest&apikey=${etherscanApiKey}`;
        const response = await fetch(etherscanApiUrl);
        const data = await response.json();
        const balance = data.result / 10 ** 18; // Convert wei to ether

        // Update the embed with the saved address and its balance
        let embed = {
          color: 0xff0000,
          author: {
            name: ` `,
          },
          title: "Wallet Manager",
          fields: [
            {
              name: "Address",
              value: `\`${savedAddress}\``,
            },
            {
              name: "Balance",
              value: `${balance} ETH`,
            },
          ],
        };

        await interaction.update({
          embeds: [embed],
          ephemeral: true,
        });
        break;
    }
  }
});
