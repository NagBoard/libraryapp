const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

const users = [];

app.get('/users', (req, res) => {
  res.json(users);
});

app.post('/users', (req, res) => {
  const user = { name: req.body.name, password: req.body.password };
  users.push(user);
  res.status(201).send();
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
