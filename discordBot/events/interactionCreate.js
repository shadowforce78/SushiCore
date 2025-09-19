const client = require("../index");

client.on("interactionCreate", async (interaction) => {
    // Slash Command Handling
    if (interaction.isCommand()) {
        await interaction.deferReply({ ephemeral: false }).catch(() => {});

        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd)
            return interaction.followUp({ content: "An error has occured " });

        const args = [];

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }
        
        // Vérifier les permissions utilisateur seulement si elles sont requises
        if (cmd.userperm) {
            if (!interaction.member) {
                return interaction.followUp({
                    content: "Cette commande ne peut être utilisée que dans un serveur.",
                });
            }
            
            const userperm = interaction.member.permissions.has(cmd.userperm);
            if (!userperm) {
                return interaction.followUp({
                    content: `Vous avez besoin de la permission \`${cmd.userperm}\` pour utiliser cette commande.`,
                });
            }
        }

        // Vérifier les permissions du bot seulement si elles sont requises
        if (cmd.botperm) {
            if (!interaction.guild || !interaction.guild.me) {
                return interaction.followUp({
                    content: "Cette commande ne peut être utilisée que dans un serveur.",
                });
            }
            
            const botperm = interaction.guild.me.permissions.has(cmd.botperm);
            if (!botperm) {
                return interaction.followUp({
                    content: `Le bot a besoin de la permission \`${cmd.botperm}\` pour utiliser cette commande.`,
                });
            }
        }
        
        // S'assurer que interaction.member est défini dans le contexte de serveur
        if (interaction.guild && !interaction.member) {
            interaction.member = interaction.guild.members.cache.get(interaction.user.id);
        }

        cmd.run(client, interaction, args);
    }

    // Context Menu Handling
    if (interaction.isContextMenu()) {
        await interaction.deferReply({ ephemeral: false });
        const command = client.slashCommands.get(interaction.commandName);
        if (command) command.run(client, interaction);
    }
});
