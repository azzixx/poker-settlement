// backend/index.js
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

const BUYIN_AMOUNT = 50; // fallback only

app.post("/calculate", (req, res) => {
  const players = Array.isArray(req.body.players) ? req.body.players : [];

  let totalNet = 0;
  const summary = [];
  let debtors = [], creditors = [];

  for (const p of players) {
    const invested =
      Number.isFinite(Number(p.invested))
        ? Number(p.invested)
        : (Number.isFinite(Number(p.buyins)) ? Number(p.buyins) * BUYIN_AMOUNT : 0);

    const final = Number(p.final) || 0;
    const net = final - invested;

    summary.push({ name: p.name || "Player", invested, final, net });
    totalNet += net;

    if (net < 0) debtors.push({ name: p.name, amt: -net });
    else if (net > 0) creditors.push({ name: p.name, amt: net });
  }

  // Greedy settle
  debtors.sort((a, b) => b.amt - a.amt);
  creditors.sort((a, b) => b.amt - a.amt);
  const transfers = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const pay = Math.min(debtors[i].amt, creditors[j].amt);
    transfers.push({ from: debtors[i].name, to: creditors[j].name, amount: Math.round(pay) });
    debtors[i].amt -= pay;
    creditors[j].amt -= pay;
    if (debtors[i].amt <= 0.000001) i++;
    if (creditors[j].amt <= 0.000001) j++;
  }

  res.json({ summary, totalNet, transfers });
});

// Serve React build
app.use(express.static(path.join(__dirname, "../frontend/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

app.listen(4000, () => console.log("✅ Backend running on http://localhost:4000"));
