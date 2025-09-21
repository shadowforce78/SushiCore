const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');

// Récupérer toutes les notes
router.get('/note', async (req, res) => {
    try {
        const notes = await Note.find().sort({ createdAt: -1 });
        res.json(notes);
    } catch (error) {
        console.error('Error fetching notes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Récupérer une note par ID (UUID)
router.get('/note/:uuid', async (req, res) => {
    const { uuid } = req.params;
    try {
        const note = await Note.findOne({ uuid });
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json(note);
    } catch (error) {
        console.error('Error fetching note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;