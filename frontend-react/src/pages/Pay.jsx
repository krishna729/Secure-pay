import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsQR from "jsqr";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCameraRetro, faImages, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import { addNotification } from "../utils/notificationUtils";

const API = import.meta.env.VITE_API_URL;

function Pay() {
  const navigate = useNavigate();
  const [amount, setAmount]   = useState("");
  const [receiver, setReceiver] = useState("");
  const [sender, setSender]   = useState("");
  const [loading, setLoading] = useState(false);
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || !user.upiId) {
      alert("Please create your UPI ID first");
      navigate("/profile");
      return;
    }
    setSender(user.upiId);
    setBankName(user.bankName || "Your Bank");
  }, [navigate]);

  const isValidUPI = (upi) => /^[a-zA-Z0-9]+@[a-zA-Z]+$/.test(upi);

  const startCameraScan = () => {
    const scanner = new Html5QrcodeScanner("qr-reader", { fps: 10, qrbox: 250 }, false);
    scanner.render((decodedText) => {
      const match = decodedText.match(/pa=([^&]+)/);
      if (match && isValidUPI(match[1])) { setReceiver(match[1]); scanner.clear(); }
      else alert("Invalid UPI QR");
    });
  };

  const handleQRUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.src = reader.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width; canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);
        if (code) {
          const match = code.data.match(/pa=([^&]+)/);
          if (match && isValidUPI(match[1])) setReceiver(match[1]);
          else alert("Valid UPI not found in QR");
        } else alert("Invalid QR Image");
      };
    };
    reader.readAsDataURL(file);
  };

  const validateAmount = () => {
    const n = Number(amount);
    if (!Number.isInteger(n)) { alert("Decimal not allowed"); return false; }
    if (n < 1)                { alert("Limits start from ₹1"); return false; }
    if (n > 100000)           { alert("Bank transaction limit exceeded"); return false; }
    return true;
  };

  const detectFraud = async () => {
    if (!validateAmount()) return;
    if (!isValidUPI(receiver)) { alert("Invalid Receiver UPI ID"); return; }
    setLoading(true);
    try {
      // Step 1: Fraud Detection
      const response = await fetch(`${API}/detect_fraud`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount), avg_transaction: 900,
          receiver_upi: receiver, sender_tx_count: 3, device: "known"
        })
      });
      const result = await response.json();

      // Step 2: Save to DB
      await fetch(`${API}/save-transaction`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender, receiver, amount: parseInt(amount),
          riskLevel: result.risk_level,
          fraudProbability: result.fraud_probability,
          decision: result.decision
        })
      });

      // Step 3: Save to localStorage
      const transactions = JSON.parse(localStorage.getItem("transactions")) || [];
      transactions.unshift({
        id: Date.now(), sender, receiver,
        amount: parseInt(amount),
        riskLevel: result.risk_level,
        fraudProbability: result.fraud_probability,
        decision: result.decision,
        time: new Date().toLocaleString()
      });
      localStorage.setItem("transactions", JSON.stringify(transactions));

      // Step 4: Add payment notification
      const amtFormatted = parseInt(amount).toLocaleString("en-IN");
      if (result.risk_level === "LOW") {
        await addNotification({
          type:       "payment",
          title:      "Payment Successful 💸",
          message:    `₹${amtFormatted} debited and transferred to ${receiver}`,
          subMessage: `Debited from ${bankName}`,
        });
      } else if (result.risk_level === "MEDIUM") {
        await addNotification({
          type:       "payment",
          title:      "Payment Flagged ⚠️",
          message:    `₹${amtFormatted} to ${receiver} flagged as moderate risk`,
          subMessage: `Fraud probability: ${result.fraud_probability}%`,
        });
      } else {
        await addNotification({
          type:       "payment",
          title:      "Payment Blocked 🚫",
          message:    `₹${amtFormatted} to ${receiver} was blocked (HIGH risk)`,
          subMessage: `Fraud probability: ${result.fraud_probability}%`,
        });
      }

      // Step 5: Navigate
      if (result.risk_level === "LOW") {
        navigate("/payment-success", { state: { ...result, amount: parseInt(amount), receiver, sender } });
      } else {
        navigate("/result", { state: { ...result, amount: parseInt(amount), receiver, sender } });
      }
    } catch {
      alert("Backend not running. Start it with: python app.py");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pay-page">
      <div className="pay-container">
        <div className="pay-header">
          <div className="pay-header-icon">💳</div>
          <h2>Pay & Detect Fraud</h2>
          <p>AI-powered real-time fraud detection on every transaction</p>
        </div>
        <div className="pay-sender-info">
          <span className="pay-sender-label">Sending from</span>
          <span className="pay-sender-upi">{sender}</span>
        </div>
        <div className="pay-form">
          <div className="pay-field">
            <label>Amount (₹)</label>
            <div className="pay-input-wrap">
              <span className="pay-input-prefix">₹</span>
              <input type="number" placeholder="Enter amount (1 - 1,00,000)"
                value={amount} onChange={(e) => setAmount(e.target.value)} className="pay-input" />
            </div>
          </div>
          <div className="pay-field">
            <label>Receiver UPI ID</label>
            <input type="text" placeholder="example@oksbi" value={receiver}
              onChange={(e) => setReceiver(e.target.value)} className="pay-input-full" />
          </div>
          <div className="pay-qr-section">
            <p className="pay-qr-label">Or scan QR code</p>
            <div className="pay-qr-btns">
              <button className="btn-qr" onClick={startCameraScan}>
                <FontAwesomeIcon icon={faCameraRetro} /> Camera Scan
              </button>
              <label className="btn-qr">
                <FontAwesomeIcon icon={faImages} /> Upload QR
                <input type="file" accept="image/*" onChange={handleQRUpload} style={{ display: "none" }} />
              </label>
            </div>
            <div id="qr-reader" style={{ marginTop: "12px" }} />
          </div>
          <button className="btn-pay" onClick={detectFraud} disabled={loading}>
            {loading ? <span className="pay-spinner" /> : <><FontAwesomeIcon icon={faMagnifyingGlass} /> Pay & Detect Fraud</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Pay;