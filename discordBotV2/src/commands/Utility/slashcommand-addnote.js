const { ChatInputCommandInteraction, ApplicationCommandOptionType } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));
const API = process.env.API;



module.exports = new ApplicationCommand({
    command: {
        name: 'addnote',
        description: 'Adds a new note to the system.',
        type: 1,
        options: [
            {
                name: "title",
                description: "The title of the note",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "content",
                description: "The content of the note",
                type: ApplicationCommandOptionType.String,
                required: true,
            },
            {
                name: "tags",
                description: "Comma-separated list of tags for the note",
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
            // Déférer la réponse pour pouvoir utiliser editReply ensuite
            await interaction.deferReply({ ephemeral: false });

            const title = interaction.options.getString("title");
            const content = interaction.options.getString("content");
            const tagsInput = interaction.options.getString("tags");
            const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(Boolean) : [];

            const response = await fetch(`${API}/api/note`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title, tags, content })
            });

            if (response.ok) {
                const newNote = await response.json();
                await interaction.editReply({ content: `Note ajoutée avec succès: ${newNote.title} (UUID: ${newNote.uuid})` });
                return;
            }

            let errMsg = response.statusText;
            try {
                const errJson = await response.json();
                if (errJson && (errJson.message || errJson.error)) {
                    errMsg = errJson.message || errJson.error;
                }
            } catch {}

            await interaction.editReply({ content: `Erreur lors de l'ajout de la note: ${errMsg}` });
        } catch (error) {
            console.error('Erreur dans addnote command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "Une erreur est survenue lors de l'ajout de la note." });
            } else {
                await interaction.reply({ content: "Une erreur est survenue lors de l'ajout de la note." });
            }
        }
    }
}).toJSON();