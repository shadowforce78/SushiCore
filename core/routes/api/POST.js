const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');
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


module.exports = router;
