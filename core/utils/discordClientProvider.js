/**
 * Discord Bot Client Provider
 * This module provides access to the Discord bot client for API usage
 */

let discordClient = null;

/**
 * Set the Discord client instance
 * @param {Object} client - Discord client instance
 */
const setDiscordClient = (client) => {
    discordClient = client;
    console.log('✅ Discord client registered for API usage');
};

/**
 * Get the Discord client instance
 * @returns {Object|null} - Discord client or null if not initialized
 */
const getDiscordClient = () => {
    return discordClient;
};

/**
 * Check if Discord client is ready
 * @returns {boolean} - True if client is ready
 */
const isDiscordClientReady = () => {
    return discordClient && discordClient.isReady && discordClient.isReady();
};

module.exports = {
    setDiscordClient,
    getDiscordClient,
    isDiscordClientReady
};
