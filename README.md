# 🌊 AquaGuard AI — Water Quality Prediction & Unsafe Water Detection

![Python Version](https://img.shields.io/badge/python-3.10%2B-blue.svg)
![Framework](https://img.shields.io/badge/framework-Flask%203.0-0077b6.svg)
![ML Library](https://img.shields.io/badge/ML-Scikit--Learn-orange.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/build-passing-brightgreen.svg)

**AquaGuard AI** is a complete, production-ready AI-powered web application that predicts whether water is **Safe for Drinking** or **Unsafe for Drinking** using an ensemble **Random Forest Machine Learning Model** trained on the **Kaggle Water Potability Dataset**.

The application features an oceanic glassmorphism UI with real-time parameter validation, prediction confidence scoring, parameter compliance breakdown against WHO/EPA standards, interactive analytics charts (pH distribution, correlation heatmap, feature importances), prediction audit history, CSV export capabilities, and dark mode support.

---

## 📸 Screenshots & UI Preview

### 1. Water Quality Predictor & Presets
> Real-time water sample analysis with quick preset loaders (*Clean Tap Water*, *Mineral Spring Water*, *Contaminated Pond Water*, *Acidic Drainage Water*) and color-coded safety verdicts (**GREEN** for Safe / **RED** for Unsafe).

### 2. Machine Learning Analytics Dashboard
> Interactive Chart.js graphs displaying Model Accuracy, Precision, Recall, F1-Score, Safe vs. Unsafe Distribution, pH Level Histogram, Ranked Feature Importances, and Inter-Feature Correlation Heatmap.

---

## 🌟 Key Features

- 🧠 **Random Forest Machine Learning Engine**: Ensemble classifier trained on 3,276 water samples across 9 physical and chemical indicators.
- 🧪 **9 Water Quality Parameters**:
  1. **pH Level**: Acidity/alkalinity balance (WHO safe range: 6.5 – 8.5)
  2. **Hardness**: Soap precipitation capacity in mg/L (Recommended: 60 – 250 mg/L)
  3. **Solids / TDS**: Total Dissolved Solids in ppm (Recommended: < 25,000 ppm)
  4. **Chloramines**: Disinfectant residual in ppm (Safe level: 4.0 – 8.0 ppm)
  5. **Sulfate**: Dissolved inorganic sulfate in mg/L (Standard: 150 – 350 mg/L)
  6. **Conductivity**: Electrical conductivity in μS/cm (Standard limit: < 500 μS/cm)
  7. **Organic Carbon**: Total organic carbon level in ppm (Threshold: < 16 ppm)
  8. **Trihalomethanes**: Chlorination by-products in μg/L (Upper limit: < 80 μg/L)
  9. **Turbidity**: Water clarity in NTU (Optimal clarity: < 4.5 NTU)
- ⚡ **Instant Presets & Validation**: 4 sample presets for immediate testing with strict min/max range validation.
- 📊 **Interactive Analytics Dashboard**: Live Chart.js graphs for class distribution, pH histogram, feature weights, and correlation matrix.
- 📜 **Audit History & CSV Export**: Local storage audit table with instant search, row deletion, and 1-click CSV export.
- 🌙 **Dark Mode Toggle**: Fluid theme switcher with persistent user preference.

---

## 📁 Project Structure

```
water_quality_app/
├── backend/
│   ├── app.py                      # Flask REST API & static file server
│   ├── train_model.py              # Data preprocessing, Random Forest training & metrics generator
│   └── requirements.txt            # Python dependencies
├── datasets/
│   ├── generate_dataset.py         # Dataset generator matching Kaggle Water Potability distributions
│   └── water_potability.csv        # 3,276 sample water potability dataset
├── models/
│   ├── water_potability_rf_model.joblib # Saved Random Forest model binary
│   ├── scaler_imputer.joblib      # Imputer & Scaler pipeline artifact
│   └── model_metrics.json          # Precomputed metrics, feature importances & distribution stats
├── frontend/
│   ├── index.html                  # Main Single Page Application (SPA) layout
│   ├── css/
│   │   └── style.css               # Oceanic glassmorphism styling & dark mode rules
│   └── js/
│       ├── app.js                  # SPA routing, form validation, prediction API & CSV export
│       └── dashboard.js            # Chart.js visualization manager
├── tests/
│   └── test_api.py                 # Automated Flask API and model integration tests
├── .gitignore                      # Git ignore rules for bytecode, environments & logs
├── LICENSE                         # MIT License
├── README.md                       # Comprehensive repository documentation
└── requirements.txt                # Main requirements file
```

---

## 🚀 Quickstart & Setup Guide

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/water-quality-prediction.git
cd water-quality-prediction
```

### 2. Set Up Virtual Environment (Recommended)
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Train the Machine Learning Model
Run the model training pipeline to generate the dataset and save model artifacts:
```bash
python backend/train_model.py
```

*Expected Output:*
```
Loaded dataset with shape (3276, 10)
Training Random Forest Classifier...
Model Training Completed!
Accuracy:  67.23%
Precision: 61.31%
Recall:    46.92%
F1-Score:  53.16%
Artifacts successfully saved to .../models
```

### 5. Launch the Web Application
Start the Flask web server:
```bash
python backend/app.py
```

Open your browser and navigate to:
👉 **`http://127.0.0.1:5000`**

---

## 🧪 Running Tests
To run the automated API and integration test suite:
```bash
python tests/test_api.py
```

---

## 🛠️ GitHub Push Instructions

To upload this repository to your GitHub account, run the following commands:

```bash
# 1. Initialize Git Repository
git init

# 2. Add all files to staging
git add .

# 3. Create initial commit
git commit -m "Initial commit: Water Quality Prediction and Unsafe Water Detection App"

# 4. Create main branch and link to remote
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/water-quality-prediction.git

# 5. Push to GitHub
git push -u origin main
```

---

## 📜 License
Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
