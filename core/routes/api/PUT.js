const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');

// Modifier une note existante
router.put('/note/:id', async (req, res) => {
    const { id } = req.params;
    const { title, tag, content } = req.body;
    
    try {
        const updatedNote = await Note.findByIdAndUpdate(
            id,
            { 
                title, 
                tag, 
                content, 
                updatedAt: new Date()
            },
            { new: true, runValidators: true }
        );
        
        if (!updatedNote) {
            return res.status(404).json({ error: 'Note not found' });
        }
        
        res.json(updatedNote);
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;