const express = require('express');
const router = express.Router();
const Note = require('../../DB/models/note');
const DiscordMessage = require('../../DB/models/discordMessage');

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

// Supprimer un message Discord par UUID
router.delete('/discord-message/:uuid', async (req, res) => {
    const { uuid } = req.params;
    try {
        const message = await DiscordMessage.findOneAndDelete({ uuid });
        if (!message) {
            return res.status(404).json({ error: 'Discord message not found' });
        }
        res.json({ message: 'Discord message deleted successfully', deletedMessage: message });
    } catch (error) {
        console.error('Error deleting discord message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;