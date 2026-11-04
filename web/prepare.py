"""Rebuild the selected notebook estimator without repeating hyperparameter search."""
import ast
import hashlib
import json
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import StratifiedGroupKFold

ROOT = Path(__file__).resolve().parents[1]
ARTIFACTS = Path(__file__).resolve().parent / 'artifacts'

def prepare():
    nb_path = ROOT / 'NIT6160_Cardio_Project.ipynb'
    nb = json.loads(nb_path.read_text())
    record = json.loads((ROOT / 'reports/notebook_results.json').read_text())
    if record['selected_model'] != 'Random Forest':
        raise RuntimeError('Notebook selected model changed; update the web export before proceeding.')
    # Only extract definitions, never execute the notebook or its training cells.
    scope = {'pd': pd, 'np': np, 'TARGET': 'cardio', 'LIMITS': record['plausibility_limits']}
    wanted = {'BP_RULES', 'BODY_RULES', 'CODE_RULES', 'FEATURES'}
    for cell in nb['cells']:
        if cell['cell_type'] != 'code':
            continue
        tree = ast.parse(''.join(cell['source']))
        for node in tree.body:
            is_assignment = isinstance(node, ast.Assign) and any(isinstance(t, ast.Name) and t.id in wanted for t in node.targets)
            if is_assignment or isinstance(node, ast.FunctionDef) and node.name in {'quality_flags', 'clean'}:
                exec(compile(ast.Module(body=[node], type_ignores=[]), '<notebook definitions>', 'exec'), scope)
    data_path = ROOT / 'cardio_train.csv'
    raw_bytes = data_path.read_bytes()
    # Verify against the checksum declared by the notebook.
    source = '\n'.join(''.join(c['source']) for c in nb['cells'] if c['cell_type'] == 'code')
    checksum = next(ast.literal_eval(n.value) for n in ast.walk(ast.parse(source)) if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'DATA_SHA256' for t in n.targets))
    if hashlib.sha256(raw_bytes).hexdigest() != checksum:
        raise ValueError('Dataset checksum mismatch')
    df, log = scope['clean'](pd.read_csv(data_path, sep=';'))
    features = scope['FEATURES']
    X, y, groups = df[features], df['cardio'], df['profile_id']
    train, test = next(StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=record['seed']).split(X, y, groups))
    params = {k: ast.literal_eval(v) for k, v in record['best_params']['Random Forest'].items()}
    model = RandomForestClassifier(**params, random_state=record['seed'], n_jobs=2)
    model.fit(X.iloc[train], y.iloc[train])
    from sklearn.metrics import accuracy_score, roc_auc_score
    proba = model.predict_proba(X.iloc[test])[:, 1]
    actual = {'accuracy': accuracy_score(y.iloc[test], proba >= record['threshold']), 'roc_auc': roc_auc_score(y.iloc[test], proba)}
    metadata = {'model': 'Random Forest', 'features': features, 'threshold': record['threshold'], 'versions': {'sklearn': sklearn.__version__}, 'notebook_sha256': hashlib.sha256(nb_path.read_bytes()).hexdigest(), 'age_range': [float(df.age_years.min()), float(df.age_years.max())], 'limits': record['plausibility_limits'], 'test_metrics_rebuilt': actual, 'recorded_test_metrics': record['test']['Random Forest'], 'training_rows': len(train), 'test_rows': len(test), 'exclusions': log}
    ARTIFACTS.mkdir(exist_ok=True)
    joblib.dump({'model': model, 'metadata': metadata}, ARTIFACTS / 'model.joblib')
    (ARTIFACTS / 'metadata.json').write_text(json.dumps(metadata, indent=2))
    print(json.dumps(actual, indent=2))

if __name__ == '__main__':
    prepare()
