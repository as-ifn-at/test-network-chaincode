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
  let z = await InvokeTxn('SaveDocument',req.body.GstinNo, req.body.AnnualRevenue, req.body.CreditHistory,
  req.body.CreditUtilization, req.body.DebtToEquityRatio, req.body.DefaultHistory, req.body.IndustryRiskv, 
  req.body.Liquidity, req.body.Location, req.body.MarketConditions, req.body.NetProfitMargin, 
  req.body.PaymentHistory, req.body.Profitability, req.body.RecentCreditInquiries, req.body.Solvency, req.body.TypesOfCreditUsed, req.body.YearsInBusiness, req.body.CreditScoreCalibration);
  res.send(z);
});

// Enroll Banks
app.post("/api/enrollbanks", async (req, res) => {
  let z = await InvokeTxn("EnrollBanks");
  res.send(z);
});

// Enroll SME
app.post("/api/enrollSME", async (req, res) => {
  console.log(req.body)
  let z = await InvokeTxn("EnrollSME", req.body.Name, req.body.GstinNo);
  res.send(z);
});

// Define a route for handling GET requests
app.post("/api/invoke", async (req, res) => {
  let z = await InvokeTxn();
  res.send(z);
});

// Read SME
app.get("/api/readsme", async (req, res) => {
  let z = await Query("ReadSME", req.body.GstinNo);
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
