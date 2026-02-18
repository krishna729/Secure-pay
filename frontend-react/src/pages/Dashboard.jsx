import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCreditCard } from "@fortawesome/free-solid-svg-icons";
import {faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import {faPercent } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, CartesianGrid,
  ResponsiveContainer
} from "recharts";

function Dashboard() {

  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
  const loadTransactions = () => {
    const stored =
      JSON.parse(localStorage.getItem("transactions")) || [];
    setTransactions(stored);
  };

  // Initial load
  loadTransactions();

  // Auto update when Pay.jsx saves data
  window.addEventListener("storage", loadTransactions);

  return () => {
    window.removeEventListener("storage", loadTransactions);
  };
}, []);


  /* ================= REMOVE ALERT ================= */
  const resolveAlert = (id) => {
    const updated = alerts.filter(alert => alert.id !== id);
    setAlerts(updated);
  };

  /* ================= STATS ================= */
  const total = transactions.length;
  const fraudCount = transactions.filter(t => t.risk >= 70).length;
  const safeCount = total - fraudCount;

  const pieData = [
    { name: "Fraud", value: fraudCount },
    { name: "Safe", value: safeCount }
  ];

  const COLORS = ["#ff4d4d", "#4caf50"];

  return (
    <div className="dashboard-container">

      <h2>Fraud Detection Dashboard</h2>
      <br></br>

      {/* ================= STATS CARDS ================= */}
      <div className="stats-grid">
        <div className="card"><FontAwesomeIcon icon={faCreditCard} style={{color: "rgb(59, 86, 255)",fontSize:"28px"}} /> Total Transactions: {total}</div>
        <div className="card"><FontAwesomeIcon icon={faTriangleExclamation} style={{color: "rgb(237, 0, 0)",fontSize:"28px"}} /> Fraud Detected: {fraudCount}</div>
        <div className="card"><FontAwesomeIcon icon={faPercent} style={{color: "rgb(18,18,18)",fontSize:"28px"}} />
        
          Fraud Rate: {total ? ((fraudCount / total) * 100).toFixed(1) : 0}%
        </div>
      </div>

      {/* ================= CHARTS ================= */}
      <div className="charts-grid">

        {/* PIE CHART */}
        <div className="chart-box">
          <h3>Fraud vs Safe</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                outerRadius={80}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className="chart-box">
          <h3>Transaction Amounts</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={transactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="amount" fill="#3498db" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ================= ALERTS ================= */}
      <div className="alerts-section">
        <h3>Recent Fraud Alerts</h3>

        {alerts.length === 0 && <p>No active alerts.</p>}

        {alerts.map(alert => (
          <div key={alert.id} className="alert-box">
            <span>
              HIGH RISK - ₹{alert.amount} from {alert.from} → {alert.to}
            </span>
            <button
              className="resolve-btn"
              onClick={() => resolveAlert(alert.id)}
            >
              ✔
            </button>
          </div>
        ))}
      </div>

      {/* ================= TRANSACTIONS TABLE ================= */}
      <h3 style={{ marginTop: "30px" }}>Transaction History</h3>

{transactions.length === 0 ? (
  <p>No transactions yet</p>
) : (
  <div className="table-wrapper">
    <table className="txn-table">
      <thead>
        <tr>
          <th>#</th>
          <th>From (Sender UPI)</th>
          <th>To (Receiver UPI)</th>
          <th>Amount (₹)</th>
          <th>Risk Level</th>
          <th>Fraud %</th>
          <th>Time</th>
          <th>Action</th>
        </tr>
      </thead>

      <tbody>
        {transactions.map((t, index) => (
          <tr
            key={t.id}
            className={
              t.riskLevel === "HIGH"
                ? "row-high"
                : t.riskLevel === "MEDIUM"
                ? "row-medium"
                : "row-low"
            }
          >
            <td>{index + 1}</td>
            <td>{t.sender}</td>
            <td>{t.receiver}</td>
            <td>₹{t.amount}</td>
            <td>{t.riskLevel}</td>
            <td>{t.fraudProbability}%</td>
            <td>{t.time}</td>
            <td>
              {t.riskLevel === "HIGH" ? (
                <button
                  className="resolve-btn"
                  onClick={() => clearAlert(t.id)}
                >
                  ✔ Resolve
                </button>
              ) : (
                "-"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
    </div>
  );
}

export default Dashboard;
