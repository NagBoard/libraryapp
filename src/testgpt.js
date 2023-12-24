const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Enable parsing of JSON data in the request body
app.use(express.json());

// Adjust the path to your SQLite database
const dbPath = path.join(__dirname, 'db', 'test.db');
const db = new sqlite3.Database(dbPath);

// Endpoint for receiving data and storing it in the database
app.post('/api/store-data', (req, res) => {
  // Assume the request body has a property called 'test'
  const testData = req.body.test;

  // Store the data in the database (replace 'test_table' with your actual table name)
  db.run('INSERT INTO test_table (test_field) VALUES (?)', [testData], function (err) {
    if (err) {
      console.error('Error:', err.message);
      return res.status(500).json({ success: false, message: 'Error storing data in the database.' });
    }

    // Successful response
    res.json({ success: true, message: 'Data stored in the database.' });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
