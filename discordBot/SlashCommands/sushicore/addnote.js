const { Client, CommandInteraction, ApplicationCommandType } = require("discord.js");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;

module.exports = {
    name: "addnote",
    description: "Retrieves a note from the database",
    type: 3, // ApplicationCommandType.ChatInput,
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
        if (!interaction.options.getString("note_id")) {
            const response = await fetch(`${API}/api/note`, { method: 'GET' });
            const notes = await response.json();
            if (notes.length === 0) {
                return interaction.followUp({ content: "No notes found." });
            }


            const formattedNotes = notes.map(note => {
                return `**ID:** ${note._id}\n**Title:** ${note.title}\n**Tags:** ${note.tag.join(', ')}\n**Content:** ${note.content}\n**Created At:** ${new Date(note.createdAt).toLocaleString()}\n**Updated At:** ${new Date(note.updatedAt).toLocaleString()}\n`;
            }).join('\n---\n');
            return interaction.followUp({ content: formattedNotes });
        }
    },
};
