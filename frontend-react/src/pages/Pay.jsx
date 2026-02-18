import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import jsQR from "jsqr";

function Pay() {
  const navigate = useNavigate();

  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [sender, setSender] = useState("");

  /* ================= LOAD USER ================= */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser"));
    if (!user || !user.upiId) {
      alert("Please create your UPI ID first");
      navigate("/profile");
      return;
    }
    setSender(user.upiId);
  }, [navigate]);

  /* ================= UPI VALIDATION ================= */
  const isValidUPI = (upi) => /^[a-zA-Z0-9]+@[a-zA-Z]+$/.test(upi);

  /* ================= QR CAMERA ================= */
  const startCameraScan = () => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render((decodedText) => {
      const match = decodedText.match(/pa=([^&]+)/);
      if (match && isValidUPI(match[1])) {
        setReceiver(match[1]);
        scanner.clear();
      } else {
        alert("Invalid UPI QR");
      }
    });
  };

  /* ================= QR IMAGE UPLOAD ================= */
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
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imgData.data, imgData.width, imgData.height);

        if (code) {
          const match = code.data.match(/pa=([^&]+)/);
          if (match && isValidUPI(match[1])) {
            setReceiver(match[1]);
          } else {
            alert("Valid UPI not found in QR");
          }
        } else {
          alert("Invalid QR Image");
        }
      };
    };
    reader.readAsDataURL(file);
  };

  /* ================= AMOUNT VALIDATION ================= */
  const validateAmount = () => {
    const n = Number(amount);
    if (!Number.isInteger(n)) return alert("Decimal not allowed"), false;
    if (n < 1) return alert("Limits start from rupees 1"), false;
    if (n > 100000) return alert("Bank transaction limit exceeded"), false;
    return true;
  };

  /* ================= PAY & DETECT ================= */
  const detectFraud = async () => {
    if (!validateAmount()) return;
    if (!isValidUPI(receiver)) {
      alert("Invalid Receiver UPI ID");
      return;
    }

    try {
      const response = await fetch("http://127.0.0.1:5000/detect_fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseInt(amount),
          avg_transaction: 900,
          hour: new Date().getHours(),
          device: "known",
          sender_tx_count: 3,
          receiver_tx_count: 2
        })
      });

      const result = await response.json();

      /* ===== SAVE TRANSACTION ===== */
      const transactions =
        JSON.parse(localStorage.getItem("transactions")) || [];

      transactions.unshift({
        id: Date.now(),
        sender,
        receiver,
        amount: parseInt(amount),
        riskLevel: result.risk_level,
        fraudProbability: result.fraud_probability,
        decision: result.decision,
        time: new Date().toLocaleString()
      });

      localStorage.setItem("transactions", JSON.stringify(transactions));

      /* ===== NAVIGATE ===== */
      if (result.risk_level === "LOW") {
        navigate("/payment-success", { state: result });
      } else {
        navigate("/result", { state: result });
      }

    } catch (e) {
      alert("Backend not running");
    }
  };

  return (
    <div className="box">
      <h2>Pay & Detect Fraud</h2>

      <p><b>Sender:</b> {sender}</p>

      <input
        type="number"
        placeholder="Amount (₹1 - ₹100000)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />

      <input
        type="text"
        placeholder="Receiver UPI ID"
        value={receiver}
        onChange={(e) => setReceiver(e.target.value)}
      />

      <button onClick={startCameraScan}>Scan QR (Camera)</button>
      <div id="qr-reader" style={{ margin: "10px 0" }} />

      <input type="file" accept="image/*" onChange={handleQRUpload} />

      <button onClick={detectFraud}>Pay & Detect Fraud</button>
    </div>
  );
}

export default Pay;
