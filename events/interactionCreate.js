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
          const addresses = addOption.value.split(",").map((address) => address.trim());
          
          // Check if all provided Ethereum addresses are valid
          const web3 = new Web3("https://mainnet.infura.io/v3/your_project_id");
          if (!addresses.every((address) => web3.utils.isAddress(address))) {
            await interaction.reply({
              content: "Please provide valid Ethereum addresses.",
              ephemeral: true,
            });
            return;
          }
      
          // Add the new addresses to the user's list of saved addresses
          let savedAddressesArray = savedAddresses.get(user.id) || [];
          const newAddresses = addresses.filter((address) => !savedAddressesArray.includes(address));
          savedAddressesArray.push(...newAddresses);
          savedAddresses.set(user.id, savedAddressesArray);
          const message = newAddresses.length === 1
            ? `Ethereum address \`${newAddresses[0]}\` has been saved.`
            : `Ethereum addresses \`${newAddresses.join(", ")}\` have been saved.`;
          await interaction.reply({
            content: message,
            ephemeral: true,
          });
        }
        break;
      
      case "wallet_delete":
          // Check if the user has specified the 'index' option
          const indexOption = options.get("index");
          if (indexOption) {
            const user = interaction.user;
            const savedAddressesArray = savedAddresses.get(user.id) || [];
        
            // Convert the index option to an array of integers
            const indexes = indexOption.value.split(",").map((i) => parseInt(i) - 1);
        
            // Check if all the specified indexes are valid
            if (
              indexes.some((i) => isNaN(i) || i < 0 || i >= savedAddressesArray.length)
            ) {
              await interaction.reply({
                content: "Invalid index.",
                ephemeral: true,
              });
              return;
            }
        
            // Delete the specified addresses
            const deletedAddresses = [];
            indexes.sort().forEach((i) => {
              const address = savedAddressesArray.splice(i, 1)[0];
              deletedAddresses.push(address);
            });
        
            savedAddresses.set(user.id, savedAddressesArray);
            await interaction.reply({
              content: `Ethereum address${indexes.length > 1 ? "es" : ""} ${
                deletedAddresses.map((a) => `\`${a}\``).join(", ")
              } ${indexes.length > 1 ? "have" : "has"} been deleted.`,
              ephemeral: true,
            });
          }
          break;
        
      case "wallet":
          const user = interaction.user;
          const savedAddress = savedAddresses.get(user.id);
  
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("left_page")
              .setLabel("◀")
              .setStyle("Primary"),
            new ButtonBuilder()
              .setCustomId("right_page")
              .setLabel("▶")
              .setStyle("Primary"),
            new ButtonBuilder()
              .setCustomId("refresh_wallet")
              .setLabel("🔄")
              .setStyle("Primary"),
            new ButtonBuilder()
              .setCustomId("reset_wallet")
              .setLabel("❎ Reset")
              .setStyle("Danger")
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
      case "reset_wallet":
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
          content: "Wallet has been reset.",
          ephemeral: true,
        });
        break;

      case "refresh_wallet":
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

      }
  }
});
