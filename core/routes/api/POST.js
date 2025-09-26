const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');
const DiscordMessage = require('../../DB/models/discordMessage');
const crypto = require('crypto');

router.post('/note', async (req, res) => {
    const { title, tags, content } = req.body;
    try {
        // Générer un UUID unique
        const uuid = crypto.randomUUID();

        // Traiter les tags : si c'est une string, la séparer par des virgules
        let processedTags = [];
        if (tags) {
            if (Array.isArray(tags)) {
                processedTags = tags.filter(t => t && t.trim() !== '').map(t => t.trim());
            } else if (typeof tags === 'string') {
                processedTags = tags.split(',').filter(t => t && t.trim() !== '').map(t => t.trim());
            }
        }

        const newNote = new Note({
            uuid,
            title,
            tags: processedTags,
            content
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/discord-message', async (req, res) => {
    const { messageLink } = req.body;
    
    try {
        if (!messageLink || typeof messageLink !== 'string') {
            return res.status(400).json({ error: 'Le lien du message est requis' });
        }

        // Validation basique du format de lien Discord
        if (!messageLink.includes('discord.com/channels/')) {
            return res.status(400).json({ error: 'Format de lien Discord invalide' });
        }

        // Vérifier si le message existe déjà
        const existingMessage = await DiscordMessage.findOne({ messageLink });
        if (existingMessage) {
            return res.status(409).json({ error: 'Ce message Discord est déjà sauvegardé' });
        }

        // Générer un UUID unique
        const uuid = crypto.randomUUID();

        // Pour l'instant, on sauvegarde juste le lien
        // L'extraction du contenu pourrait être ajoutée plus tard avec des webhooks Discord ou une API
        const newDiscordMessage = new DiscordMessage({
            uuid,
            messageLink,
            messageText: 'Message sauvegardé depuis le site web',
            messageImage: null
        });

        await newDiscordMessage.save();
        res.status(201).json({
            success: true,
            message: 'Message Discord sauvegardé avec succès',
            data: newDiscordMessage
        });

    } catch (error) {
        console.error('Erreur lors de la sauvegarde du message Discord:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
    }
});


module.exports = router;
