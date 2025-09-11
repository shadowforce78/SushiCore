const express = require('express');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const WEB_PORT = process.env.WEB_PORT;

const app = express();

app.listen(WEB_PORT, () => {
  console.log(`Web server is running on port ${WEB_PORT}`);
    console.log(`🌐 Access it at http://localhost:${WEB_PORT}`);
});
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});