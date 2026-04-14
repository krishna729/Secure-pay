import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faBan, faLock } from "@fortawesome/free-solid-svg-icons";

function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const res      = location.state;

  useEffect(() => { if (!res) navigate("/pay"); }, [res, navigate]);
  if (!res) return null;

  const { fraud_probability, risk_level, reasons, amount, receiver, sender } = res;

  if (risk_level === "LOW") {
    navigate("/payment-success", { state: res });
    return null;
  }

  const isHigh = risk_level === "HIGH";

  // ── Mark transaction resolved in localStorage ──
  const markResolved = (resolvedStatus) => {
    const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    const idx = transactions.findIndex(
      t => t.receiver === receiver && t.amount === amount && t.resolved === undefined
    );
    if (idx !== -1) {
      transactions[idx].resolved = resolvedStatus;
      localStorage.setItem("transactions", JSON.stringify(transactions));
    }
  };

  const handleStillPay = () => {
    const confirmed = window.confirm("⚠️ Want to pay? This transaction has been flagged as suspicious.");
    if (!confirmed) return;
    markResolved(true);
    navigate("/payment-success", { state: res });
  };

  const handleCancel = () => {
    markResolved(false);
    navigate("/pay");
  };

  return (
    <div className="result-page">
      <div className={`result-container ${isHigh ? "result-high" : "result-medium"}`}>

        <div className={`result-icon-wrap ${isHigh ? "result-icon-high" : "result-icon-medium"}`}>
          <span className="result-icon">
            {isHigh
              ? <FontAwesomeIcon icon={faBan}                style={{ color: "rgb(179, 31, 31)"  }} />
              : <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "rgb(236, 195, 45)" }} />
            }
          </span>
        </div>

        <h2 className="result-title">
          {isHigh ? "Payment Blocked Due to High Risk" : "Payment Blocked Due to Moderate Risk"}
        </h2>

        <div className={`result-prob-box ${isHigh ? "prob-high" : "prob-medium"}`}>
          <p className="result-prob-label">Fraud Risk</p>
          <p className={`result-prob-value ${isHigh ? "text-red" : "text-orange"}`}>
            {fraud_probability}%
          </p>
        </div>

        {(amount || receiver) && (
          <div className="result-txn-info">
            {amount   && <span>₹{amount.toLocaleString("en-IN")}</span>}
            {amount   && receiver && <span className="txn-arrow">→</span>}
            {receiver && <span className="txn-receiver">{receiver}</span>}
          </div>
        )}

        {reasons && reasons.length > 0 && (
          <div className="result-reasons">
            <h4>Why was this flagged?</h4>
            <ul>
              {reasons.map((r, i) => (
                <li key={i}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ color: "rgb(236, 195, 45)" }} /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="result-actions">
          {!isHigh && (
            <button className="btn-still-pay" onClick={handleStillPay}>
              Still want to pay?
            </button>
          )}
          <button className="btn-go-home" onClick={handleCancel}>
            {isHigh ? "Go Back" : "Cancel"}
          </button>
        </div>

        {isHigh && (
          <p className="result-hard-block-note">
            <FontAwesomeIcon icon={faLock} style={{ color: "rgb(255, 212, 59)" }} /> This payment cannot be processed due to high fraud risk.
            If you believe this is an error, please contact support.
          </p>
        )}
      </div>
    </div>
  );
}

export default Result;