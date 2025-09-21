const { Client, CommandInteraction, ApplicationCommandType } = require("discord.js");


module.exports = {
    name: "ping",
    description: "returns websocket ping",
    type: 1, // ApplicationCommandType.ChatInput (slash command)
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        interaction.followUp({ content: `${client.ws.ping}ms!` });
    },
};
