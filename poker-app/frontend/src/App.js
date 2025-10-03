import React, { useState } from "react";
import "./App.css";

function App() {
  const [players, setPlayers] = useState([]);
  const [name, setName] = useState("");
  const [results, setResults] = useState(null);
  const [buyinsHistory, setBuyinsHistory] = useState([]);

  const addPlayer = () => {
    if (!name.trim() || players.find(p => p.name === name)) return;
    setPlayers([
      ...players,
      { name, final: "", buyinInput: "", buyinCount: 0, buyinTotal: 0 }
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
      timestamp: Date.now()
    };
    setBuyinsHistory([...buyinsHistory, newBuyin]);

    setPlayers(players.map(p =>
      p.name === playerName
        ? {
            ...p,
            buyinCount: p.buyinCount + 1,
            buyinTotal: p.buyinTotal + buyinValue,
            buyinInput: ""
          }
        : p
    ));
  };

  const removeBuyin = (id) => {
    const buyinToRemove = buyinsHistory.find(b => b.id === id);
    if (!buyinToRemove) return;

    setBuyinsHistory(buyinsHistory.filter(b => b.id !== id));

    setPlayers(players.map(p =>
      p.name === buyinToRemove.name
        ? {
            ...p,
            buyinCount: p.buyinCount - 1,
            buyinTotal: p.buyinTotal - buyinToRemove.amount
          }
        : p
    ));
  };

  const updateFinal = (name, value) => {
    setPlayers(players.map(p =>
      p.name === name ? { ...p, final: value } : p
    ));
  };

  const updateBuyinInput = (name, value) => {
    setPlayers(players.map(p =>
      p.name === name ? { ...p, buyinInput: value } : p
    ));
  };

  const calculate = async () => {
    const cleanPlayers = players.map(p => ({
      ...p,
      invested: p.buyinTotal,
      final: parseInt(p.final) || 0
    }));

    const res = await fetch("http://localhost:4000/calculate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ players: cleanPlayers })
    });
    const data = await res.json();
    setResults(data);
  };

  const buildShareMessage = () => {
    if (!results) return "";

    let text = "♠️ Poker Settlement Results\n\n";

    // Summary
    text += "📊 Summary:\n";
    results.summary.forEach(s => {
      text += `${s.name}: Invested ${s.invested}₪ | Final ${s.final}₪ | Net ${s.net >= 0 ? "+" : ""}${s.net}₪\n`;
    });

    text += `\n🏆 Total Pot: ${results.summary.reduce((a, b) => a + b.final, 0)}₪\n`;
    text += `Balance Check: ${results.totalNet}₪\n\n`;

    // Settlements
    text += "💸 Settlements:\n";
    if (results.transfers.length > 0) {
      results.transfers.forEach(t => {
        text += `${t.from} → ${t.to}: ${t.amount}₪\n`;
      });
    } else {
      text += "No transfers needed\n";
    }

    return text;
  };

  return (
    <div className="App">
      <h1>♠️ Poker Settlement</h1>
      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Enter player name"
      />
      <button onClick={addPlayer}>➕ Add Player</button>

      <table>
        <thead>
          <tr>
            <th>Player</th>
            <th>Buy-in</th>
            <th>Buy-in Status</th>
            <th>Final Cash</th>
            <th>Remove</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.name}>
              <td>{p.name}</td>

              {/* Buy-in */}
              <td>
                <div className="buyin-cell">
                  <div className="buyin-controls">
                    <input
                      type="number"
                      value={p.buyinInput}
                      onChange={e => updateBuyinInput(p.name, e.target.value)}
                      placeholder="Amount"
                    />
                    <button onClick={() => addBuyin(p.name, p.buyinInput)}>➕</button>
                  </div>
                </div>
              </td>

              {/* Buy-in Status */}
              <td>
                <span>
                  {p.buyinCount} buys / {p.buyinTotal}₪
                </span>
              </td>

              {/* Final Cash */}
              <td className="final-cash-cell">
                <input
                  type="number"
                  value={p.final}
                  onChange={e => updateFinal(p.name, e.target.value)}
                  placeholder="0"
                />
              </td>

              {/* Remove */}
              <td>
                <button
                  onClick={() => setPlayers(players.filter(pl => pl.name !== p.name))}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <button onClick={calculate} style={{ marginTop: 20, marginBottom: 20 }}>
        💰 Calculate
      </button>

      {/* Buy-ins History */}
      {buyinsHistory.length > 0 && (
        <div className="results-box">
          <h2>🪙 Buy-ins History</h2>
          <div className="card-container">
            {buyinsHistory.map((b) => (
              <div key={b.id} className="buyin-card">
                <p><b>{b.name}</b> bought in {b.amount}₪</p>
                <small>{new Date(b.timestamp).toLocaleTimeString()}</small>
                <button
                  className="remove-buyin"
                  onClick={() => removeBuyin(b.id)}
                >
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
              {results.summary.map(s => (
                <div
                  key={s.name}
                  className={`player-card ${s.net > 0 ? "winner" : s.net < 0 ? "loser" : "neutral"}`}
                >
                  <h3>{s.name}</h3>
                  <p>Invested: {s.invested}₪</p>
                  <p>Final: {s.final}₪</p>
                  <p>Net: {s.net >= 0 ? "+" : ""}{s.net}₪</p>
                </div>
              ))}
            </div>
            <h3>🏆 Total Pot: {results.summary.reduce((a,b)=>a+b.final,0)}₪</h3>
            <h3>Balance Check: {results.totalNet}₪</h3>
          </div>

          <div className="results-box">
            <h2>💸 Settlements</h2>
            <div className="card-container">
              {results.transfers.length > 0 ? (
                results.transfers.map((t,i) => (
                  <div key={i} className="settlement-card">
                    <p>{t.from} → {t.to}</p>
                    <p className="amount">{t.amount}₪</p>
                  </div>
                ))
              ) : (
                <p>No transfers needed</p>
              )}
            </div>

            {/* 📤 Share buttons */}
            <div className="share-buttons">
              <button
                className="copy-btn"
                onClick={() => {
                  const text = buildShareMessage();
                  navigator.clipboard.writeText(text);
                  alert("✅ Results copied to clipboard!");
                }}
              >
                📋 Copy
              </button>

              <button
                className="whatsapp-btn"
                onClick={() => {
                  const text = buildShareMessage();
                  const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
                  window.open(url, "_blank");
                }}
              >
                💬 WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
