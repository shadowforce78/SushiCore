const client = require("../index");


client.on("ready", () => {
    console.log(`✅ ${client.user.tag} est en ligne et prêt !`);
    console.log(`📊 Connecté à ${client.guilds.cache.size} serveur(s)`);

    // Activité simple sans setInterval pour éviter les problèmes
    client.user.setActivity('SushiCore API', { type: 'WATCHING' });
})
