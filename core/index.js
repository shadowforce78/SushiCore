const express = require('express');
const path = require('path');
const cors = require('cors');
const ApiDocGenerator = require('./utils/docGenerator');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('./DB/connect'); // Ensure DB connection is established
require('../webApp/index'); // Start the web app
require('../discordBot/index'); // Start the Discord bot

const app = express();
const CORE_PORT = process.env.CORE_PORT;

// Configuration CORS
const corsOptions = {
    origin: [
        'http://localhost:8080', // WebApp
        'http://localhost:3000'  // API docs
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Middleware pour parser le JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes API
const POST_router = require('./routes/api/POST');
const GET_router = require('./routes/api/GET');
const PUT_router = require('./routes/api/PUT');
const DELETE_router = require('./routes/api/DELETE');

app.use('/api', POST_router); 
app.use('/api', GET_router); 
app.use('/api', PUT_router); 
app.use('/api', DELETE_router); 

// Route pour la documentation dynamique
app.get('/docs', (req, res) => {
    const docGenerator = new ApiDocGenerator(path.join(__dirname, 'routes'));
    const html = docGenerator.generateHTML();
    res.send(html);
});

// Route par défaut
app.get('/', (req, res) => {
    res.json({ 
        message: 'SushiCore API is running',
        docs: `http://localhost:${CORE_PORT}/docs`
    });
});

app.listen(CORE_PORT, () => {
    console.log(`API is running on port ${CORE_PORT}`);
    console.log(`📚 Documentation: http://localhost:${CORE_PORT}/docs`);
});
