import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCreditCard,
  faTriangleExclamation,
  faPercent,
  faCheckCircle,
  faCircleCheck,
  faBan,
  faMagnifyingGlass,
  faCheck,
  faBell,
} from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";

function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [alerts, setAlerts]             = useState([]);
  const [currentUser, setCurrentUser]   = useState(null);

  // ── Load only current user's transactions ──
  const loadTransactions = () => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    setCurrentUser(user);
    const all  = JSON.parse(localStorage.getItem("transactions")) || [];

    // Filter: sirf is user ki transactions jinme sender === user ka UPI
    const mine = user?.upiId
      ? all.filter(t => t.sender === user.upiId)
      : [];

    setTransactions(mine);
  };

  useEffect(() => {
    loadTransactions();
    window.addEventListener("storage", loadTransactions);
    return () => window.removeEventListener("storage", loadTransactions);
  }, []);

  const resolveAlert = (id) => setAlerts(alerts.filter(a => a.id !== id));

  // ── Resolve a MEDIUM transaction ──
  const handleResolve = (txnId) => {
    const confirmed = window.confirm("Mark this payment as resolved?");
    if (!confirmed) return;

    // Update in full transactions list
    const all     = JSON.parse(localStorage.getItem("transactions")) || [];
    const updated = all.map(t => t.id === txnId ? { ...t, resolved: true } : t);
    localStorage.setItem("transactions", JSON.stringify(updated));

    // Refresh only current user's view
    const user = JSON.parse(localStorage.getItem("currentUser"));
    const mine = user?.upiId
      ? updated.filter(t => t.sender === user.upiId)
      : [];
    setTransactions(mine);
  };

  const total      = transactions.length;
  const fraudCount = transactions.filter(t => t.riskLevel === "HIGH").length;
  const safeCount  = total - fraudCount;
  const fraudRate  = total ? ((fraudCount / total) * 100).toFixed(1) : 0;

  const pieData = [{ name: "Fraud", value: fraudCount }, { name: "Safe", value: safeCount }];
  const COLORS  = ["#ef4444", "#10b981"];

  const stats = [
    { icon: faCreditCard,          label: "Total Transactions", value: total,           color: "#3b82f6" },
    { icon: faTriangleExclamation, label: "Fraud Detected",     value: fraudCount,      color: "#ef4444" },
    { icon: faCheckCircle,         label: "Safe Transactions",  value: safeCount,       color: "#10b981" },
    { icon: faPercent,             label: "Fraud Rate",         value: `${fraudRate}%`, color: "#f59e0b" },
  ];

  // ── Action cell renderer ──
  const renderAction = (t) => {
    if (t.riskLevel === "LOW") {
      return (
        <span className="dash-safe-tag">
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "rgb(21, 196, 133)" }} /> Safe
        </span>
      );
    }

    if (t.riskLevel === "HIGH") {
      return (
        <span className="dash-blocked-tag">
          <FontAwesomeIcon icon={faBan} style={{ color: "rgb(204, 12, 12)" }} /> Blocked
        </span>
      );
    }

    // MEDIUM
    if (t.resolved === true) {
      return (
        <span className="dash-resolved-tag">
          <FontAwesomeIcon icon={faCircleCheck} style={{ color: "rgb(21, 196, 133)" }} /> Resolved
        </span>
      );
    }

    return (
      <button className="resolve-btn" onClick={() => handleResolve(t.id)}>
        <FontAwesomeIcon icon={faCheck} style={{ color: "rgb(255, 255, 255)" }} /> Resolve
      </button>
    );
  };

  return (
    <div className="dash-page">
      <div className="dash-header">
        <h2>Fraud Detection Dashboard</h2>
        <p>Real-time overview of your transaction security</p>
      </div>

      {/* Stats */}
      <div className="dash-stats">
        {stats.map((s, i) => (
          <div key={i} className="dash-stat-card">
            <div className="dash-stat-icon" style={{ background: s.color + "22", color: s.color }}>
              <FontAwesomeIcon icon={s.icon} />
            </div>
            <div>
              <p className="dash-stat-label">{s.label}</p>
              <p className="dash-stat-value">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="dash-charts">
        <div className="dash-chart-card">
          <h3>Fraud vs Safe</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={90}
                   label={({ name, value }) => `${name}: ${value}`}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="dash-chart-card">
          <h3>Transaction Amounts</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={transactions.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="id" tick={false} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `₹${v}`} />
              <Bar dataKey="amount" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="dash-alerts">
          <h3>
            <FontAwesomeIcon icon={faBell} style={{ color: "rgb(204, 12, 12)" }} /> Active Fraud Alerts
          </h3>
          {alerts.map(a => (
            <div key={a.id} className="dash-alert-item">
              <span>HIGH RISK — ₹{a.amount} from {a.from} → {a.to}</span>
              <button className="btn-resolve" onClick={() => resolveAlert(a.id)}>
                <FontAwesomeIcon icon={faCheck} style={{ color: "rgb(255, 255, 255)" }} /> Resolve
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="dash-table-section">
        <h3>Transaction History</h3>
        {transactions.length === 0 ? (
          <div className="dash-empty">
            <p>
              <FontAwesomeIcon icon={faMagnifyingGlass} />{" "}
              {currentUser?.upiId
                ? "No transactions yet. Make your first payment!"
                : "Create your UPI ID first to start transacting!"}
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="txn-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>From (Sender)</th>
                  <th>To (Receiver)</th>
                  <th>Amount</th>
                  <th>Risk</th>
                  <th>Fraud %</th>
                  <th>Time</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t, i) => (
                  <tr key={t.id}
                    className={
                      t.riskLevel === "HIGH"   ? "row-high"   :
                      t.riskLevel === "MEDIUM" ? "row-medium" : "row-low"
                    }>
                    <td>{i + 1}</td>
                    <td>{t.sender}</td>
                    <td>{t.receiver}</td>
                    <td>₹{t.amount}</td>
                    <td>
                      <span className={`risk-pill ${
                        t.riskLevel === "HIGH"   ? "risk-high"   :
                        t.riskLevel === "MEDIUM" ? "risk-medium" : "risk-low"
                      }`}>{t.riskLevel}</span>
                    </td>
                    <td>{t.fraudProbability}%</td>
                    <td>{t.time}</td>
                    <td>{renderAction(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;