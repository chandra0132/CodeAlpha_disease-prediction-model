# HealthAI — Disease Prediction Website

A neon-themed Flask web application for the **Disease Prediction from Medical Data** project (CodeAlpha ML Task-4).

## Features
- Real-time patient disease risk prediction (pure Python logistic regression — no external APIs)
- Interactive model benchmarking table (LR, SVM, DT, RF, XGBoost)
- Feature importance & accuracy charts (pure canvas — no Chart.js dependency)
- Animated ECG monitor, neon particle effects, scroll-reveal animations
- Full ML workflow diagram (8-step pipeline)
- Project deliverables documentation section

## Setup & Run

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Start the server
python app.py

# 3. Open in browser
http://localhost:5000
```

## Project Structure
```
disease_prediction_website/
├── app.py                  # Flask backend + pure-Python ML inference
├── requirements.txt
├── templates/
│   └── index.html          # Single-page HTML
└── static/
    ├── css/
    │   └── style.css       # Neon dark theme
    └── js/
        └── main.js         # Charts, prediction UI, animations
```

## Tech Stack
- **Backend**: Flask (Python)
- **ML Inference**: Pure Python logistic regression (no scikit-learn required for the website)
- **Frontend**: Vanilla HTML/CSS/JS — zero npm, zero external JS libraries
- **Charts**: HTML5 Canvas (hand-drawn, no Chart.js)
- **Fonts**: Google Fonts (Orbitron, Rajdhani, Share Tech Mono)
