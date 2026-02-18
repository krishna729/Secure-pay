import joblib
import numpy as np

# =========================
# Load Model
# =========================
model = joblib.load("final_fraud_model.pkl")

# =========================
# New Transaction (Example)
# =========================
new_tx = [
    5.2,   # amount_ratio
    3,     # transaction_frequency
    1,     # device_mismatch_flag
    1,     # geo_location_flag
    5,     # account_age
    0,     # recipient_blacklist_status
    0,     # past_fraud_flag
    1,     # high_risk_time_flag
    1,     # sender_trust_score
    0,     # receiver_trust_score
    2,     # merchant_category_encoded
    1      # transaction_type_encoded
]

# Convert to numpy array
import pandas as pd

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

X = pd.DataFrame([new_tx], columns=columns)


# =========================
# Prediction
# =========================
prediction = model.predict(X)[0]
prob = model.predict_proba(X)[0][1]

print("Prediction:", "Fraud" if prediction == 1 else "Not Fraud")
print("Fraud Probability:", round(prob * 100, 2), "%")
