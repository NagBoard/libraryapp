const express = require('express');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);

const publicDirectoryPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicDirectoryPath));

const dbFilePath = path.join(__dirname, '..', 'db', 'main.db');
const db = new sqlite3.Database(dbFilePath);

app.get('/', (req, res) => {
    const mainHtmlPath = path.join(publicDirectoryPath, 'main.html');
    res.sendFile(mainHtmlPath);
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
