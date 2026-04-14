from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import datetime
import zoneinfo
import re
import hashlib
import psycopg2.extras
from database import get_db, init_db

app = Flask(__name__)
CORS(app)

IST = zoneinfo.ZoneInfo("Asia/Kolkata")

init_db()

@app.route("/")
def home():
    return "SecurePay Fraud Detection API is running"

model = joblib.load("final_fraud_model.pkl")
df    = pd.read_csv("upi_fraud_dataset.csv")

FEATURES = [
    "amount_ratio","transaction_frequency","device_mismatch_flag",
    "geo_location_flag","account_age","recipient_blacklist_status",
    "past_fraud_flag","high_risk_time_flag","sender_trust_score",
    "receiver_trust_score","merchant_category_encoded",
    "transaction_type_encoded","fraud_reports"
]

def fetch_one(cursor):
    row = cursor.fetchone()
    if row is None:
        return None
    cols = [desc[0] for desc in cursor.description]
    return dict(zip(cols, row))

def fetch_all(cursor):
    cols = [desc[0] for desc in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]

@app.route("/register", methods=["POST"])
def register():
    data      = request.json
    hashed_pw = hashlib.sha256(data["password"].encode()).hexdigest()
    try:
        conn = get_db()
        c    = conn.cursor()
        c.execute(
            "INSERT INTO users (name, email, password, provider) VALUES (%s, %s, %s, %s)",
            (data["name"], data["email"], hashed_pw, data.get("provider", "email"))
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True, "message": "User registered successfully"})
    except Exception:
        return jsonify({"success": False, "error": "Email already exists"}), 400

@app.route("/login", methods=["POST"])
def login():
    data      = request.json
    hashed_pw = hashlib.sha256(data["password"].encode()).hexdigest()
    conn = get_db()
    c    = conn.cursor()
    c.execute(
        "SELECT * FROM users WHERE email = %s AND password = %s",
        (data["email"], hashed_pw)
    )
    user = fetch_one(c)
    conn.close()
    if user:
        return jsonify({"success": True, "user": user})
    return jsonify({"success": False, "error": "Invalid email or password"}), 401

@app.route("/save-upi", methods=["POST"])
def save_upi():
    data = request.json
    conn = get_db()
    c    = conn.cursor()
    c.execute(
        "UPDATE users SET upi_id = %s, bank_name = %s WHERE email = %s",
        (data["upi_id"], data["bank_name"], data["email"])
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "UPI ID saved"})

@app.route("/get-user/<email>", methods=["GET"])
def get_user(email):
    conn = get_db()
    c    = conn.cursor()
    c.execute("SELECT * FROM users WHERE email = %s", (email,))
    user = fetch_one(c)
    conn.close()
    if user:
        return jsonify({"success": True, "user": user})
    return jsonify({"success": False, "error": "User not found"}), 404

@app.route("/save-transaction", methods=["POST"])
def save_transaction():
    data = request.json
    conn = get_db()
    c    = conn.cursor()
    c.execute('''
        INSERT INTO transactions
        (sender_upi, receiver_upi, amount, risk_level, fraud_probability, decision, time)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    ''', (
        data["sender"], data["receiver"], data["amount"],
        data["riskLevel"], data["fraudProbability"], data["decision"],
        datetime.datetime.now(IST).strftime("%d %b %Y, %I:%M %p")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Transaction saved"})

@app.route("/transactions/<sender_upi>", methods=["GET"])
def get_transactions(sender_upi):
    conn = get_db()
    c    = conn.cursor()
    c.execute("SELECT * FROM transactions WHERE sender_upi = %s ORDER BY id DESC", (sender_upi,))
    txs = fetch_all(c)
    conn.close()
    return jsonify(txs)

@app.route("/resolve-transaction", methods=["POST"])
def resolve_transaction():
    data = request.json
    conn = get_db()
    c    = conn.cursor()
    c.execute("UPDATE transactions SET resolved = %s WHERE id = %s",
              (1 if data["resolved"] else 0, data["id"]))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

SUSPICIOUS_KEYWORDS = [
    "lottery","prize","win","reward","lucky","free","gift","offer",
    "cash","money","earn","job","work","loan","fund","crypto",
    "airdrop","bonus","jackpot","helpline","support","refund","claim"
]
TRUSTED_BANKS = ["sbi","hdfc","icici","axisbank","kotak","pnb","bob","ubi","iob","canara"]
WALLET_BANKS  = ["paytm","ybl","okicici","oksbi","okhdfc","apl","upi","waicici","mahb"]

def analyze_upi_structure(upi: str) -> dict:
    upi   = upi.strip().lower()
    parts = upi.split("@")
    if len(parts) != 2:
        return {"upi_risk_score": 50, "upi_signals": ["Invalid UPI format"]}
    username, bank = parts[0], parts[1]
    signals = []
    risk    = 0
    vowels      = sum(1 for c in username if c in "aeiou")
    vowel_ratio = vowels / max(len(username), 1)
    if vowel_ratio < 0.15 and not username.isdigit():
        risk += 20; signals.append("Username appears randomly generated")
    if any(kw in username for kw in SUSPICIOUS_KEYWORDS):
        risk += 35; signals.append("Suspicious keyword found in UPI ID")
    if re.match(r'^[6-9]\d{9}$', username):
        risk += 5; signals.append("Mobile number based UPI")
    if bank in TRUSTED_BANKS:
        risk -= 5
    elif bank in WALLET_BANKS:
        risk += 5; signals.append(f"Wallet-based UPI handle (@{bank})")
    else:
        risk += 10; signals.append(f"Unknown bank handle (@{bank})")
    if len(username) < 3:
        risk += 15; signals.append("Unusually short username")
    if len(username) > 15 and sum(c.isdigit() for c in username)/len(username) > 0.6:
        risk += 10; signals.append("Long numeric username pattern")
    return {"upi_risk_score": max(0, min(100, risk)), "upi_signals": signals}

def get_receiver_info(receiver_upi: str) -> dict:
    row = df[df["receiver_upi_id"].str.lower() == receiver_upi.strip().lower()]
    if not row.empty:
        r = row.iloc[0]
        return {
            "found": True,
            "recipient_blacklist_status": int(r["recipient_blacklist_status"]),
            "past_fraud_flag":            int(r["past_fraud_flag"]),
            "receiver_trust_score":       int(r["receiver_trust_score"]),
            "fraud_reports":              int(r["fraud_reports"]),
            "account_age":                int(r["account_age"]),
            "fraud_label":                float(r["fraud_label"]),
        }
    return {
        "found": False,
        "recipient_blacklist_status": 0,
        "past_fraud_flag":            0,
        "receiver_trust_score":       3,
        "fraud_reports":              0,
        "account_age":                30,
        "fraud_label":                None,
    }

@app.route("/detect_fraud", methods=["POST"])
def detect_fraud():
    data            = request.json
    amount          = float(data.get("amount", 0))
    avg_transaction = float(data.get("avg_transaction", 900))
    receiver_upi    = str(data.get("receiver_upi", "")).strip()
    sender_tx_count = int(data.get("sender_tx_count", 1))
    device          = str(data.get("device", "known"))
    now             = datetime.datetime.now(IST)
    hour            = now.hour
    amount_ratio    = round(amount / avg_transaction, 2) if avg_transaction > 0 else 1.0
    high_risk_time  = 1 if (hour >= 23 or hour <= 5) else 0
    device_mismatch = 1 if device == "new" else 0
    receiver        = get_receiver_info(receiver_upi)
    is_new_receiver = not receiver["found"]
    reports         = receiver["fraud_reports"]
    X = pd.DataFrame([[
        amount_ratio, sender_tx_count, device_mismatch, 0,
        receiver["account_age"], receiver["recipient_blacklist_status"],
        receiver["past_fraud_flag"], high_risk_time,
        4, receiver["receiver_trust_score"], 1, 0, reports
    ]], columns=FEATURES)
    proba         = model.predict_proba(X)[0]
    base_prob     = proba[0]*0 + proba[1]*50 + proba[2]*100
    reports_boost = (reports / 100) * 30
    rule_boost    = 0
    if receiver["recipient_blacklist_status"]: rule_boost += 12
    if receiver["past_fraud_flag"]:            rule_boost += 8
    if high_risk_time and amount_ratio > 2:    rule_boost += 5
    upi_signals = []
    if is_new_receiver:
        upi_analysis = analyze_upi_structure(receiver_upi)
        upi_risk     = upi_analysis["upi_risk_score"]
        upi_signals  = upi_analysis["upi_signals"]
        rule_boost  += (upi_risk / 100) * 25
        if amount_ratio > 3: rule_boost += 8
    fraud_prob = round(min(100.0, base_prob + reports_boost + rule_boost), 2)
    if receiver["fraud_label"] == 0:
        fraud_prob = min(fraud_prob, 40.0)
    elif receiver["fraud_label"] == 0.5:
        fraud_prob = max(31.0, min(65.0, fraud_prob))
    elif receiver["fraud_label"] == 1:
        fraud_prob = max(66.0, fraud_prob)
    if fraud_prob <= 30:
        risk_level = "LOW";    decision = "PAYMENT ALLOWED"
    elif fraud_prob <= 65:
        risk_level = "MEDIUM"; decision = "PAYMENT BLOCKED — MODERATE RISK"
    else:
        risk_level = "HIGH";   decision = "PAYMENT BLOCKED — HIGH RISK"
    reasons = []
    if reports >= 10:             reasons.append(f"{reports} users have reported this UPI ID as fraud")
    if receiver["recipient_blacklist_status"]: reasons.append("Receiver UPI is blacklisted in our system")
    if receiver["past_fraud_flag"]:            reasons.append("This receiver has a history of fraud transactions")
    if amount_ratio > 3:          reasons.append(f"Amount Rs.{int(amount)} is {amount_ratio}x higher than your average")
    if high_risk_time:            reasons.append(f"Transaction at {hour}:00 IST — late night is high risk")
    if is_new_receiver:           reasons.append("Unknown receiver — not found in our database"); reasons.extend(upi_signals)
    if sender_tx_count >= 5:      reasons.append(f"Unusually high activity: {sender_tx_count} recent transactions")
    if device_mismatch:           reasons.append("Transaction from an unrecognised device")
    if not reasons:               reasons.append("No suspicious activity detected — transaction looks safe")
    return jsonify({
        "fraud_probability": fraud_prob, "risk_level": risk_level,
        "decision": decision, "reasons": reasons,
        "receiver_found": receiver["found"], "fraud_reports": reports
    })

@app.route("/report_fraud", methods=["POST"])
def report_fraud():
    global df
    data         = request.json
    reported_upi = str(data.get("receiver_upi","")).strip().lower()
    mask         = df["receiver_upi_id"].str.lower() == reported_upi
    if mask.any():
        df.loc[mask, "fraud_reports"] += 1
        df.to_csv("upi_fraud_dataset.csv", index=False)
        return jsonify({"status":"updated","fraud_reports": int(df.loc[mask,"fraud_reports"].values[0])})
    return jsonify({"status":"noted","message":"Complaint recorded"})

@app.route("/stats", methods=["GET"])
def stats():
    total = len(df)
    return jsonify({
        "total_records":  total,
        "genuine_count":  int((df["fraud_label"]==0).sum()),
        "moderate_count": int((df["fraud_label"]==0.5).sum()),
        "fraud_count":    int((df["fraud_label"]==1).sum()),
        "top_reported":   df.nlargest(5,"fraud_reports")[["receiver_upi_id","fraud_reports"]].to_dict("records")
    })

@app.route("/admin/users", methods=["GET"])
def admin_users():
    conn = get_db()
    c    = conn.cursor()
    c.execute("SELECT id, name, email, upi_id, bank_name, provider FROM users")
    users = fetch_all(c)
    conn.close()
    return jsonify(users)

@app.route("/admin/transactions", methods=["GET"])
def admin_transactions():
    conn = get_db()
    c    = conn.cursor()
    c.execute("SELECT * FROM transactions ORDER BY id DESC")
    txs = fetch_all(c)
    conn.close()
    return jsonify(txs)

@app.route("/save-notification", methods=["POST"])
def save_notification():
    data = request.json
    conn = get_db()
    c    = conn.cursor()
    c.execute('''
        INSERT INTO notifications (email, type, title, message, sub_message, time, read)
        VALUES (%s, %s, %s, %s, %s, %s, 0)
    ''', (
        data.get("email"), data.get("type"), data.get("title"),
        data.get("message"), data.get("subMessage", ""), data.get("time")
    ))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/notifications/<email>", methods=["GET"])
def get_notifications(email):
    conn = get_db()
    c    = conn.cursor()
    c.execute("SELECT * FROM notifications WHERE email = %s ORDER BY id DESC", (email,))
    notifs = fetch_all(c)
    conn.close()
    return jsonify(notifs)

if __name__ == "__main__":
    app.run(debug=True, port=5000)