import sys
import json

data = json.loads(sys.stdin.read())

age = data.get("age", 30)
chronic = data.get("chronicConditions", [])
lifestyle = data.get("lifestyle", {})
labs = data.get("recentLabResults", [])

score = 100
risk_factors = []

# Age risk
if age > 60:
    score -= 20
    risk_factors.append("Advanced age")
elif age > 45:
    score -= 10

# Chronic diseases
for condition in chronic:
    score -= 8
    risk_factors.append(condition)

# Lifestyle risks
if lifestyle.get("smoking"):
    score -= 15
    risk_factors.append("Smoking")

if lifestyle.get("alcohol"):
    score -= 10
    risk_factors.append("Alcohol consumption")

if lifestyle.get("exercise") == "Low":
    score -= 8
    risk_factors.append("Low physical activity")

# Lab risks
for lab in labs:
    if lab.get("status") == "Critical":
        score -= 12
        risk_factors.append(f"Critical {lab.get('parameter')}")

score = max(0, min(100, score))

# Prediction
if score >= 80:
    prediction = "Low risk"
elif score >= 50:
    prediction = "Moderate risk"
else:
    prediction = "High risk"

output = {
    "score": score,
    "riskFactors": list(set(risk_factors)),
    "predictions": prediction
}

print(json.dumps(output))
