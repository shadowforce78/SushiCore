const { Client, CommandInteraction, MessageEmbed } = require("discord.js");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;

module.exports = {
    name: "getnote",
    description: "Retrieves a note from the database",
    type: 1, // ApplicationCommandType.ChatInput (slash command)
    options: [
        {
            name: "note_id",
            description: "The ID of the note to retrieve",
            type: 3, // STRING type
            required: false,
        }
    ],
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        try {
            if (!interaction.options.getString("note_id")) {
                // Récupérer toutes les notes
                const response = await fetch(`${API}/api/note`, { method: 'GET' });
                if (!response.ok) {
                    return interaction.followUp({ content: "Erreur lors de la récupération des notes." });
                }

                const notes = await response.json();
                if (notes.length === 0) {
                    return interaction.followUp({ content: "Aucune note trouvée." });
                }

                const formattedNotes = notes.map(note => {
                    const embed = new MessageEmbed()
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

                return interaction.followUp({ embeds: formattedNotes });
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
                    return interaction.followUp({ content: "Note non trouvée." });
                }

                if (!response.ok) {
                    return interaction.followUp({ content: `Erreur lors de la récupération de la note: ${response.statusText}` });
                }

                const note = await response.json();
                const formattedNote = new MessageEmbed()
                    .setTitle(note.title)
                    .addFields(
                        { name: "UUID", value: note.uuid },
                        { name: "Tags", value: note.tags.join(', ') },
                        { name: "Content", value: note.content },
                        { name: "Created", value: new Date(note.createdAt).toLocaleString() },
                        { name: "Updated", value: new Date(note.updatedAt).toLocaleString() }
                    )
                    .setColor("#0099ff");

                return interaction.followUp({ embeds: [formattedNote] });
            }
        } catch (error) {
            console.error('Erreur dans getnote command:', error);
            return interaction.followUp({ content: "Une erreur est survenue lors de la récupération des notes." });
        }
    },
};
