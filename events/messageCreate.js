const client = require("../index.js");

client.on('messageCreate', async(message) => {
    console.log(message.content);
});