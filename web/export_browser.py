"""Export the prepared sklearn forest and existing UI for a static mobile demo."""
import argparse
import json
from pathlib import Path
import shutil
import joblib

HERE = Path(__file__).resolve().parent

def export(output):
    bundle = joblib.load(HERE / 'artifacts/model.joblib')
    model, metadata = bundle['model'], bundle['metadata']
    output = Path(output)
    assets = output / 'static'
    assets.mkdir(parents=True, exist_ok=True)
    trees = []
    for estimator in model.estimators_:
        tree = estimator.tree_
        values = tree.value[:, 0, :]
        positive = values[:, 1] / values.sum(axis=1)
        trees.append({'left': tree.children_left.tolist(), 'right': tree.children_right.tolist(),
                      'feature': tree.feature.tolist(), 'threshold': tree.threshold.tolist(),
                      'positive': positive.tolist()})
    (assets / 'forest.json').write_text(json.dumps({'metadata': metadata, 'trees': trees}, separators=(',', ':')))
    shutil.copy2(HERE / 'static/style.css', assets / 'style.css')
    shutil.copy2(HERE / 'static/examples.json', assets / 'examples.json')
    html = (HERE / 'static/index.html').read_text().replace('<script src="/static/app.js">', '<script type="module" src="/static/app.js">')
    html = html.replace('Inputs are processed for this request and are not saved by this application.',
                        'Predictions run in your browser. Profile inputs are not sent to a prediction server or saved by this application.')
    (output / 'index.html').write_text(html)
    adapter = '''import { getModel, predictProfile } from './inference.mjs';
// Reuse the original UI while keeping all inference inside this browser.
const fetch = async (url, options) => {
  try {
    if (url === '/api/model') return new Response(JSON.stringify(await getModel()));
    if (url === '/api/predict') return new Response(JSON.stringify(await predictProfile(JSON.parse(options.body))));
    return globalThis.fetch(url, options);
  } catch (error) {
    return new Response(JSON.stringify({detail: error.message}), {status: 422});
  }
};
'''
    (assets / 'app.js').write_text(adapter + (HERE / 'static/app.js').read_text())
    shutil.copy2(HERE / 'static/inference.mjs', assets / 'inference.mjs')
    print(json.dumps({'output': str(output), 'trees': len(trees), 'forest_bytes': (assets / 'forest.json').stat().st_size}))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', required=True)
    export(parser.parse_args().output)
