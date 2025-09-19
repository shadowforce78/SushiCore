const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');

// Modifier une note existante
router.put('/note/:id', async (req, res) => {
    const { title, tag, content } = req.body;
    
    try {
        // Traiter les tags : si c'est une string, la séparer par des virgules
        let processedTags = [];
        if (tag !== undefined) {
            if (Array.isArray(tag)) {
                processedTags = tag.filter(t => t && t.trim() !== '').map(t => t.trim());
            } else if (typeof tag === 'string') {
                processedTags = tag.split(',').filter(t => t && t.trim() !== '').map(t => t.trim());
            }
        }
        
        const updatedNote = await Note.findByIdAndUpdate(
            req.params.id,
            {
                title, 
                tag: processedTags, 
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