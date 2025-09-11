const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');

// Supprimer une note par ID
router.delete('/note/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const note = await Note.findByIdAndDelete(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }
        res.json({ message: 'Note deleted successfully', deletedNote: note });
    } catch (error) {
        console.error('Error deleting note:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;