const { Client, Collection } = require("discord.js");
const path = require('path');

// Charger les variables d'environnement depuis le fichier parent
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const client = new Client({
    intents: 32767,
});
module.exports = client;

// Global Variables
client.commands = new Collection();
client.slashCommands = new Collection();
client.config = require("./config.json");

// Ajouter le token et prefix depuis .env
client.config.token = process.env.DISCORD_TOKEN;
client.config.prefix = process.env.DISCORD_PREFIX;

// Initializing the project
require("./handler")(client);

if (!client.config.token) {
    console.error("❌ DISCORD_TOKEN manquant dans le fichier .env");
    process.exit(1);
}

client.login(client.config.token)
    .then(() => console.log("✅ Bot Discord en cours de connexion..."))
    .catch(error => {
        console.error("❌ Erreur de connexion du bot Discord:", error);
        process.exit(1);
    });