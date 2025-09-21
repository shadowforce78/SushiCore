const { Client, CommandInteraction, ApplicationCommandType } = require("discord.js");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;

module.exports = {
    name: "addnote",
    description: "Adds a note to the database",
    type: 1, // ApplicationCommandType.ChatInput (slash command)
    options: [
        {
            name: "title",
            description: "The title of the note",
            type: 3, // STRING type
            required: true,
        },
        {
            name: "content",
            description: "The content of the note",
            type: 3, // STRING type
            required: true,
        },
        {
            name: "tags",
            description: "Comma-separated list of tags for the note",
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
        const title = interaction.options.getString("title");
        const content = interaction.options.getString("content");
        const tags = interaction.options.getString("tags")?.split(",").map(tag => tag.trim()) || [];

        const response = await fetch(`${API}/api/note`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, tags, content })
        });

        if (response.ok) {
            const newNote = await response.json();
            return interaction.followUp({ content: `Note added successfully: ${newNote.title}` });
        } else {
            const error = await response.json();
            return interaction.followUp({ content: `Error adding note: ${error.message}` });
        }
    },
};