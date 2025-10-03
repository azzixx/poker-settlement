// frontend/src/App.js
import React, { useState } from "react";
import "./App.css";

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [results, setResults] = useState(null);
  const [buyinsHistory, setBuyinsHistory] = useState([]);
  const [activePlayer, setActivePlayer] = useState(null);

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
      const res = await fetch("https://poker-backend.onrender.com/calculate", {
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
      <div className="player-cards-container">
        {players.map((p) => (
          <div
            key={p.name}
            className="mini-card"
            onClick={() => setActivePlayer(activePlayer === p.name ? null : p.name)}
          >
            <h3>{p.name}</h3>
            <p>{p.buyinCount} buys / {p.buyinTotal}₪</p>

            {/* Expanded details */}
            {activePlayer === p.name && (
              <div className="expanded-card">
                <div className="buyin-controls">
                  <input
                    type="number"
                    value={p.buyinInput}
                    onChange={(e) => updateBuyinInput(p.name, e.target.value)}
                    placeholder="Amount"
                  />
                  <button onClick={() => addBuyin(p.name, p.buyinInput)}>➕</button>
                </div>

                <p>Status: {p.buyinCount} buys / {p.buyinTotal}₪</p>

                <div className="final-cash">
                  <label>Final Cash:</label>
                  <input
                    type="number"
                    value={p.final}
                    onChange={(e) => updateFinal(p.name, e.target.value)}
                    placeholder="0"
                  />
                </div>

                <button
                  className="remove-player"
                  onClick={() => setPlayers(players.filter((pl) => pl.name !== p.name))}
                >
                  ❌ Remove Player
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={calculate} className="calculate-btn">
        💰 Calculate
      </button>

      {/* Buy-ins History */}
      {buyinsHistory.length > 0 && (
        <div className="results-box">
          <h2>🪙 Buy-ins History</h2>
          <div className="card-container">
            {buyinsHistory.map((b) => (
              <div key={b.id} className="buyin-card">
                <p>
                  <b>{b.name}</b> bought in {b.amount}₪
                </p>
                <small>{new Date(b.timestamp).toLocaleTimeString()}</small>
                <button className="remove-buyin" onClick={() => removeBuyin(b.id)}>
                  ❌
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary & Settlements */}
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
                  <p>Net: {s.net >= 0 ? "+" : ""}
                    {s.net}₪
                  </p>
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
