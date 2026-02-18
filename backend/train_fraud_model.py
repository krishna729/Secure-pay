import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

# =========================
# 1. Load Dataset
# =========================
df = pd.read_csv("final_upi_fraud_dataset_1000_realistic.csv")

# =========================
# 2. Features & Target
# =========================
X = df.drop("fraud_label", axis=1)
y = df["fraud_label"]

# =========================
# 3. Train-Test Split
# =========================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# =========================
# 4. Train Model
# =========================
model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42
)

model.fit(X_train, y_train)

# =========================
# 5. Evaluate
# =========================
y_pred = model.predict(X_test)

print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n")
print(classification_report(y_test, y_pred))

# =========================
# 6. Save Model
# =========================
joblib.dump(model, "final_fraud_model.pkl")

print("\nModel trained and saved successfully!")
