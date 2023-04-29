const express = require("express");
const bodyParser = require("body-parser");
const { InvokeTxn } = require("../invoke");
const { Query } = require("../query");

const app = express();

// Parse JSON request bodies
app.use(bodyParser.json());

// issue Loan
app.post("/api/loan", async (req, res) => {
  let z = await InvokeTxn();
  res.send(`${JSON.stringify(z)}`);
});

// Reapay Loan
app.get("/api/repayloan", async (req, res) => {
  let z = await InvokeTxn();
  res.send(`${JSON.stringify(z)}`);
});

// save Docs
app.post("/api/addDoc", async (req, res) => {
  let z = await InvokeTxn('SaveDocument',"123456", 12.5, '["klsa"]',
  12.4, 12.4, "jsd", 1.2, 34.3, "jksd", 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, "jnksd", 12.4, 823.2);
  res.send(z);
});

// Enroll Banks
app.get("/api/enrollbank", async (req, res) => {
  let z = await InvokeTxn("EnrollBanks");
  res.send(z);
});

// Enroll SME
app.get("/api/enrollSME", async (req, res) => {
  let z = await InvokeTxn("EnrollSME", "Asif", "123456");
  res.send(z);
});

// Define a route for handling GET requests
app.post("/api/invoke", async (req, res) => {
  let z = await InvokeTxn();

  res.send(`${JSON.stringify(z)}`);
});

// Read SME
app.get("/api/readsme", async (req, res) => {
  let z = await Query("ReadSME", "123456");
  res.send(z);
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
