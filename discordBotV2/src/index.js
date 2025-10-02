const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const fs = require('fs');
const DiscordBot = require('./client/DiscordBot');
const { setDiscordClient } = require('../../core/utils/discordClientProvider');

fs.writeFileSync('./terminal.log', '', 'utf-8');
const client = new DiscordBot();

module.exports = client;

// Register the client for API usage
client.once('ready', () => {
    setDiscordClient(client);
});

client.connect();

process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);