# Cardio Explorer

Presentation demo using the notebook-selected Random Forest. All application files are in `web/`. Existing submission documents are unchanged.

From the repository root:

```bash
python -m venv web/.venv
source web/.venv/bin/activate
# Windows: web\.venv\Scripts\activate
python -m pip install -r web/requirements.txt
python web/prepare.py
python -m uvicorn web.app:app --host 127.0.0.1 --port 8000
```

Open http://127.0.0.1:8000. Preparation is a one-time fit of the saved selected configuration on the notebook's training partition, not another hyperparameter search. It extracts cleaning rules and feature order from the current notebook, verifies the CSV checksum, and saves the fitted model locally. No model is fabricated when the artifact is missing. Runtime predictions do not train models or store entered health information.

Use the same Python environment for preparation and serving. Package versions can change refit results; `artifacts/metadata.json` records the actual rebuilt test metrics separately from historical notebook metrics. To reproduce the original run exactly, use the notebook's recorded environment. Regenerate after notebook or model changes. Model artifacts are ignored in Git; only load artifacts you generated yourself.

The input categories are the dataset's recorded categories, not cholesterol/glucose concentrations. Missing lab information must not be guessed. The interface supports ages within the cleaned study range and the notebook's measurement inclusion rules; rejected inputs are outside this demo's scope, not necessarily medically impossible. No severity, low/medium/high clinical risk, or future-event predictions are supported. A negative classification does not rule out disease. These are exploratory internal results without external Nepal/India validation.

Run API and feature checks: `python -m unittest discover -s web -p 'test_*.py'`.
