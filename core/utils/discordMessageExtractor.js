/**
 * Utility functions to extract text and images from Discord messages
 */

const isImageUrl = (url) => /\.(png|jpe?g|gif|webp|bmp|tiff|apng)$/i.test(url);
const cdnLike = (url) => /cdn\.discord(app)?\.com\/attachments\//i.test(url);

const findUrls = (text) => {
    if (!text || typeof text !== 'string') return [];
    const re = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)/gi;
    const out = [];
    let m; 
    while ((m = re.exec(text)) !== null) out.push(m[1]);
    return out;
};

const collectImageUrlsFromObject = (obj, push) => {
    try {
        if (obj == null) return;
        if (typeof obj === 'string') {
            if (isImageUrl(obj) || cdnLike(obj)) push(obj);
            return;
        }
        if (Array.isArray(obj)) {
            for (const v of obj) collectImageUrlsFromObject(v, push);
            return;
        }
        if (typeof obj === 'object') {
            for (const k of Object.keys(obj)) {
                collectImageUrlsFromObject(obj[k], push);
            }
        }
    } catch {}
};

/**
 * Extract text content from a Discord message
 * @param {Object} msg - Discord message object
 * @returns {string} - Extracted text
 */
const extractTextFromMessage = (msg) => {
    const parts = [];
    if (msg?.content && typeof msg.content === 'string') {
        const trimmed = msg.content.trim();
        if (trimmed) parts.push(trimmed);
    }
    for (const e of msg?.embeds || []) {
        if (e.title) parts.push(e.title);
        if (e.description) parts.push(e.description);
        if (Array.isArray(e.fields)) {
            for (const f of e.fields) {
                if (!f) continue;
                const name = typeof f.name === 'string' ? f.name : '';
                const value = typeof f.value === 'string' ? f.value : '';
                const line = [name, value].filter(Boolean).join(': ');
                if (line) parts.push(line);
            }
        }
        if (e.footer?.text) parts.push(e.footer.text);
        if (e.author?.name) parts.push(e.author.name);
    }
    return parts.join('\n');
};

/**
 * Extract image URLs from a Discord message
 * @param {Object} msg - Discord message object
 * @returns {Promise<string[]>} - Array of image URLs
 */
const extractImagesFromMessage = async (msg) => {
    const urls = [];
    
    // Attachments
    for (const att of msg.attachments.values()) {
        const ctype = att.contentType || '';
        if (ctype.startsWith('image/') || isImageUrl(att.url) || isImageUrl(att.name || '')) {
            urls.push(att.proxyURL || att.url);
        }
    }
    
    // Stickers (statics / animated)
    if (msg.stickers && msg.stickers.size > 0) {
        for (const st of msg.stickers.values()) {
            if (st?.url) urls.push(st.url);
        }
    }
    
    // Embeds: direct image/thumbnail + any URL in description/title/fields
    for (const emb of msg.embeds) {
        if (emb.image?.url) urls.push(emb.image.url);
        if (emb.image?.proxyURL) urls.push(emb.image.proxyURL);
        if (emb.thumbnail?.url) urls.push(emb.thumbnail.url);
        if (emb.thumbnail?.proxyURL) urls.push(emb.thumbnail.proxyURL);
        if (emb.url) urls.push(emb.url);
        
        const parts = [];
        if (emb.title) parts.push(emb.title);
        if (emb.description) parts.push(emb.description);
        if (emb.author?.iconURL) urls.push(emb.author.iconURL);
        if (emb.footer?.iconURL) urls.push(emb.footer.iconURL);
        
        if (Array.isArray(emb.fields)) {
            for (const f of emb.fields) {
                if (!f) continue;
                if (typeof f.name === 'string') parts.push(f.name);
                if (typeof f.value === 'string') parts.push(f.value);
            }
        }
        
        for (const u of findUrls(parts.join('\n'))) {
            if (isImageUrl(u) || cdnLike(u)) urls.push(u);
        }
        
        // Inspection récursive du JSON brut de l'embed (forwarded/nested structures)
        try {
            const raw = typeof emb.toJSON === 'function' ? emb.toJSON() : null;
            if (raw) {
                collectImageUrlsFromObject(raw, (u) => {
                    if (typeof u === 'string' && (isImageUrl(u) || cdnLike(u))) urls.push(u);
                });
            }
        } catch {}
    }
    
    // Content URLs
    for (const u of findUrls(msg.content || '')) {
        if (isImageUrl(u) || cdnLike(u)) urls.push(u);
    }
    
    // Referenced message (reply/forward)
    if (msg.reference) {
        try {
            const refMsg = await msg.fetchReference();
            if (refMsg) {
                const refUrls = await extractImagesFromMessage(refMsg);
                urls.push(...refUrls);
            }
        } catch {}
    }
    
    // Deduplicate URLs
    return [...new Set(urls.filter(Boolean))];
};

/**
 * Parse Discord message link to extract IDs
 * @param {string} link - Discord message link
 * @returns {Object|null} - Object with channelId and messageId, or null if invalid
 */
const parseMessageLink = (link) => {
    try {
        if (!link || typeof link !== 'string') return null;
        if (!link.includes('discord.com/channels/')) return null;
        
        // Format: https://discord.com/channels/{guildId}/{channelId}/{messageId}
        const parts = link.split('/');
        if (parts.length < 7) return null;
        
        return { 
            guildId: parts[4],
            channelId: parts[5], 
            messageId: parts[6] 
        };
    } catch {
        return null;
    }
};

/**
 * Fetch and extract data from a Discord message
 * @param {Object} client - Discord client instance
 * @param {string} messageLink - Discord message link
 * @returns {Promise<Object>} - Object with messageText and messageImage
 */
const fetchMessageData = async (client, messageLink) => {
    const parsed = parseMessageLink(messageLink);
    if (!parsed) {
        throw new Error('Invalid Discord message link format');
    }

    const { channelId, messageId } = parsed;

    // Fetch channel
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
        throw new Error('Channel not found or bot does not have access');
    }

    // Fetch message
    const message = await channel.messages.fetch(messageId);
    if (!message) {
        throw new Error('Message not found');
    }

    // Extract data
    const messageText = extractTextFromMessage(message);
    const images = await extractImagesFromMessage(message);
    const messageImage = images.length > 0 ? images[0] : null;

    return {
        messageText: messageText || 'No text content',
        messageImage,
        allImages: images
    };
};

module.exports = {
    extractTextFromMessage,
    extractImagesFromMessage,
    parseMessageLink,
    fetchMessageData
};
