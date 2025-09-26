const mongoose = require('mongoose');

const discordMessageSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    messageLink: { type: String, required: true },
    messageText: { type: String, required: false },
    messageImage: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const DiscordMessage = mongoose.model('DiscordMessage', discordMessageSchema);

module.exports = DiscordMessage;