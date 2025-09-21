const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    guildId: { type: String, required: false },
    userId: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const BotConfig = mongoose.model('BotConfig', configSchema);

module.exports = BotConfig;