const express = require('express');
const http = require('http');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const server = http.createServer(app);

const publicDirectoryPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicDirectoryPath));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const dbFilePath = path.join(__dirname, '..', 'db', 'main.db');
const db = new sqlite3.Database(dbFilePath);

app.get('/', (req, res) => {
    const mainHtmlPath = path.join(publicDirectoryPath, 'main.html');
    res.sendFile(mainHtmlPath);
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get('SELECT * FROM user WHERE username = ? AND password = ?', [username, password], (err, row) => {
        if (err) {
            res.status(500).send('Error on the server.');
        } else if (row) {
            res.status(200).send('Login successful!');
        } else {
            res.status(401).send('Invalid username or password.');
        }
    });
});

app.post('/register', (req, res) => {
    const { username, password, name, surname, email } = req.body;
    db.run('INSERT INTO user (username, password, name, surname, email) VALUES (?, ?)', [username, password, name, surname, email], (err) => {
        if (err) {
            res.status(500).send('Error registering new user please try again.');
        } else {
            res.status(200).send('Welcome to the club! Registration successful!');
        }
    });
});

server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
