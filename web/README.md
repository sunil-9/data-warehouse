# Cardio Explorer

Presentation demo using the notebook-selected Random Forest. All application files are in `web/`. Existing submission documents are unchanged.

From the repository root:

```bash
uv run --with-requirements web/requirements.txt python web/prepare.py
uv run --with-requirements web/requirements.txt uvicorn web.app:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. Select **Study results dashboard**, or open http://127.0.0.1:8000/reports/notebook_results.html directly. The dashboard loads the saved results JSON and descriptive graphs from `reports/`. Restart the server after pulling app changes. Preparation is a one-time fit of the saved selected configuration on the notebook's training partition, not another hyperparameter search. It extracts cleaning rules and feature order from the current notebook, verifies the CSV checksum, and saves the fitted model locally. No model is fabricated when the artifact is missing. Runtime predictions do not train models or store entered health information.

Use the same Python environment for preparation and serving. Package versions can change refit results; `artifacts/metadata.json` records the actual rebuilt test metrics separately from historical notebook metrics. To reproduce the original run exactly, use the notebook's recorded environment. Regenerate after notebook or model changes. Model artifacts are ignored in Git; only load artifacts you generated yourself.

The input categories are the dataset's recorded categories, not cholesterol/glucose concentrations. Missing lab information must not be guessed. The interface supports ages within the cleaned study range and the notebook's measurement inclusion rules; rejected inputs are outside this demo's scope, not necessarily medically impossible. No severity, low/medium/high clinical risk, or future-event predictions are supported. A negative classification does not rule out disease. These are exploratory internal results without external Nepal/India validation.

Run API and feature checks: `uv run --with-requirements web/requirements.txt python -m unittest discover -s web -p 'test_*.py'`.

## Mobile browser demo

A static version exports the exact fitted forest for browser inference. It retains the existing form and checks inputs locally. No profile data is sent to a prediction API. The exporter does not retrain or fabricate model scores.

```bash
uv run --with-requirements web/requirements.txt python web/export_browser.py --output /absolute/path/to/dist
```

Serve that output over HTTP(S); opening index.html as a file will not support module/model loading. Browser traversal converts inputs to float32 and uses the same feature order, preprocessing, tree thresholds and leaf probabilities as sklearn. The demo is private by default when hosted through ChatGPT Sites.
