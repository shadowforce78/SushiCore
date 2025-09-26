const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../../.env'));

const DiscordMessageSchema = require('../../../../core/DB/models/discordMessage');

module.exports = new ApplicationCommand({
    command: {
        name: 'listmessages',
        description: 'Lister tous les messages Discord sauvegardés',
        type: 1,
        options: []
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

            try {
                const messages = await DiscordMessageSchema.find().sort({ createdAt: -1 }).limit(10);

                if (messages.length === 0) {
                    await interaction.editReply({ 
                        content: "📭 Aucun message Discord sauvegardé trouvé.\nUtilisez `/savemessage` pour sauvegarder des messages." 
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setTitle('📋 Messages Discord sauvegardés')
                    .setDescription(`Voici les ${messages.length} derniers messages sauvegardés :`)
                    .setColor('#0099ff')
                    .setFooter({ text: `Total: ${messages.length} message(s)` })
                    .setTimestamp();

                messages.forEach((message, index) => {
                    const date = new Date(message.createdAt).toLocaleDateString('fr-FR');
                    const preview = message.messageText 
                        ? (message.messageText.length > 50 
                            ? message.messageText.substring(0, 50) + '...' 
                            : message.messageText)
                        : 'Aucun texte';
                    
                    embed.addFields({
                        name: `${index + 1}. ${date}`,
                        value: `**UUID:** \`${message.uuid}\`\n**Aperçu:** ${preview}${message.messageImage ? '\n🖼️ *Contient une image*' : ''}`,
                        inline: false
                    });
                });

                await interaction.editReply({ embeds: [embed] });

            } catch (dbError) {
                console.error('Erreur lors de la récupération:', dbError);
                await interaction.editReply({ 
                    content: `❌ Erreur lors de la récupération des messages: ${dbError.message}` 
                });
            }

        } catch (error) {
            console.error('Erreur dans listmessages command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "Une erreur est survenue lors de la récupération des messages." });
            } else {
                await interaction.reply({ content: "Une erreur est survenue lors de la récupération des messages." });
            }
        }
    }
}).toJSON();