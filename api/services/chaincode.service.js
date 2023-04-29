const express = require('express');
const bodyParser = require('body-parser');

const app = express();

// Parse JSON request bodies
app.use(bodyParser.json());

// Define a route for handling GET requests
app.get('/api/hello', (req, res) => {
  res.send('Hello, world!');
});

// Define a route for handling POST requests
app.post('/api/greet', (req, res) => {
  const name = req.body.name;
  res.send(`Hello, ${name}!`);
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
