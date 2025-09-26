const { ChatInputCommandInteraction, ApplicationCommandOptionType } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../../.env'));

const DiscordMessageSchema = require('../../../../core/DB/models/discordMessage');
const API = process.env.API;

module.exports = new ApplicationCommand({
    command: {
        name: 'deletemessage',
        description: 'Supprimer un message Discord sauvegardé par son UUID',
        type: 1,
        options: [
            {
                name: "uuid",
                description: "L'UUID du message à supprimer",
                type: ApplicationCommandOptionType.String,
                required: true,
            }
        ]
    },
    options: {
        cooldown: 5000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const uuid = interaction.options.getString("uuid");

            try {
                // Vérifier d'abord si le message existe
                const existingMessage = await DiscordMessageSchema.findOne({ uuid });
                if (!existingMessage) {
                    await interaction.editReply({ 
                        content: `❌ Aucun message trouvé avec l'UUID: \`${uuid}\`` 
                    });
                    return;
                }

                // Supprimer le message
                await DiscordMessageSchema.findOneAndDelete({ uuid });

                await interaction.editReply({ 
                    content: `✅ Message supprimé avec succès !\n**UUID:** \`${uuid}\`\n**Lien:** ${existingMessage.messageLink}` 
                });

            } catch (deleteError) {
                console.error('Erreur lors de la suppression:', deleteError);
                await interaction.editReply({ 
                    content: `❌ Erreur lors de la suppression: ${deleteError.message}` 
                });
            }

        } catch (error) {
            console.error('Erreur dans deletemessage command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "Une erreur est survenue lors de la suppression du message." });
            } else {
                await interaction.reply({ content: "Une erreur est survenue lors de la suppression du message." });
            }
        }
    }
}).toJSON();