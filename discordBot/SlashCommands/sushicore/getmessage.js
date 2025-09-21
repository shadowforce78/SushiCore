const { Client, CommandInteraction, ApplicationCommandType } = require("discord.js");


module.exports = {
    name: "message",
    description: "Get info about a message by ID",
    type: 1, // ApplicationCommandType.ChatInput (slash command)
    /**
     *
     * @param {Client} client
     * @param {CommandInteraction} interaction
     * @param {String[]} args
     */
    run: async (client, interaction, args) => {
        const link1 = "https://discord.com/channels/719633806536998942/1056248218121408603/1419361902013976576"
        const link2 = "https://discord.com/channels/719633806536998942/1056248218121408603/1419362156897636485"

        // For both links, get the message content and author
        const getMessageData = async (link) => {
            try {
                const parts = link.split('/');
                const serverId = parts[4];
                const channelId = parts[5];
                const messageId = parts[6];

                const channel = await client.channels.fetch(channelId);
                const message = await channel.messages.fetch(messageId);
                const messageData = message.toJSON(); // [object Object]
                return `Send in <#${channelId}> by ${message.author.tag}: ${JSON.stringify(messageData)}`;
            } catch (error) {
                return `Error fetching message: ${error.message}`;
            }
        };

        const messageInfo1 = await getMessageData(link1);
        const messageInfo2 = await getMessageData(link2);

        interaction.followUp({ content: `${messageInfo1}\n\n${messageInfo2}` });
    },
};
