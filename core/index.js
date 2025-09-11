const express = require('express');
const path = require('path');
const ApiDocGenerator = require('./utils/docGenerator');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('./DB/connect'); // Ensure DB connection is established

const app = express();
const CORE_PORT = process.env.CORE_PORT;

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
    console.log(`Server is running on port ${CORE_PORT}`);
    console.log(`📚 Documentation: http://localhost:${CORE_PORT}/docs`);
});