const { Client, CommandInteraction, ApplicationCommandType } = require("discord.js");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;

module.exports = {
    name: "getnote",
    description: "Retrieves a note from the database",
    type: ApplicationCommandType.ChatInput,
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
                const response = await fetch(`${API}/api/notes`, { method: 'GET' });
                if (!response.ok) {
                    return interaction.followUp({ content: "Erreur lors de la récupération des notes." });
                }

                const notes = await response.json();
                if (notes.length === 0) {
                    return interaction.followUp({ content: "Aucune note trouvée." });
                }

                const formattedNotes = notes.map(note => {
                    return `**UUID:** ${note.uuid}\n**Title:** ${note.title}\n**Tags:** ${note.tag.join(', ')}\n**Content:** ${note.content.substring(0, 100)}...\n**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
                }).join('\n---\n');

                return interaction.followUp({ content: formattedNotes });
            } else {
                // Récupérer une note spécifique par ID
                const noteId = interaction.options.getString("note_id");
                const response = await fetch(`${API}/api/notes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: noteId })
                });

                if (response.status === 404) {
                    return interaction.followUp({ content: "Note non trouvée." });
                }

                if (!response.ok) {
                    return interaction.followUp({ content: "Erreur lors de la récupération de la note." });
                }

                const note = await response.json();
                const formattedNote = `**UUID:** ${note.uuid}\n**Title:** ${note.title}\n**Tags:** ${note.tag.join(', ')}\n**Content:** ${note.content}\n**Created:** ${new Date(note.createdAt).toLocaleString()}\n**Updated:** ${new Date(note.updatedAt).toLocaleString()}\n`;

                return interaction.followUp({ content: formattedNote });
            }
        } catch (error) {
            console.error('Erreur dans getnote command:', error);
            return interaction.followUp({ content: "Une erreur est survenue lors de la récupération des notes." });
        }
    },
};
