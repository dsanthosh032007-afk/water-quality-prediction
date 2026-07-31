"""
Machine Learning Training Pipeline for Water Potability Prediction.
Loads water_potability.csv, performs preprocessing & missing value imputation,
trains a Random Forest Classifier, computes metrics, and exports artifacts.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)


from sklearn.model_selection import train_test_split
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix

def run_training_pipeline():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "datasets", "water_potability.csv")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    # 1. Load Dataset
    if not os.path.exists(dataset_path):
        print("Dataset not found. Invoking dataset generator...")
        from datasets.generate_dataset import generate_water_potability_dataset
        generate_water_potability_dataset(dataset_path)

    df = pd.read_csv(dataset_path)
    print(f"Loaded dataset with shape {df.shape}")

    feature_cols = ['ph', 'Hardness', 'Solids', 'Chloramines', 'Sulfate', 
                    'Conductivity', 'Organic_carbon', 'Trihalomethanes', 'Turbidity']
    target_col = 'Potability'

    # Compute Raw Summary Stats for Frontend Dashboard
    missing_summary = df.isnull().sum().to_dict()
    feature_stats = {}
    for col in feature_cols:
        feature_stats[col] = {
            'mean': float(df[col].mean()),
            'std': float(df[col].std()),
            'min': float(df[col].min()),
            'max': float(df[col].max()),
            'median': float(df[col].median()),
            'missing': int(missing_summary[col])
        }

    potability_counts = df[target_col].value_counts().to_dict()
    safe_count = int(potability_counts.get(1, 0))
    unsafe_count = int(potability_counts.get(0, 0))

    # Compute correlation matrix for valid numerical values
    corr_df = df.corr().fillna(0)
    correlation_matrix = {
        'columns': list(corr_df.columns),
        'values': corr_df.values.tolist()
    }

    # Compute pH distribution histogram
    ph_clean = df['ph'].dropna().values
    counts, bin_edges = np.histogram(ph_clean, bins=15, range=(0, 14))
    ph_distribution = {
        'bins': [round(b, 2) for b in bin_edges[:-1]],
        'counts': [int(c) for c in counts]
    }

    # 2. Data Preprocessing & Splitting
    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Imputer & Scaler
    imputer = SimpleImputer(strategy='median')
    scaler = StandardScaler()

    X_train_imp = imputer.fit_transform(X_train)
    X_train_scaled = scaler.fit_transform(X_train_imp)

    X_test_imp = imputer.transform(X_test)
    X_test_scaled = scaler.transform(X_test_imp)

    # 3. Model Training
    print("Training Random Forest Classifier...")
    rf = RandomForestClassifier(
        n_estimators=150,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rf.fit(X_train_scaled, y_train)

    # 4. Model Evaluation
    y_pred = rf.predict(X_test_scaled)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()

    feature_importances = dict(zip(feature_cols, rf.feature_importances_.tolist()))
    # Sort feature importances descending
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda x: x[1], reverse=True))

    print(f"Model Training Completed!")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1-Score:  {f1:.4f}")

    # 5. Export Artifacts
    model_path = os.path.join(models_dir, "water_potability_rf_model.joblib")
    pipeline_path = os.path.join(models_dir, "scaler_imputer.joblib")

    joblib.dump(rf, model_path)
    joblib.dump({
        'imputer': imputer,
        'scaler': scaler,
        'feature_cols': feature_cols
    }, pipeline_path)

    metrics_payload = {
        'total_samples': len(df),
        'safe_count': safe_count,
        'unsafe_count': unsafe_count,
        'accuracy': round(acc * 100, 2),
        'precision': round(prec * 100, 2),
        'recall': round(rec * 100, 2),
        'f1_score': round(f1 * 100, 2),
        'confusion_matrix': cm,
        'feature_importances': sorted_importances,
        'feature_stats': feature_stats,
        'correlation_matrix': correlation_matrix,
        'ph_distribution': ph_distribution
    }

    metrics_path = os.path.join(models_dir, "model_metrics.json")
    with open(metrics_path, 'w') as f:
        json.dump(metrics_payload, f, indent=2)

    print(f"Artifacts successfully saved to {models_dir}")

if __name__ == "__main__":
    run_training_pipeline()
