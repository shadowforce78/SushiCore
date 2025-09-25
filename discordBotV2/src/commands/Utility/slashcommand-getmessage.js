const { ChatInputCommandInteraction, EmbedBuilder } = require("discord.js");
const DiscordBot = require("../../client/DiscordBot");
const ApplicationCommand = require("../../structure/ApplicationCommand");
const path = require('path');
require('dotenv').config(path.join(__dirname, '../../.env'));


module.exports = new ApplicationCommand({
    command: {
        name: 'getmessage',
        description: "Test command (just for test)",
        type: 1,
        options: [
            {
                name: "link",
                description: "A message link to fetch",
                type: 3, // STRING
                required: true,
            }
        ]

    },
    options: {
        cooldown: 5000
    },
    /**
     * @param {DiscordBot} client
     * @param {ChatInputCommandInteraction} interaction
     */
    run: async (client, interaction) => {
        try {
            await interaction.deferReply();

            // Liens d'exemple (messages "forwarded")
            const links = interaction.options.getString("link").split(/\s+/).filter(l => l.startsWith('http'));
            if (links.length === 0) {
                await interaction.editReply({ content: "Vous devez fournir au moins un lien de message Discord valide." });
                return;
            }

            const parseLink = (link) => {
                // /channels/{guildId}/{channelId}/{messageId}
                const parts = link.split('/');
                return { channelId: parts[5], messageId: parts[6] };
            };

            const isImageUrl = (url) => /\.(png|jpe?g|gif|webp|bmp|tiff|apng)$/i.test(url);
            const cdnLike = (url) => /cdn\.discord(app)?\.com\/attachments\//i.test(url);
            const findUrls = (text) => {
                if (!text || typeof text !== 'string') return [];
                const re = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:/?#[\]@!$&'()*+,;=%]*)?)/gi;
                const out = [];
                let m; while ((m = re.exec(text)) !== null) out.push(m[1]);
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

                // Si le contenu contient des liens de message Discord, tenter d'extraire aussi leurs images (un niveau)
                const messageLinkRe = /https?:\/\/discord\.com\/channels\/\d+\/\d+\/\d+/gi;
                const jumpLinks = (msg.content || '').match(messageLinkRe) || [];
                for (const jl of jumpLinks.slice(0, 3)) { // limiter pour éviter les boucles
                    try {
                        const parts = jl.split('/');
                        const chId = parts[5];
                        const mId = parts[6];
                        if (chId && mId) {
                            const ch = await client.channels.fetch(chId);
                            const jm = await ch?.messages.fetch(mId);
                            if (jm) {
                                const sub = await extractImagesFromMessage(jm);
                                for (const u of sub) urls.push(u);
                            }
                        }
                    } catch {}
                }
                return Array.from(new Set(urls));
            };

            const results = [];
            for (const link of links) {
                try {
                    const { channelId, messageId } = parseLink(link);
                    const channel = await client.channels.fetch(channelId);
                    if (!channel) {
                        results.push({ link, error: 'Channel introuvable' });
                        continue;
                    }

                    const msg = await channel.messages.fetch(messageId);
                    if (!msg) {
                        results.push({ link, error: 'Message introuvable' });
                        continue;
                    }

                    let imageUrls = await extractImagesFromMessage(msg);
                    // Si c'est une réponse, tenter de récupérer l'original (utile quand le forward se matérialise en embed)
                    try {
                        if (msg.reference?.messageId) {
                            const ref = await msg.fetchReference();
                            const refImages = await extractImagesFromMessage(ref);
                            imageUrls = Array.from(new Set([...imageUrls, ...refImages]));
                        }
                    } catch {}

                    // Texte: message principal + message référencé + jump links
                    const textParts = [];
                    const mainText = extractTextFromMessage(msg);
                    if (mainText) textParts.push(mainText);

                    // Texte du message référencé
                    try {
                        if (msg.reference?.messageId) {
                            const ref = await msg.fetchReference();
                            const refText = extractTextFromMessage(ref);
                            if (refText) textParts.push(refText);
                        }
                    } catch {}

                    // Texte des jump links présents dans le contenu
                    try {
                        const messageLinkRe = /https?:\/\/discord\.com\/channels\/\d+\/\d+\/\d+/gi;
                        const jumpLinks = (msg.content || '').match(messageLinkRe) || [];
                        for (const jl of jumpLinks.slice(0, 3)) {
                            const partsJL = jl.split('/');
                            const chId = partsJL[5];
                            const mId = partsJL[6];
                            if (chId && mId) {
                                const ch = await client.channels.fetch(chId);
                                const jm = await ch?.messages.fetch(mId);
                                if (jm) {
                                    const jlText = extractTextFromMessage(jm);
                                    if (jlText) textParts.push(jlText);
                                }
                            }
                        }
                    } catch {}

                    const contentText = (textParts.join('\n\n').trim().slice(0, 1200)) || '(aucun texte)';
                    results.push({ link, contentText, imageUrls });
                } catch (err) {
                    console.error('Erreur de récupération message:', err);
                    results.push({ link, error: 'Erreur lors de la récupération' });
                }
            }

            // Construire un seul embed: texte agrégé + première image trouvée
            const okResults = results.filter(r => !r.error);
            const aggregatedText = okResults
                .map(r => r.contentText)
                .filter(Boolean)
                .join('\n\n')
                .trim();
            const firstImage = okResults.find(r => (r.imageUrls || []).length > 0)?.imageUrls[0];

            const singleEmbed = new EmbedBuilder()
                .setTitle(okResults.length > 1 ? 'Messages récupérés' : 'Message récupéré')
                .setColor('#0099ff');
            if (links.length > 0) {
                try { singleEmbed.setURL(links[0]); } catch {}
            }
            singleEmbed.setDescription((aggregatedText || '(aucun texte)').slice(0, 4000));
            if (firstImage) singleEmbed.setImage(firstImage);

            // Si tous les résultats sont en erreur, retourner la première erreur
            if (okResults.length === 0) {
                const firstErr = results[0]?.error || 'Erreur inconnue';
                await interaction.editReply({ content: `Erreur: ${firstErr}` });
                return;
            }

            await interaction.editReply({ embeds: [singleEmbed] });
        } catch (error) {
            console.error('Erreur dans getmessage command:', error);
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: "Une erreur est survenue lors de la récupération des messages." });
            } else {
                await interaction.reply({ content: "Une erreur est survenue lors de la récupération des messages." });
            }
        }
    }
}).toJSON();