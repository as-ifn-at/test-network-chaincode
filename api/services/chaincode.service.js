
const express = require('express');
const bodyParser = require('body-parser');
const { InvokeTxn } = require('../invoke');
const { Query } = require('../query');

const app = express();

// Parse JSON request bodies
app.use(bodyParser.json());

// Define a route for handling GET requests
app.get('/api/invoke',async (req, res) => {
let z = await InvokeTxn()

  res.send(`Hello, world! : `);
});
app.get('/api/query',async (req, res) => {
  let z = await Query()
  
    res.send(`Hello, world! : ${JSON.stringify(z)}`);
  });
// Define a route for handling POST requests
// app.post('/api/greet', (req, res) => {
//   const name = req.body.name;
//   res.send(`Hello, ${name}!`);
// });

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
