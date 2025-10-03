import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [results, setResults] = useState(null);
  const [buyinsHistory, setBuyinsHistory] = useState([]);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1";
    document.getElementsByTagName("head")[0].appendChild(meta);
  }, []);

  const addPlayer = () => {
    if (!name.trim() || players.find((p) => p.name === name)) return;
    setPlayers([
      ...players,
      { name, final: "", buyinInput: "", buyinCount: 0, buyinTotal: 0 },
    ]);
    setName("");
  };

  const addBuyin = (playerName, amount) => {
    const buyinValue = parseInt(amount) || 0;
    if (buyinValue <= 0) return;

    const newBuyin = {
      id: Date.now() + Math.random(),
      name: playerName,
      amount: buyinValue,
      timestamp: Date.now(),
    };
    setBuyinsHistory([...buyinsHistory, newBuyin]);

    setPlayers(
      players.map((p) =>
        p.name === playerName
          ? {
              ...p,
              buyinCount: p.buyinCount + 1,
              buyinTotal: p.buyinTotal + buyinValue,
              buyinInput: "",
            }
          : p
      )
    );
  };

  const removeBuyin = (id) => {
    const buyinToRemove = buyinsHistory.find((b) => b.id === id);
    if (!buyinToRemove) return;
    setBuyinsHistory(buyinsHistory.filter((b) => b.id !== id));
    setPlayers(
      players.map((p) =>
        p.name === buyinToRemove.name
          ? {
              ...p,
              buyinCount: p.buyinCount - 1,
              buyinTotal: p.buyinTotal - buyinToRemove.amount,
            }
          : p
      )
    );
  };

  const updateFinal = (name, value) => {
    setPlayers(players.map((p) => (p.name === name ? { ...p, final: value } : p)));
  };

  const updateBuyinInput = (name, value) => {
    setPlayers(players.map((p) => (p.name === name ? { ...p, buyinInput: value } : p)));
  };

  const calculate = async () => {
    const cleanPlayers = players.map((p) => ({
      ...p,
      invested: p.buyinTotal,
      final: parseInt(p.final) || 0,
    }));

    try {
      const res = await fetch("/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ players: cleanPlayers }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error("Error during calculate:", err);
      alert("❌ Failed to calculate. Please try again.");
    }
  };

  const copyToClipboard = () => {
    if (!results) return;
    const text = `Poker Settlement\n\nSummary:\n${results.summary
      .map((s) => `${s.name}: ${s.net >= 0 ? "+" : ""}${s.net}₪`)
      .join("\n")}\n\nSettlements:\n${results.transfers
      .map((t) => `${t.from} → ${t.to}: ${t.amount}₪`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    alert("📋 Results copied to clipboard!");
  };

  const shareWhatsApp = () => {
    if (!results) return;
    const text = `Poker Settlement\n\nSummary:\n${results.summary
      .map((s) => `${s.name}: ${s.net >= 0 ? "+" : ""}${s.net}₪`)
      .join("\n")}\n\nSettlements:\n${results.transfers
      .map((t) => `${t.from} → ${t.to}: ${t.amount}₪`)
      .join("\n")}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div className="App">
      <h1>♠️ Poker Settlement</h1>
      <div className="add-player">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter player name"
        />
        <button onClick={addPlayer}>➕ Add Player</button>
      </div>

      {/* Player Cards */}
      <div className="player-cards">
        {players.map((p) => (
          <div
            key={p.name}
            className={`player-card ${expanded === p.name ? "expanded" : ""}`}
            onClick={() => setExpanded(expanded === p.name ? null : p.name)}
          >
            <button
              className="remove-player-btn"
              onClick={(e) => {
                e.stopPropagation();
                setPlayers(players.filter((pl) => pl.name !== p.name));
              }}
            >
              ❌
            </button>

            <h3>{p.name}</h3>
            <p>{p.buyinTotal}₪ invested | {p.buyinCount} buys</p>
            <p>Final: {p.final || 0}₪</p>

            {expanded === p.name && (
              <div className="player-expanded" onClick={(e) => e.stopPropagation()}>
                <div className="buyin-controls">
                  <input
                    type="number"
                    value={p.buyinInput}
                    onChange={(e) => updateBuyinInput(p.name, e.target.value)}
                    placeholder="Amount"
                  />
                  <button onClick={() => addBuyin(p.name, p.buyinInput)}>➕ Buy-in</button>
                </div>
                <div className="final-cash-cell">
                  <input
                    type="number"
                    value={p.final}
                    onChange={(e) => updateFinal(p.name, e.target.value)}
                    placeholder="Final cash"
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button className="calculate-btn" onClick={calculate}>
        💰 Calculate
      </button>

      {results && (
        <div className="results-container">
          <div className="results-box">
            <h2>📊 Summary</h2>
            <div className="card-container">
              {results.summary.map((s) => (
                <div
                  key={s.name}
                  className={`player-card ${
                    s.net > 0 ? "winner" : s.net < 0 ? "loser" : "neutral"
                  }`}
                >
                  <h3>{s.name}</h3>
                  <p>Invested: {s.invested}₪</p>
                  <p>Final: {s.final}₪</p>
                  <p>Net: {s.net >= 0 ? "+" : ""}{s.net}₪</p>
                </div>
              ))}
            </div>
            <h3>🏆 Total Pot: {results.summary.reduce((a, b) => a + b.final, 0)}₪</h3>
            <h3>Balance Check: {results.totalNet}₪</h3>
          </div>

          <div className="results-box">
            <h2>💸 Settlements</h2>
            <div className="card-container">
              {results.transfers.length > 0 ? (
                results.transfers.map((t, i) => (
                  <div key={i} className="settlement-card">
                    <p>{t.from} → {t.to}</p>
                    <p className="amount">{t.amount}₪</p>
                  </div>
                ))
              ) : (
                <p>No transfers needed</p>
              )}
            </div>

            <div className="share-buttons">
              <button className="copy-btn" onClick={copyToClipboard}>📋 Copy</button>
              <button className="whatsapp-btn" onClick={shareWhatsApp}>💬 WhatsApp</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
