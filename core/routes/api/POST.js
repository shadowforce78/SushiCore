const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');

router.post('/note', async (req, res) => {
    const { title, tag, content } = req.body;
    try {
        const newNote = new Note({ title, tag, content });
        await newNote.save();
        res.status(201).json(newNote);
    } catch (error) {
        console.error('Error creating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
