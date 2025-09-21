const BotConfig = require('../../../core/DB/models/botConfig');

class Database {
    // Méthode pour s'assurer qu'une valeur existe, sinon utiliser la valeur par défaut
    async ensure(key, defaultValue, options = {}) {
        try {
            let query = { key };
            if (options.guildId) query.guildId = options.guildId;
            if (options.userId) query.userId = options.userId;

            let config = await BotConfig.findOne(query);
            
            if (!config) {
                config = new BotConfig({
                    key,
                    value: defaultValue,
                    guildId: options.guildId,
                    userId: options.userId
                });
                await config.save();
                return defaultValue;
            }
            
            return config.value;
        } catch (error) {
            console.error('Database ensure error:', error);
            return defaultValue;
        }
    }

    // Méthode pour obtenir une valeur
    async get(key, options = {}) {
        try {
            let query = { key };
            if (options.guildId) query.guildId = options.guildId;
            if (options.userId) query.userId = options.userId;

            const config = await BotConfig.findOne(query);
            return config ? config.value : null;
        } catch (error) {
            console.error('Database get error:', error);
            return null;
        }
    }

    // Méthode pour définir une valeur
    async set(key, value, options = {}) {
        try {
            let query = { key };
            if (options.guildId) query.guildId = options.guildId;
            if (options.userId) query.userId = options.userId;

            await BotConfig.findOneAndUpdate(
                query,
                { 
                    value, 
                    updatedAt: new Date(),
                    guildId: options.guildId,
                    userId: options.userId
                },
                { upsert: true, new: true }
            );
            
            return value;
        } catch (error) {
            console.error('Database set error:', error);
            return null;
        }
    }

    // Méthode pour supprimer une valeur
    async delete(key, options = {}) {
        try {
            let query = { key };
            if (options.guildId) query.guildId = options.guildId;
            if (options.userId) query.userId = options.userId;

            await BotConfig.findOneAndDelete(query);
            return true;
        } catch (error) {
            console.error('Database delete error:', error);
            return false;
        }
    }
}

module.exports = Database;