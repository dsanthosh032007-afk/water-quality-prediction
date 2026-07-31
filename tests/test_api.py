"""
API Verification & Integration Test Suite for AquaGuard AI Flask Server.
Tests dataset loading, model metrics endpoints, presets, prediction range validation,
and classification outputs.
"""

import os
import sys

# Ensure root project directory is in Python path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app import app

def test_routes():
    client = app.test_client()
    
    # 1. Test Index Route
    res = client.get('/')
    assert res.status_code == 200, f"Index failed with status code: {res.status_code}"
    print("[OK] GET / successful")

    # 2. Test Presets Endpoint
    res = client.get('/api/presets')
    assert res.status_code == 200, "Presets API endpoint failed"
    presets = res.get_json()
    assert len(presets) > 0, "No sample presets returned"
    print(f"[OK] GET /api/presets successful ({len(presets)} presets loaded)")

    # 3. Test Metrics Endpoint
    res = client.get('/api/metrics')
    assert res.status_code == 200, "Metrics API endpoint failed"
    metrics = res.get_json()
    assert 'accuracy' in metrics, "Missing accuracy field in metrics response"
    print(f"[OK] GET /api/metrics successful (Accuracy: {metrics['accuracy']}%, F1-Score: {metrics['f1_score']}%)")

    # 4. Test Stats Endpoint
    res = client.get('/api/stats')
    assert res.status_code == 200, "Stats API endpoint failed"
    stats = res.get_json()
    assert stats['total_samples'] == 3276, f"Expected 3276 samples, got {stats['total_samples']}"
    print(f"[OK] GET /api/stats successful ({stats['total_samples']} samples)")

    # 5. Test Prediction Endpoint - Safe Water Sample
    sample_safe = presets[0]['values']
    res = client.post('/api/predict', json=sample_safe)
    assert res.status_code == 200, f"Prediction API failed: {res.get_json()}"
    pred = res.get_json()
    assert 'is_safe' in pred, "Missing is_safe boolean in prediction response"
    print(f"[OK] POST /api/predict (Safe Sample): {pred['label']} ({pred['confidence']}% confidence)")

    # 6. Test Prediction Endpoint - Unsafe Water Sample
    sample_unsafe = presets[2]['values']
    res = client.post('/api/predict', json=sample_unsafe)
    assert res.status_code == 200, "Prediction API failed on unsafe sample"
    pred_unsafe = res.get_json()
    print(f"[OK] POST /api/predict (Unsafe Sample): {pred_unsafe['label']} ({pred_unsafe['confidence']}% confidence)")

    # 7. Test Input Validation Range Check (e.g. invalid pH = 25.0)
    invalid_sample = dict(sample_safe)
    invalid_sample['ph'] = 25.0
    res = client.post('/api/predict', json=invalid_sample)
    assert res.status_code == 400, "Validation check failed to reject out-of-bounds pH"
    print("[OK] POST /api/predict (Validation Range Check Passed)")

    print("\nALL Flask REST API & ML Model Integration Tests Passed Cleanly!")

if __name__ == '__main__':
    test_routes()
