const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../../.env'));

const DiscordMessageSchema = require('../../../../core/DB/models/discordMessage');

module.exports = new ApplicationCommand({
    command: {
        name: 'getmessagebyuuid',
        description: 'Récupérer un message Discord sauvegardé par son UUID',
        type: 1,
        options: [
            {
                name: "uuid",
                description: "L'UUID du message à récupérer",
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
                const message = await DiscordMessageSchema.findOne({ uuid });
                
                if (!message) {
                    await interaction.editReply({ 
                        content: `❌ Aucun message trouvé avec l'UUID: \`${uuid}\`\nUtilisez \`/listmessages\` pour voir tous les messages sauvegardés.` 
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle('📋 Message Discord récupéré')
                    .setURL(message.messageLink)
                    .setColor('#0099ff')
                    .addFields(
                        { name: 'UUID', value: `\`${message.uuid}\``, inline: true },
                        { name: 'Date de sauvegarde', value: new Date(message.createdAt).toLocaleDateString('fr-FR'), inline: true },
                        { name: 'Lien original', value: `[Cliquez ici](${message.messageLink})`, inline: false }
                    )
                    .setTimestamp(new Date(message.createdAt));

                if (message.messageText) {
                    embed.setDescription(message.messageText.length > 2000 
                        ? message.messageText.substring(0, 1997) + '...' 
                        : message.messageText);
                }

                if (message.messageImage) {
                    embed.setImage(message.messageImage);
                }

                await interaction.editReply({ embeds: [embed] });

            } catch (dbError) {
                console.error('Erreur lors de la récupération:', dbError);
                await interaction.editReply({ 
                    content: `❌ Erreur lors de la récupération du message: ${dbError.message}` 
                });
            }

        } catch (error) {
            console.error('Erreur dans getmessagebyuuid command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "Une erreur est survenue lors de la récupération du message." });
            } else {
                await interaction.reply({ content: "Une erreur est survenue lors de la récupération du message." });
            }
        }
    }
}).toJSON();