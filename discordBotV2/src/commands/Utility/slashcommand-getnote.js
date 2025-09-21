const { ChatInputCommandInteraction, ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;



module.exports = new ApplicationCommand({
    command: {
        name: 'getnote',
        description: 'Replies with Pong!',
        type: 1,
        options: [
            {
                name: "note_id",
                description: "The ID of the note to retrieve",
                type: ApplicationCommandOptionType.String,
                required: false,
            }
        ]

    },
    options: {
        cooldown: 5000
    },
    /**
     * 
     * @param {DiscordBot} client 
     * @param {ChatInputCommandInteraction} interaction 
     */
    run: async (client, interaction) => {
        try {
            if (!interaction.options.getString("note_id")) {
                // Récupérer toutes les notes
                const response = await fetch(`${API}/api/note`, { method: 'GET' });
                if (!response.ok) {
                    await interaction.reply({ content: "Erreur lors de la récupération des notes." });
                    return;
                }

                const notes = await response.json();
                if (notes.length === 0) {
                    await interaction.reply({ content: "Aucune note trouvée." });
                    return;
                }

                const formattedNotes = notes.map(note => {
                    const embed = new EmbedBuilder()
                        .setTitle(note.title)
                        .addFields(
                            { name: "UUID", value: note.uuid },
                            { name: "Tags", value: note.tags.join(', ') },
                            { name: "Content", value: note.content.substring(0, 100) + '...' },
                            { name: "Created", value: new Date(note.createdAt).toLocaleString() }
                        )
                        .setColor("#0099ff");
                    return embed;
                });

                await interaction.reply({ embeds: formattedNotes });
            } else {
                // Récupérer une note spécifique par ID
                const noteId = interaction.options.getString("note_id");
                const response = await fetch(`${API}/api/note/${noteId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.status === 404) {
                    await interaction.reply({ content: "Note non trouvée." });
                    return;
                }

                if (!response.ok) {
                    await interaction.reply({ content: `Erreur lors de la récupération de la note: ${response.statusText}` });
                    return;
                }

                const note = await response.json();
                const formattedNote = new EmbedBuilder()
                    .setTitle(note.title)
                    .addFields(
                        { name: "UUID", value: note.uuid },
                        { name: "Tags", value: note.tags.join(', ') },
                        { name: "Content", value: note.content },
                        { name: "Created", value: new Date(note.createdAt).toLocaleString() },
                        { name: "Updated", value: new Date(note.updatedAt).toLocaleString() }
                    )
                    .setColor("#0099ff");

                await interaction.reply({ embeds: [formattedNote] });
            }
        } catch (error) {
            console.error('Erreur dans getnote command:', error);
            // Vérifier si l'interaction n'a pas déjà été répondue
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: "Une erreur est survenue lors de la récupération des notes." });
            }
        }
    }
}).toJSON();