import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# 1. Load Dataset
df = pd.read_csv("upi_fraud_dataset.csv")
df = df.drop(columns=["receiver_upi_id"])   # UPI ID only for lookup, not training

# 2. Encode 3-class label
# fraud_label in CSV : 0=Genuine | 0.5=Moderate | 1=Fraud
# Encoded internally : 0=Genuine | 1=Moderate   | 2=Fraud
df["fraud_label_enc"] = df["fraud_label"].map({0: 0, 0.5: 1, 1: 2})

FEATURES = [
    "amount_ratio","transaction_frequency","device_mismatch_flag",
    "geo_location_flag","account_age","recipient_blacklist_status",
    "past_fraud_flag","high_risk_time_flag","sender_trust_score",
    "receiver_trust_score","merchant_category_encoded",
    "transaction_type_encoded","fraud_reports"
]

X = df[FEATURES]
y = df["fraud_label_enc"]

print(f"Dataset shape : {df.shape}")
print(f"Genuine  (0)  : {(y==0).sum()}")
print(f"Moderate (0.5): {(y==1).sum()}")
print(f"Fraud    (1)  : {(y==2).sum()}\n")

# 3. Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y)

# 4. Train Model
model = RandomForestClassifier(
    n_estimators=200, max_depth=10, random_state=42, class_weight="balanced")
model.fit(X_train, y_train)

# 5. Evaluate
y_pred = model.predict(X_test)
print(f"Accuracy : {round(accuracy_score(y_test, y_pred)*100, 2)}%\n")
print(classification_report(y_test, y_pred,
      target_names=["Genuine(0)","Moderate(0.5)","Fraud(1)"]))

imp = pd.Series(model.feature_importances_, index=FEATURES).sort_values(ascending=False)
print("Top Features:\n", imp.head(6).to_string())

# 6. Save
joblib.dump(model, "final_fraud_model.pkl")
print("\n Saved as final_fraud_model.pkl  |  Classes: 0=Genuine | 1=Moderate | 2=Fraud")