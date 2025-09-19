const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');
const crypto = require('crypto');

router.post('/note', async (req, res) => {
    const { title, tag, content } = req.body;
    try {
        // Générer un UUID unique
        const uuid = crypto.randomUUID();
        
        // Traiter les tags : si c'est une string, la séparer par des virgules
        let processedTags = [];
        if (tag) {
            if (Array.isArray(tag)) {
                processedTags = tag.filter(t => t && t.trim() !== '').map(t => t.trim());
            } else if (typeof tag === 'string') {
                processedTags = tag.split(',').filter(t => t && t.trim() !== '').map(t => t.trim());
            }
        }
        
        const newNote = new Note({ 
            uuid,
            title, 
            tag: processedTags, 
            content 
        });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Récupérer une note par ID via POST avec body param
router.post('/notes', async (req, res) => {
    const { id } = req.body;
    try {
        if (!id) {
            return res.status(400).json({ error: 'ID is required in body' });
        }
        
        const note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(note);
    } catch (error) {
        console.error('Error fetching note by ID:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
