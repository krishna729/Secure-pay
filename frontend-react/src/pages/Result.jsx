import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function Result() {

  const location = useLocation();
  const navigate = useNavigate();
  const res = location.state;

  useEffect(() => {
    if (!res) navigate("/");
  }, [res, navigate]);

  if (!res) return null;

  const { fraud_probability, risk_level, decision, reasons } = res;

  if (risk_level === "LOW") {
    return navigate("/payment-success", { state: res });
  }

  if (risk_level === "HIGH") {
    return (
      <div className="result-box high">
        <h2>Payment Blocked</h2>
        <pre>
Fraud Probability: {fraud_probability}%
Risk Level: {risk_level}
Decision: {decision}

Reasons:
{reasons.join("\n")}
        </pre>
        <button onClick={() => navigate("/")}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div className="result-box medium">
      <h2>Medium Risk Detected</h2>
      <pre>
Fraud Probability: {fraud_probability}%
Risk Level: {risk_level}
Decision: {decision}

Reasons:
{reasons.join("\n")}
      </pre>
      <button onClick={() => navigate("/payment-success", { state: res })}>
        Still Pay
      </button>
      <button onClick={() => navigate("/")}>
        Cancel
      </button>
    </div>
  );
}

export default Result;
