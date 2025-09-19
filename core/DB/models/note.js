const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    uuid: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    tag: { type: Array, required: false },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
})

const Note = mongoose.model('Note', noteSchema);

module.exports = Note;