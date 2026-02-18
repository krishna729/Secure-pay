import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function PaymentSuccess() {

  const location = useLocation();
  const navigate = useNavigate();
  const res = location.state;

  /* ================= PLAY SOUND ================= */
  useEffect(() => {
    const audio = new Audio("/sounds/audio.m4a");
    setTimeout(() => {
      audio.play().catch(() => {});
    }, 300);
  }, []);

  if (!res) {
    navigate("/");
    return null;
  }

  return (
    <div className="success-container">

      <div className="success-card">

        <div className="success-icon-wrapper">
          <div className="success-circle">
            ✓
          </div>
        </div>


        <h2>Payment Successful</h2>

        <div className="result-details">

          <div className="detail-row">
            <span>Fraud Probability</span>
            <span>{res.fraud_probability}%</span>
          </div>

          <div className="detail-row">
            <span>Risk Level</span>
            <span className="risk-badge low">
              {res.risk_level}
            </span>
          </div>

          <div className="detail-row">
            <span>Decision</span>
            <span>{res.decision}</span>
          </div>

        </div>

        {res.reasons && res.reasons.length > 0 && (
          <div className="reason-box">
            <h4>Reasons:</h4>
            <ul>
              {res.reasons.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={() => navigate("/")}>
          Go to Home
        </button>

      </div>

    </div>
  );
}

export default PaymentSuccess;



