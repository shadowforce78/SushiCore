const mongoose = require('mongoose');
const MONGO_URL = process.env.MONGO_URL;


mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
    });

module.exports = mongoose;