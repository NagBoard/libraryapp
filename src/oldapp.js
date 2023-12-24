const sqlite3 = require('sqlite3');
const express = require('express');

const path = require('path');
const app = express();
const port = 3000;

app.use(express.json()); // JSON for db
app.use(express.static('public')); // Enable serving of files from a folder "public"

app.get('/', (req, res) => {
  const mainPath = path.join(__dirname, '..', 'public', `main.html`);
  res.sendFile(mainPath);
});

app.get('/:page', (req, res) => {
  const pagePath = path.join(__dirname, '..', 'public', `${req.params.page}`);
  res.sendFile(pagePath);
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

///////////// TESTING AREA ////////////////////

const dbPath = path.join(__dirname, '..', 'db', 'test.db');
const testdb = new sqlite3.Database(dbPath);

app.post('/testing', (req, res) => {
  // Assume the request body has a property called 'test'
  const testData = req.body.test;

  // Store the data in the database (replace 'your_table' with your actual table name)
  testdb.run('INSERT INTO test_table (test_field) VALUES (?)', [testData], function (err) {
    if (err) {
      return res.status(500).json({ success: false, message: 'Error storing data in the database.' });
    }

    // Successful response
    res.json({ success: true, message: 'Data stored in the database.' });
  });
});


