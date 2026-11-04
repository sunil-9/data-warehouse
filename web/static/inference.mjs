// Exact traversal of the exported sklearn Random Forest; no synthetic scoring.
let pending;
async function loadForest() {
  if (!pending) pending = globalThis.fetch(new URL('./forest.json', import.meta.url))
    .then(response => { if (!response.ok) throw Error('The model could not load. Please reload the page.'); return response.json(); });
  return pending;
}
export function roundEven(value, places) {
  const scale = 10 ** places, scaled = value * scale, lower = Math.floor(scaled);
  return (scaled - lower === .5 ? (lower % 2 === 0 ? lower : lower + 1) : Math.round(scaled)) / scale;
}
export function scoreForest(forest, input) {
  const numeric = ['age_years','gender','height','weight','ap_hi','ap_lo','cholesterol','gluc','smoke','alco','active'];
  for (const field of numeric) if (typeof input[field] !== 'number' || !Number.isFinite(input[field])) throw Error(`A valid ${field} value is required.`);
  for (const [field, choices] of Object.entries({gender:[1,2],cholesterol:[1,2,3],gluc:[1,2,3],smoke:[0,1],alco:[0,1],active:[0,1]})) {
    if (!choices.includes(input[field])) throw Error(`Select a valid ${field} category.`);
  }
  const metadata = forest.metadata;
  const [ageLow, ageHigh] = metadata.age_range;
  if (input.age_years < ageLow || input.age_years > ageHigh) throw Error(`Age is outside the study range (${ageLow}–${ageHigh} years). No prediction is provided.`);
  for (const field of ['height','weight','ap_hi','ap_lo']) {
    const [low, high] = metadata.limits[field];
    if (input[field] < low || input[field] > high) throw Error(`${field} is outside the study input range (${low}–${high}).`);
  }
  if (input.ap_lo >= input.ap_hi) throw Error('Diastolic pressure must be below systolic pressure.');
  const bmi = input.weight / ((input.height / 100) ** 2);
  if (bmi < 10 || bmi > 70) throw Error('BMI lies outside the study inclusion range (10–70).');
  const row = {...input, male: Number(input.gender === 2), age_years: roundEven(input.age_years, 1), bmi: roundEven(bmi, 2), pulse_pressure: input.ap_hi - input.ap_lo};
  // sklearn converts prediction input to float32 before comparing tree thresholds.
  const x = metadata.features.map(feature => Math.fround(row[feature]));
  let sum = 0;
  for (const tree of forest.trees) {
    let node = 0;
    while (tree.left[node] !== -1) node = x[tree.feature[node]] <= tree.threshold[node] ? tree.left[node] : tree.right[node];
    sum += tree.positive[node];
  }
  const score = sum / forest.trees.length;
  return {classification: Number(score >= metadata.threshold), model_score: score, threshold: metadata.threshold,
    bmi: row.bmi, pulse_pressure: row.pulse_pressure,
    message: 'Research classification only. This score is not a diagnosis, disease severity, or validated future cardiovascular risk.'};
}
export async function getModel() { return (await loadForest()).metadata; }
export async function predictProfile(input) { return scoreForest(await loadForest(), input); }
