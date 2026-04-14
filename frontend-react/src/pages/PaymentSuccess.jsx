import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const res = location.state;

  useEffect(() => {
    const audio = new Audio("/sounds/audio.m4a");
    setTimeout(() => { audio.play().catch(() => {}); }, 300);
  }, []);

  if (!res) { navigate("/"); return null; }

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Animated checkmark */}
        <div className="success-circle-wrap">
          <div className="success-circle">
            <svg viewBox="0 0 52 52" className="success-checkmark">
              <circle cx="26" cy="26" r="25" fill="none" className="success-circle-bg" />
              <path fill="none" d="M14 27l7 7 17-17" className="success-check-path" />
            </svg>
          </div>
        </div>

        <h2 className="success-title">Payment Successful!</h2>
        <p className="success-subtitle">Your transaction was verified and processed safely.</p>

        {/* Stats */}
        <div className="success-stats">
          <div className="success-stat">
            <span className="success-stat-label">Fraud Probability</span>
            <span className="success-stat-value success-green">{res.fraud_probability}%</span>
          </div>
          <div className="success-stat">
            <span className="success-stat-label">Risk Level</span>
            <span className="success-badge-low">{res.risk_level}</span>
          </div>
          <div className="success-stat">
            <span className="success-stat-label">Decision</span>
            <span className="success-stat-value">{res.decision}</span>
          </div>
        </div>

        {res.reasons && res.reasons.length > 0 && (
          <div className="success-reasons">
            <h4>ℹ️ Notes</h4>
            <ul>{res.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>
        )}

        <button className="btn-home" onClick={() => navigate("/")}>
          Go to Home →
        </button>
      </div>
    </div>
  );
}

export default PaymentSuccess;