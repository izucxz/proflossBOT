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
                  author: {
                    name: `Alpha King`,
                  },
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
                author: {
                  name: `Alpha King`,
                },
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

          // Add the new address to the user's list of saved addresses
          let savedAddressesArray = savedAddresses.get(user.id) || [];
          if (savedAddressesArray.includes(address)) {
            await interaction.reply({
              content: "You have already saved this Ethereum address.",
              ephemeral: true,
            });
          } else {
            savedAddressesArray.push(address);
            savedAddresses.set(user.id, savedAddressesArray);
            await interaction.reply({
              content: `Ethereum address ${address} has been saved.`,
              ephemeral: true,
            });
          }
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
            name: `Alpha King`,
          },
          fields: [
            {
              name: "Wallet Manager",
              value: " ",
              inline: true,
            },
            {
              name: "Total Wallets",
              value: `\`${
                savedAddress ? savedAddress.length.toString() : "0"
              }\``,
              inline: true,
            },
          ],
        };

        if (savedAddress) {
          embed.fields.push(
            ...savedAddress.map((address, index) => {
              return {
                name: " ",
                value: `\`${index + 1}. ${address}\``,
              };
            })
          );
        }

        await interaction.reply({
          embeds: [embed],
          components: [row],
          ephemeral: true,
        });
        break;

      case "profit":
        const interactionUser = interaction.user;
        const savedAddressProfit = savedAddresses.get(interactionUser.id);
        if (!savedAddressProfit) {
          await interaction.reply({
            content: "Save your Ethereum address first, using `/wallet_add`",
            ephemeral: true,
          });
          return;
        }
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
            color: 0xffa07a,
            title: "Collection Name",
            author: {
              name: "Alpha King",
              icon_url: `https://media.discordapp.net/attachments/1070244170196865086/1082636910205337700/AlphaKing.jpg`,
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
            color: 0xffa07a,
            title: `${name}`,
            author: {
              name: "Alpha King",
              icon_url: `https://media.discordapp.net/attachments/1070244170196865086/1082636910205337700/AlphaKing.jpg`,
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
          // code to make API request
        } catch (error) {
          console.error(error);
          if (error.response && error.response.status === 404) {
            const errorEmbed = {
              color: 0xffa07a,
              title: "Invalid collection",
              author: {
                name: "Alpha King",
                icon_url: `https://media.discordapp.net/attachments/1070244170196865086/1082636910205337700/AlphaKing.jpg`,
              },
              description: "Please provide a valid contract address.",
            };
            await interaction.editReply({
              embeds: [errorEmbed],
              ephemeral: true,
            });
          }
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
        const modal = new ModalBuilder()
          .setCustomId("myModal")
          .setTitle("Delete Wallet");

        // Add components to modal

        // Create the text input components
        const addressInput = new TextInputBuilder()
          .setCustomId("addressInput")
          .setLabel("Enter the Ethereum address to delete")
          .setPlaceholder("0x123...")
          // Paragraph means multiple lines of text.
          .setStyle(TextInputStyle.Paragraph);

        // An action row only holds one text input,
        const firstActionRow = new ActionRowBuilder().addComponents(
          addressInput
        );

        // Add inputs to the modal
        modal.addComponents(firstActionRow);

        // Show the modal to the user
        await interaction.showModal(modal);

        break;

      case "refresh_wallet":
        // Get the saved Ethereum addresses for the user
        const user = interaction.user;
        const savedAddressesArray = savedAddresses.get(user.id) || [];

        const totalWallets = savedAddressesArray.length;

        if (totalWallets > 0) {
          const embed = {
            color: 0xff0000,
            author: {
              name: `Alpha King`,
            },
            fields: [
              {
                name: "Wallet Manager",
                value: " ",
                inline: true,
              },
              {
                name: "Total Wallets",
                value: `\`${totalWallets.toString()}\``,
                inline: true,
              },
              ...savedAddressesArray.map((address, index) => ({
                name: " ",
                value: `\`${index + 1}. ${address}\``,
              })),
            ],
          };

          await interaction.update({
            embeds: [embed],
            ephemeral: true,
          });
        } else {
          const embed = {
            color: 0xff0000,
            author: {
              name: `Alpha King`,
            },
            fields: [
              {
                name: "Wallet Manager",
                value: " ",
                inline: true,
              },
              {
                name: "Total Wallets",
                value: `\`${
                  savedAddress ? savedAddress.length.toString() : "0"
                }\``,
                inline: true,
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
            name: `Alpha King`,
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

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isModalSubmit()) return;
  const user = interaction.user;

  // Declare savedAddress variable here
  let savedAddress;
  if (interaction.customId === "myModal") {
    // Check if the user has already saved an Ethereum address
    savedAddress = savedAddresses.get(user.id);
    // Delete the saved Ethereum address for the user
    savedAddresses.delete(user.id);

    await interaction.reply({
      content: "The address has been deleted.",
      ephemeral: true,
    });
  }
});
