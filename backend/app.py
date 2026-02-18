# ===============================
# Imports
# ===============================
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd

# ===============================
# App Initialization
# ===============================
app = Flask(__name__)
CORS(app)

# ===============================
# Root Route (Test Backend)
# ===============================
@app.route("/")
def home():
    return "Fraud Detection API is running"

# ===============================
# Load Trained Model
# ===============================
model = joblib.load("final_fraud_model.pkl")

# ===============================
# Fraud Detection API
# ===============================
@app.route("/detect_fraud", methods=["POST"])
def detect_fraud():

    data = request.json

    # ===== Basic Inputs =====
    amount = float(data.get("amount", 0))
    avg_transaction = float(data.get("avg_transaction", 1))
    hour = int(data.get("hour", 12))
    device = data.get("device", "known")

    sender_tx_count = int(data.get("sender_tx_count", 1))
    receiver_tx_count = int(data.get("receiver_tx_count", 1))

    # ===== Derived Features =====
    amount_ratio = amount / avg_transaction
    high_risk_time_flag = 1 if hour <= 4 else 0
    device_mismatch_flag = 1 if device == "new" else 0

    # Demo placeholder logic
    transaction_frequency = 1
    geo_location_flag = 0
    account_age = 30
    recipient_blacklist_status = 0
    past_fraud_flag = 0
    merchant_category_encoded = 1
    transaction_type_encoded = 1

    # ===== Feature Order MUST Match Training =====
    columns = [
        "amount_ratio",
        "transaction_frequency",
        "device_mismatch_flag",
        "geo_location_flag",
        "account_age",
        "recipient_blacklist_status",
        "past_fraud_flag",
        "high_risk_time_flag",
        "sender_trust_score",
        "receiver_trust_score",
        "merchant_category_encoded",
        "transaction_type_encoded"
    ]

    X = pd.DataFrame([[
        amount_ratio,
        transaction_frequency,
        device_mismatch_flag,
        geo_location_flag,
        account_age,
        recipient_blacklist_status,
        past_fraud_flag,
        high_risk_time_flag,
        sender_tx_count,
        receiver_tx_count,
        merchant_category_encoded,
        transaction_type_encoded
    ]], columns=columns)

    # ===== Prediction =====
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0][1]
    fraud_percent = round(probability * 100, 2)

    # ===== Risk Levels =====
    if fraud_percent <= 30:
        risk = "LOW"
        decision = "PAYMENT ALLOWED"
    elif fraud_percent <= 70:
        risk = "MEDIUM"
        decision = "CONFIRM PAYMENT"
    else:
        risk = "HIGH"
        decision = "PAYMENT BLOCKED"

    # ===== Reason Logic =====
    reasons = []

    if amount_ratio > 6:
        reasons.append("Transaction amount significantly higher than usual")

    if device_mismatch_flag == 1:
        reasons.append("New device detected")

    if high_risk_time_flag == 1:
        reasons.append("Transaction during high-risk hours")

    if receiver_tx_count < 2:
        reasons.append("Low receiver trust score")

    return jsonify({
        "fraud_probability": fraud_percent,
        "risk_level": risk,
        "decision": decision,
        "reasons": reasons
    })


# ===============================
# Run Server
# ===============================
if __name__ == "__main__":
    app.run(debug=True)
