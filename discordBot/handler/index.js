const { glob } = require("glob");
const { Client } = require("discord.js");
const path = require('path');

/**
 * @param {Client} client
 */
module.exports = async (client) => {
    const botPath = path.join(__dirname, '..');
    
    try {
        console.log("🔄 Chargement des commandes et événements...");
        
        // Commands
        const commandFiles = await glob(`${botPath}/commands/**/*.js`.replace(/\\/g, '/'));
        commandFiles.forEach((filePath) => {
            try {
                const absolutePath = path.resolve(filePath);
                const file = require(absolutePath);
                const splitted = filePath.split('/');
                const directory = splitted[splitted.length - 2];

                if (file.name) {
                    const properties = { directory, ...file };
                    client.commands.set(file.name, properties);
                }
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de la commande ${filePath}:`, error.message);
            }
        });

        // Events
        const eventFiles = await glob(`${botPath}/events/*.js`.replace(/\\/g, '/'));
        eventFiles.forEach((filePath) => {
            try {
                const absolutePath = path.resolve(filePath);
                require(absolutePath);
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de l'événement ${filePath}:`, error.message);
            }
        });

        // Slash Commands
        const slashCommands = await glob(`${botPath}/SlashCommands/*/*.js`.replace(/\\/g, '/'));
        const arrayOfSlashCommands = [];
        
        slashCommands.forEach((filePath) => {
            try {
                const absolutePath = path.resolve(filePath);
                const file = require(absolutePath);
                if (!file?.name) return;
                client.slashCommands.set(file.name, file);

                if (["MESSAGE", "USER"].includes(file.type)) delete file.description;
                arrayOfSlashCommands.push(file);
            } catch (error) {
                console.error(`❌ Erreur lors du chargement de la slash command ${filePath}:`, error.message);
            }
        });
        
        client.on("clientReady", async () => {
            try {
                // Register slash commands
                if (arrayOfSlashCommands.length > 0) {
                    await client.application.commands.set(arrayOfSlashCommands);
                    console.log(`⚡ ${arrayOfSlashCommands.length} slash commands enregistrées`);
                }
                console.log(`📝 ${client.commands.size} commandes normales chargées`);
            } catch (error) {
                console.error("❌ Erreur lors de l'enregistrement des slash commands:", error);
            }
        });

        console.log("🔗 Handler initialisé avec succès");
        
    } catch (error) {
        console.error("❌ Erreur lors du chargement du bot Discord:", error);
        throw error;
    }
};
