"""
Flask REST API & Static Server for Water Quality Prediction & Unsafe Water Detection App.
Serves prediction engine, model stats, metrics, sample presets, and frontend SPA.
"""

import os
import json
import numpy as np
import pandas as pd
import joblib
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
MODELS_DIR = os.path.join(BASE_DIR, "models")
DATASETS_DIR = os.path.join(BASE_DIR, "datasets")

app = Flask(__name__, static_folder=FRONTEND_DIR)
CORS(app)

# Recommended Standard / Target Ranges (WHO & EPA guidelines for reference)
PARAMETER_GUIDELINES = {
    'ph': {'min': 6.5, 'max': 8.5, 'unit': 'pH', 'name': 'pH Level', 'desc': 'Neutral range: 6.5 - 8.5'},
    'Hardness': {'min': 60.0, 'max': 250.0, 'unit': 'mg/L', 'name': 'Hardness', 'desc': 'Desirable range: 60 - 250 mg/L'},
    'Solids': {'min': 500.0, 'max': 25000.0, 'unit': 'ppm', 'name': 'Solids (TDS)', 'desc': 'Ideal TDS: < 25,000 ppm'},
    'Chloramines': {'min': 4.0, 'max': 8.0, 'unit': 'ppm', 'name': 'Chloramines', 'desc': 'Safe disinfectant level: 4.0 - 8.0 ppm'},
    'Sulfate': {'min': 150.0, 'max': 350.0, 'unit': 'mg/L', 'name': 'Sulfate', 'desc': 'Recommended level: 150 - 350 mg/L'},
    'Conductivity': {'min': 200.0, 'max': 500.0, 'unit': 'μS/cm', 'name': 'Conductivity', 'desc': 'Standard level: 200 - 500 μS/cm'},
    'Organic_carbon': {'min': 2.0, 'max': 16.0, 'unit': 'ppm', 'name': 'Organic Carbon', 'desc': 'Clean water level: < 16 ppm'},
    'Trihalomethanes': {'min': 10.0, 'max': 80.0, 'unit': 'μg/L', 'name': 'Trihalomethanes', 'desc': 'Safe limit: < 80 μg/L'},
    'Turbidity': {'min': 1.0, 'max': 4.5, 'unit': 'NTU', 'name': 'Turbidity', 'desc': 'Optimal clarity: < 4.5 NTU'}
}

# Helper to load Model & Scaler
def get_ml_pipeline():
    model_path = os.path.join(MODELS_DIR, "water_potability_rf_model.joblib")
    pipeline_path = os.path.join(MODELS_DIR, "scaler_imputer.joblib")
    
    if not os.path.exists(model_path) or not os.path.exists(pipeline_path):
        # Trigger model training if missing
        from backend.train_model import run_training_pipeline
        run_training_pipeline()
        
    rf_model = joblib.load(model_path)
    pipeline_dict = joblib.load(pipeline_path)
    return rf_model, pipeline_dict['imputer'], pipeline_dict['scaler'], pipeline_dict['feature_cols']

# Serve SPA Frontend
@app.route('/')
def serve_index():
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return send_from_directory(FRONTEND_DIR, 'index.html')

# API Route: Model Metrics & Feature Importances
@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        from backend.train_model import run_training_pipeline
        run_training_pipeline()
        
    with open(metrics_path, 'r') as f:
        metrics = json.load(f)
    return jsonify(metrics)

# API Route: Dataset Statistics & Distribution
@app.route('/api/stats', methods=['GET'])
def get_stats():
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        from backend.train_model import run_training_pipeline
        run_training_pipeline()
        
    with open(metrics_path, 'r') as f:
        data = json.load(f)
        
    return jsonify({
        'total_samples': data.get('total_samples'),
        'safe_count': data.get('safe_count'),
        'unsafe_count': data.get('unsafe_count'),
        'feature_stats': data.get('feature_stats'),
        'correlation_matrix': data.get('correlation_matrix'),
        'ph_distribution': data.get('ph_distribution')
    })

# API Route: Presets for Testing
@app.route('/api/presets', methods=['GET'])
def get_presets():
    presets = [
        {
            'id': 'clean_tap',
            'name': 'Clean Municipal Tap Water',
            'category': 'Safe',
            'description': 'Filtered tap water meeting WHO & EPA safe drinking water guidelines.',
            'values': {
                'ph': 7.35,
                'Hardness': 185.0,
                'Solids': 18200.0,
                'Chloramines': 7.10,
                'Sulfate': 325.0,
                'Conductivity': 415.0,
                'Organic_carbon': 12.4,
                'Trihalomethanes': 58.2,
                'Turbidity': 3.4
            }
        },
        {
            'id': 'mineral_spring',
            'name': 'Fresh Mineral Spring Water',
            'category': 'Safe',
            'description': 'Pure underground mountain spring water rich in healthy essential minerals.',
            'values': {
                'ph': 7.80,
                'Hardness': 210.0,
                'Solids': 19500.0,
                'Chloramines': 6.80,
                'Sulfate': 340.0,
                'Conductivity': 430.0,
                'Organic_carbon': 11.2,
                'Trihalomethanes': 42.5,
                'Turbidity': 2.9
            }
        },
        {
            'id': 'contaminated_river',
            'name': 'Untreated Pond / Runoff Water',
            'category': 'Unsafe',
            'description': 'High organic load, acidic pH, elevated turbidity & trihalomethane compounds.',
            'values': {
                'ph': 4.80,
                'Hardness': 285.0,
                'Solids': 44200.0,
                'Chloramines': 11.80,
                'Sulfate': 460.0,
                'Conductivity': 690.0,
                'Organic_carbon': 24.8,
                'Trihalomethanes': 118.0,
                'Turbidity': 6.2
            }
        },
        {
            'id': 'acid_mine_water',
            'name': 'Industrial / Acidic Drainage Water',
            'category': 'Unsafe',
            'description': 'Highly corrosive, low pH, high sulfates, total dissolved solids and conductivity.',
            'values': {
                'ph': 3.40,
                'Hardness': 315.0,
                'Solids': 55000.0,
                'Chloramines': 2.10,
                'Sulfate': 478.0,
                'Conductivity': 740.0,
                'Organic_carbon': 21.5,
                'Trihalomethanes': 98.4,
                'Turbidity': 5.8
            }
        }
    ]
    return jsonify(presets)

# API Route: Prediction Engine
@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json(force=True)
        if not data:
            return jsonify({'error': 'No input data provided'}), 400

        rf_model, imputer, scaler, feature_cols = get_ml_pipeline()

        # Input Validation & Parsing
        input_values = []
        validation_errors = []
        parameter_summary = []

        for col in feature_cols:
            if col not in data or data[col] is None or data[col] == "":
                validation_errors.append(f"Missing required parameter: {col}")
                continue
            
            try:
                val = float(data[col])
            except ValueError:
                validation_errors.append(f"Invalid numeric value for {col}: {data[col]}")
                continue

            # Hard constraints validation
            if col == 'ph' and (val < 0 or val > 14):
                validation_errors.append("pH must be between 0.0 and 14.0.")
            elif val < 0:
                validation_errors.append(f"{col} cannot be negative.")

            input_values.append(val)

            # Analyze parameter compliance against WHO standards
            guideline = PARAMETER_GUIDELINES.get(col, {'min': 0, 'max': 1000, 'unit': '', 'name': col, 'desc': ''})
            status = "Optimal"
            if val < guideline['min']:
                status = "Below Recommended"
            elif val > guideline['max']:
                status = "Above Safe Limit"

            parameter_summary.append({
                'key': col,
                'name': guideline['name'],
                'value': val,
                'unit': guideline['unit'],
                'recommended_range': f"{guideline['min']} - {guideline['max']} {guideline['unit']}",
                'status': status,
                'description': guideline['desc']
            })

        if validation_errors:
            return jsonify({'error': 'Validation Failed', 'details': validation_errors}), 400

        # Transform & Predict
        input_df = pd.DataFrame([input_values], columns=feature_cols)
        input_imp = imputer.transform(input_df)
        input_scaled = scaler.transform(input_imp)


        prediction_class = int(rf_model.predict(input_scaled)[0])
        probabilities = rf_model.predict_proba(input_scaled)[0]

        # Calculate confidence score %
        confidence = float(np.max(probabilities) * 100)
        safe_probability = float(probabilities[1] * 100)
        unsafe_probability = float(probabilities[0] * 100)

        is_safe = (prediction_class == 1)
        result_label = "Safe for Drinking" if is_safe else "Unsafe for Drinking"
        result_color = "green" if is_safe else "red"

        # General advice / recommendation based on parameters
        concerns = [item['name'] for item in parameter_summary if item['status'] != "Optimal"]
        if is_safe:
            recommendation = "This water sample satisfies safety metrics and is classified as fit for human consumption."
        else:
            recommendation = f"Caution! Water parameters suggest contamination risks. Primary parameters out of optimal bounds: {', '.join(concerns) if concerns else 'High chemical imbalance'}."

        return jsonify({
            'success': True,
            'prediction': prediction_class,
            'label': result_label,
            'is_safe': is_safe,
            'color': result_color,
            'confidence': round(confidence, 1),
            'safe_probability': round(safe_probability, 1),
            'unsafe_probability': round(unsafe_probability, 1),
            'recommendation': recommendation,
            'parameter_summary': parameter_summary
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("Starting Water Quality Backend Server on http://127.0.0.1:5000 ...")
    app.run(host='0.0.0.0', port=5000, debug=True)
