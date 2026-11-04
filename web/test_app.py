import unittest
import pandas as pd
from fastapi.testclient import TestClient
from web.app import app, bundle

class AppTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.data = dict(age_years=55, gender=1, height=165, weight=75, ap_hi=130, ap_lo=85, cholesterol=1, gluc=1, smoke=0, alco=0, active=1)

    def test_prediction_matches_direct_model(self):
        response = self.client.post('/api/predict', json=self.data)
        self.assertEqual(response.status_code, 200)
        row = {**self.data, 'male': 0, 'bmi': round(75 / 1.65**2, 2)}
        b = bundle()
        expected = b['model'].predict_proba(pd.DataFrame([row])[b['metadata']['features']])[0, 1]
        self.assertAlmostEqual(response.json()['model_score'], expected)
        self.assertEqual(response.json()['classification'], int(expected >= .5))

    def test_invalid_and_out_of_scope_inputs(self):
        for change in [{'ap_hi': -150}, {'ap_lo': 140}, {'age_years': 25}, {'cholesterol': 4}, {'height': 120, 'weight': 200}]:
            with self.subTest(change=change):
                self.assertEqual(self.client.post('/api/predict', json={**self.data, **change}).status_code, 422)

    def test_page_and_metadata(self):
        self.assertEqual(self.client.get('/').status_code, 200)
        self.assertEqual(self.client.get('/api/model').json()['model'], 'Random Forest')

if __name__ == '__main__':
    unittest.main()
