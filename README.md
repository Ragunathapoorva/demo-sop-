# IoT Security Platform — AI-Based Adversarial Attack Detection & Mitigation

**Live demo:** https://ragunathapoorva.github.io/demo-sop-/  
**Repo:** `https://github.com/ragunathapoorva/demo-sop-/

---

## Overview

This project is an interactive demo of an IoT Security Platform that visualizes network topology, simulates adversarial and network attacks (FGSM, PGD, DDoS, spoofing, packet injection, data poisoning), and demonstrates AI-based detection and mitigation workflows. The demo shows role-based access, live KPIs, a 3D topology view, attack simulation controls, model performance panels (CNN-LSTM hybrid, Random Forest, XGBoost), mitigation controls and attack logs. :contentReference[oaicite:11]{index=11}

---

## Features

- Role-based login (Administrator / Security Analyst / Researcher). :contentReference[oaicite:12]{index=12}  
- Realtime network overview: active devices, threats, blocked attacks, system health. :contentReference[oaicite:13]{index=13}  
- Interactive 3D network topology visualization (safe / suspicious / compromised). :contentReference[oaicite:14]{index=14}  
- Attack simulation engine: FGSM, PGD, DDoS, Identity Spoofing, Packet Injection, Data Poisoning. :contentReference[oaicite:15]{index=15}  
- AI/ML model panel with metrics and retraining control (CNN-LSTM, Random Forest, XGBoost). :contentReference[oaicite:16]{index=16}  
- Mitigation & response controls plus audit logs and export capability. :contentReference[oaicite:17]{index=17}

---

## Tech stack (suggested)

> The demo is hosted on GitHub Pages. The following stack is recommended if you want to expand it into a full system:

- **Frontend:** React / Vue / Vanilla JS, Three.js for 3D topology, Chart.js or similar for charts  
- **Backend (optional):** Node.js (Express) or Python (Flask/FastAPI) for ingestion & model serving  
- **Models:** TensorFlow or PyTorch for deep models (CNN-LSTM). scikit-learn / xgboost for tree models.  
- **Data transport:** MQTT or WebSockets for realtime telemetry.  
- **Storage:** PostgreSQL / InfluxDB for time-series, S3 for model artifacts.  

> If your demo is static (frontend-only), it can remain on GitHub Pages.

---

## Getting started (local)

### Quick (static demo)
If the project is static HTML/JS/CSS (GitHub Pages), you can serve it locally:

```bash
git clone https://github.com/ragunathapoorva/demo-sop-.git
cd demo-sop-
# Python 3
python -m http.server 8000
# then open http://localhost:8000 in your browser



