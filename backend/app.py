from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import datetime
import zoneinfo
import re
import hashlib
from database import get_db, init_db

app = Flask(__name__)
CORS(app)

IST = zoneinfo.ZoneInfo("Asia/Kolkata")  # Indian Standard Time

init_db()  # DB tables create hoga on startup

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

# ──────────────────────────────────────────
#  USER ROUTES
# ──────────────────────────────────────────

@app.route("/register", methods=["POST"])
def register():
    data      = request.json
    hashed_pw = hashlib.sha256(data["password"].encode()).hexdigest()
    try:
        db = get_db()
        db.execute(
            "INSERT INTO users (name, email, password, provider) VALUES (?, ?, ?, ?)",
            (data["name"], data["email"], hashed_pw, data.get("provider", "email"))
        )
        db.commit()
        return jsonify({"success": True, "message": "User registered successfully"})
    except Exception as e:
        return jsonify({"success": False, "error": "Email already exists"}), 400

@app.route("/login", methods=["POST"])
def login():
    data      = request.json
    hashed_pw = hashlib.sha256(data["password"].encode()).hexdigest()
    db        = get_db()
    user      = db.execute(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        (data["email"], hashed_pw)
    ).fetchone()
    if user:
        return jsonify({"success": True, "user": dict(user)})
    return jsonify({"success": False, "error": "Invalid email or password"}), 401

@app.route("/save-upi", methods=["POST"])
def save_upi():
    data = request.json
    db   = get_db()
    db.execute(
        "UPDATE users SET upi_id = ?, bank_name = ? WHERE email = ?",
        (data["upi_id"], data["bank_name"], data["email"])
    )
    db.commit()
    return jsonify({"success": True, "message": "UPI ID saved"})

@app.route("/get-user/<email>", methods=["GET"])
def get_user(email):
    db   = get_db()
    user = db.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user:
        return jsonify({"success": True, "user": dict(user)})
    return jsonify({"success": False, "error": "User not found"}), 404

# ──────────────────────────────────────────
#  TRANSACTION ROUTES
# ──────────────────────────────────────────

@app.route("/save-transaction", methods=["POST"])
def save_transaction():
    data = request.json
    db   = get_db()
    db.execute('''
        INSERT INTO transactions
        (sender_upi, receiver_upi, amount, risk_level, fraud_probability, decision, time)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        data["sender"],
        data["receiver"],
        data["amount"],
        data["riskLevel"],
        data["fraudProbability"],
        data["decision"],
        datetime.datetime.now(IST).strftime("%d %b %Y, %I:%M %p")  # IST time
    ))
    db.commit()
    return jsonify({"success": True, "message": "Transaction saved"})

@app.route("/transactions/<sender_upi>", methods=["GET"])
def get_transactions(sender_upi):
    db  = get_db()
    txs = db.execute(
        "SELECT * FROM transactions WHERE sender_upi = ? ORDER BY id DESC",
        (sender_upi,)
    ).fetchall()
    return jsonify([dict(t) for t in txs])

@app.route("/resolve-transaction", methods=["POST"])
def resolve_transaction():
    data = request.json
    db   = get_db()
    db.execute(
        "UPDATE transactions SET resolved = ? WHERE id = ?",
        (1 if data["resolved"] else 0, data["id"])
    )
    db.commit()
    return jsonify({"success": True})

# ──────────────────────────────────────────
#  UPI ID STRUCTURE ANALYSER
# ──────────────────────────────────────────
SUSPICIOUS_KEYWORDS = [
    "lottery","prize","win","reward","lucky","free","gift","offer",
    "cash","money","earn","job","work","loan","fund","crypto",
    "airdrop","bonus","jackpot","helpline","support","refund","claim"
]
TRUSTED_BANKS = ["sbi","hdfc","icici","axisbank","kotak","pnb",
                 "bob","ubi","iob","canara"]
WALLET_BANKS  = ["paytm","ybl","okicici","oksbi","okhdfc","apl","upi","waicici","mahb"]

def analyze_upi_structure(upi: str) -> dict:
    upi    = upi.strip().lower()
    parts  = upi.split("@")
    if len(parts) != 2:
        return {"upi_risk_score": 50, "upi_signals": ["Invalid UPI format"]}

    username, bank = parts[0], parts[1]
    signals = []
    risk    = 0

    vowels      = sum(1 for c in username if c in "aeiou")
    vowel_ratio = vowels / max(len(username), 1)
    if vowel_ratio < 0.15 and not username.isdigit():
        risk += 20
        signals.append("Username appears randomly generated")

    if any(kw in username for kw in SUSPICIOUS_KEYWORDS):
        risk += 35
        signals.append("Suspicious keyword found in UPI ID")

    if re.match(r'^[6-9]\d{9}$', username):
        risk += 5
        signals.append("Mobile number based UPI")

    if bank in TRUSTED_BANKS:
        risk -= 5
    elif bank in WALLET_BANKS:
        risk += 5
        signals.append(f"Wallet-based UPI handle (@{bank})")
    else:
        risk += 10
        signals.append(f"Unknown bank handle (@{bank})")

    if len(username) < 3:
        risk += 15
        signals.append("Unusually short username")

    if len(username) > 15 and sum(c.isdigit() for c in username)/len(username) > 0.6:
        risk += 10
        signals.append("Long numeric username pattern")

    return {
        "upi_risk_score": max(0, min(100, risk)),
        "upi_signals":    signals
    }

# ──────────────────────────────────────────
#  DATASET LOOKUP
# ──────────────────────────────────────────
def get_receiver_info(receiver_upi: str) -> dict:
    row = df[df["receiver_upi_id"].str.lower() == receiver_upi.strip().lower()]
    if not row.empty:
        r = row.iloc[0]
        return {
            "found":                      True,
            "recipient_blacklist_status": int(r["recipient_blacklist_status"]),
            "past_fraud_flag":            int(r["past_fraud_flag"]),
            "receiver_trust_score":       int(r["receiver_trust_score"]),
            "fraud_reports":              int(r["fraud_reports"]),
            "account_age":                int(r["account_age"]),
            "fraud_label":                float(r["fraud_label"]),
        }
    return {
        "found":                      False,
        "recipient_blacklist_status": 0,
        "past_fraud_flag":            0,
        "receiver_trust_score":       3,
        "fraud_reports":              0,
        "account_age":                30,
        "fraud_label":                None,
    }

# ──────────────────────────────────────────
#  MAIN DETECTION ENDPOINT
# ──────────────────────────────────────────
@app.route("/detect_fraud", methods=["POST"])
def detect_fraud():
    data = request.json

    amount          = float(data.get("amount", 0))
    avg_transaction = float(data.get("avg_transaction", 900))
    receiver_upi    = str(data.get("receiver_upi", "")).strip()
    sender_tx_count = int(data.get("sender_tx_count", 1))
    device          = str(data.get("device", "known"))

    now             = datetime.datetime.now(IST)  # IST time
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

    proba     = model.predict_proba(X)[0]
    base_prob = proba[0]*0 + proba[1]*50 + proba[2]*100

    reports_boost = (reports / 100) * 30

    rule_boost = 0
    if receiver["recipient_blacklist_status"]: rule_boost += 12
    if receiver["past_fraud_flag"]:            rule_boost += 8
    if high_risk_time and amount_ratio > 2:    rule_boost += 5

    upi_signals = []
    if is_new_receiver:
        upi_analysis  = analyze_upi_structure(receiver_upi)
        upi_risk      = upi_analysis["upi_risk_score"]
        upi_signals   = upi_analysis["upi_signals"]
        rule_boost   += (upi_risk / 100) * 25
        if amount_ratio > 3:
            rule_boost += 8

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
    if reports >= 10:
        reasons.append(f"{reports} users have reported this UPI ID as fraud")
    if receiver["recipient_blacklist_status"]:
        reasons.append("Receiver UPI is blacklisted in our system")
    if receiver["past_fraud_flag"]:
        reasons.append("This receiver has a history of fraud transactions")
    if amount_ratio > 3:
        reasons.append(f"Amount Rs.{int(amount)} is {amount_ratio}x higher than your average")
    if high_risk_time:
        reasons.append(f"Transaction at {hour}:00 IST — late night is high risk")
    if is_new_receiver:
        reasons.append("Unknown receiver — not found in our database")
        reasons.extend(upi_signals)
    if sender_tx_count >= 5:
        reasons.append(f"Unusually high activity: {sender_tx_count} recent transactions")
    if device_mismatch:
        reasons.append("Transaction from an unrecognised device")
    if not reasons:
        reasons.append("No suspicious activity detected — transaction looks safe")

    return jsonify({
        "fraud_probability": fraud_prob,
        "risk_level":        risk_level,
        "decision":          decision,
        "reasons":           reasons,
        "receiver_found":    receiver["found"],
        "fraud_reports":     reports
    })

# ──────────────────────────────────────────
#  REPORT FRAUD
# ──────────────────────────────────────────
@app.route("/report_fraud", methods=["POST"])
def report_fraud():
    global df
    data         = request.json
    reported_upi = str(data.get("receiver_upi","")).strip().lower()
    mask         = df["receiver_upi_id"].str.lower() == reported_upi
    if mask.any():
        df.loc[mask, "fraud_reports"] += 1
        df.to_csv("upi_fraud_dataset.csv", index=False)
        return jsonify({"status":"updated",
                        "fraud_reports": int(df.loc[mask,"fraud_reports"].values[0])})
    return jsonify({"status":"noted","message":"Complaint recorded"})

# ──────────────────────────────────────────
#  STATS
# ──────────────────────────────────────────
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

# ──────────────────────────────────────────
#  ADMIN ROUTES
# ──────────────────────────────────────────
@app.route("/admin/users", methods=["GET"])
def admin_users():
    db    = get_db()
    users = db.execute("SELECT id, name, email, upi_id, bank_name, provider FROM users").fetchall()
    return jsonify([dict(u) for u in users])

@app.route("/admin/transactions", methods=["GET"])
def admin_transactions():
    db  = get_db()
    txs = db.execute("SELECT * FROM transactions ORDER BY id DESC").fetchall()
    return jsonify([dict(t) for t in txs])

# ──────────────────────────────────────────
#  NOTIFICATION ROUTES
# ──────────────────────────────────────────
@app.route("/save-notification", methods=["POST"])
def save_notification():
    data = request.json
    db   = get_db()
    db.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            email       TEXT,
            type        TEXT,
            title       TEXT,
            message     TEXT,
            sub_message TEXT,
            time        TEXT,
            read        INTEGER DEFAULT 0
        )
    ''')
    db.execute('''
        INSERT INTO notifications (email, type, title, message, sub_message, time, read)
        VALUES (?, ?, ?, ?, ?, ?, 0)
    ''', (
        data.get("email"), data.get("type"), data.get("title"),
        data.get("message"), data.get("subMessage", ""), data.get("time")
    ))
    db.commit()
    return jsonify({"success": True})

@app.route("/notifications/<email>", methods=["GET"])
def get_notifications(email):
    db     = get_db()
    notifs = db.execute(
        "SELECT * FROM notifications WHERE email = ? ORDER BY id DESC",
        (email,)
    ).fetchall()
    return jsonify([dict(n) for n in notifs])

if __name__ == "__main__":
    app.run(debug=True, port=5000)