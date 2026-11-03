const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const fa = require("react-icons/fa");
const { applyTheme } = require(process.env.PPTX_SKILL + "/scripts/apply_theme.js");

const OUT = process.argv[2];

// Ink-teal for structure and "no disease", coral for CVD / risk / the chosen answer
const THEME = {
  name: "Cardio Pulse",
  headFontFace: "Arial",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "16232A", lt1: "FFFFFF", dk2: "0E2B33", lt2: "EEF4F5",
    accent1: "E4513B", accent2: "2A7F8A", accent3: "F6B7A9", accent4: "7D8B90",
    accent5: "9FCDD2", accent6: "E9A23B", hlink: "2A7F8A", folHlink: "0E2B33",
  },
};
const HEX = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5 in
pres.title = "Predicting Cardiovascular Disease with Machine Learning";
pres.author = "Sunil Sapkota";
pres.subject = "NIT6160 Data Warehousing and Mining project";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

async function icon(name, color = "#FFFFFF", size = 256) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(fa[name], { color, size: String(size) }));
  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + png.toString("base64");
}

// ---------- layouts ----------
const W = 13.333, M = 0.6;
pres.defineSlideMaster({
  title: "DARK",
  background: { color: HEX.dk2 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", x: M, y: 1.3, w: 8.6, h: 2.3, fontFace: THEME.headFontFace, fontSize: 44, bold: true, color: C.background1, valign: "bottom", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 3.85, w: 11, h: 1.4, fontSize: 18, color: C.accent5, valign: "top", align: "left", margin: 0 }, text: "" } },
  ],
});
pres.defineSlideMaster({
  title: "CONTENT",
  background: { color: HEX.lt1 },
  margin: [0.4, M, 0.6, M],
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.38, w: 8, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", x: M, y: 0.68, w: W - 2 * M, h: 0.7, fontFace: THEME.headFontFace, fontSize: 30, bold: true, color: C.text2, valign: "middle", align: "left", margin: 0 }, text: "" } },
    { text: { text: "NIT6160 · Predicting cardiovascular disease", options: { x: M, y: 7.0, w: 6, h: 0.3, fontSize: 10, color: C.accent4, margin: 0 } } },
  ],
  slideNumber: { x: W - M - 0.6, y: 7.0, w: 0.6, h: 0.3, fontSize: 10, color: C.accent4, align: "right" },
});

// ---------- helpers ----------
const T = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, color: C.text1, fontSize: 15, valign: "top", ...opts });
function card(slide, x, y, w, h, name, fill = C.background2) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.1, fill: { color: fill }, line: { type: "none" }, objectName: name });
}
async function badge(slide, x, y, d, iconName, fill = C.accent2, name = "icon") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: fill }, line: { type: "none" }, objectName: name + " circle" });
  const pad = d * 0.26;
  slide.addImage({ data: await icon(iconName), x: x + pad, y: y + pad, w: d - 2 * pad, h: d - 2 * pad, altText: name, objectName: name });
}
function dot(slide, x, y, d, label, fill = C.accent2, fontSize = 14) {
  slide.addText(label, { shape: pres.shapes.OVAL, x, y, w: d, h: d, fill: { color: fill }, color: C.background1, bold: true, fontSize, align: "center", valign: "middle", margin: 0, isTextBox: true, objectName: `marker ${label}` });
}
function head(slide, kicker, title) {
  slide.addText(kicker.toUpperCase(), { placeholder: "kicker" });
  slide.addText(title, { placeholder: "title" });
}
// The motif: an ECG trace, drawn as a native custom-geometry line
function ecg(slide, x, y, w, h, color, width = 2.5, name = "ECG trace") {
  const u = w / 100, pts = [];
  const beat = (s) => [[s, 0.6], [s + 4, 0.6], [s + 6, 0.5], [s + 8, 0.6], [s + 10, 0.6], [s + 11, 0.72], [s + 13, 0.0], [s + 15, 1.0], [s + 17, 0.6], [s + 21, 0.6], [s + 24, 0.45], [s + 27, 0.6]];
  pts.push([0, 0.6]);
  for (const s of [8, 41, 74]) pts.push(...beat(s));
  pts.push([100, 0.6]);
  slide.addShape(pres.shapes.CUSTOM_GEOMETRY, {
    x, y, w, h, line: { color, width }, fill: { type: "none" }, objectName: name,
    points: pts.map(([px, py], i) => (i === 0 ? { x: px * u, y: py * h, moveTo: true } : { x: px * u, y: py * h })),
  });
}
const chartText = { catAxisLabelFontFace: "+mn-lt", valAxisLabelFontFace: "+mn-lt", dataLabelFontFace: "+mn-lt", titleFontFace: "+mn-lt", legendFontFace: "+mn-lt" };
const chartBase = () => ({
  ...chartText,
  catAxisLabelColor: HEX.dk1, valAxisLabelColor: HEX.accent4, catAxisLabelFontSize: 13, valAxisLabelFontSize: 11,
  valGridLine: { color: "E3E9EA", size: 0.5 }, catGridLine: { style: "none" },
  showTitle: false, dataLabelFontSize: 13, dataLabelColor: HEX.dk1, dataLabelFontBold: true,
  catAxisLineShow: false, valAxisLineShow: false,
});

(async () => {
  // ===== 1. Title =====
  pres.addSection({ title: "Introduction" });
  let s = pres.addSlide({ masterName: "DARK", sectionTitle: "Introduction" });
  T(s, "NIT6160 DATA WAREHOUSING AND MINING · PROJECT", { x: M, y: 0.9, w: 9, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 2 });
  s.addText("Predicting Cardiovascular Disease with Machine Learning", { placeholder: "title" });
  s.addText([
    { text: "70,000 patient check-ups · three models · one question: who is at risk?", options: { breakLine: true } },
    { text: "Sunil Sapkota · s8206069 · Term H8W4, 2026", options: { color: C.background1, fontSize: 16 } },
  ], { placeholder: "body", paraSpaceAfter: 10 });
  ecg(s, 0, 5.55, W, 1.25, HEX.accent1, 3, "title ECG trace");
  s.addNotes("Introduce yourself and the project. In 10 minutes: the dataset and how it was cleaned, what the exploratory analysis showed, the three models and how they compare, and what the results mean.");

  // ===== 2. Objectives and RQs =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Introduction" });
  head(s, "Introduction", "Objectives and research questions");
  T(s, "Can routine check-up measurements predict cardiovascular disease, and which model should a clinician trust?", { x: M, y: 1.65, w: 5.3, h: 1.9, fontSize: 24, bold: true, color: C.text2, fontFace: THEME.headFontFace });
  const objs = [
    ["FaSearch", "Find the demographic, clinical and lifestyle factors linked to CVD"],
    ["FaCogs", "Build, tune and compare three classification models"],
    ["FaBalanceScale", "Weigh accuracy against interpretability for healthcare"],
  ];
  for (const [i, [ic, t]] of objs.entries()) {
    const y = 3.95 + i * 0.95;
    await badge(s, M, y, 0.6, ic, C.accent2, `objective ${i + 1} icon`);
    T(s, t, { x: M + 0.85, y, w: 4.45, h: 0.6, fontSize: 15, valign: "middle" });
  }
  const rqs = [
    ["Significant factors", "Which factors are most associated with CVD?"],
    ["Demographics", "Do age and gender relate to CVD?"],
    ["Lifestyle", "Do smoking, alcohol and activity relate to CVD?"],
    ["Predictive value", "Which variables drive model predictions?"],
    ["Model choice", "Can ML predict CVD, and which model balances accuracy and interpretability?"],
  ];
  rqs.forEach(([h, q], i) => {
    const y = 1.6 + i * 1.04;
    card(s, 6.5, y, 6.23, 0.88, `RQ${i + 1} card`);
    T(s, `RQ${i + 1}`, { x: 6.75, y, w: 0.9, h: 0.88, fontSize: 20, bold: true, color: i === 4 ? C.accent1 : C.accent2, fontFace: THEME.headFontFace, valign: "middle" });
    T(s, [{ text: h, options: { bold: true, color: C.text2, breakLine: true } }, { text: q, options: { fontSize: 14 } }], { x: 7.75, y, w: 4.8, h: 0.88, fontSize: 15, valign: "middle" });
  });
  s.addNotes("Two objectives: understand risk factors and build predictive models. The five research questions come from the brief's examples and from the literature survey in the report. RQ5 is about the trade-off between a simple, explainable model and a more complex one.");

  // ===== 3. Dataset =====
  pres.addSection({ title: "Data" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Data" });
  head(s, "Data", "70,000 patient examinations, perfectly balanced");
  const stats1 = [["70,000", "patient records"], ["11", "predictors"], ["50 / 50", "CVD vs no CVD"], ["0", "missing values"]];
  stats1.forEach(([n, l], i) => {
    const x = M + i * 3.11;
    T(s, n, { x, y: 1.6, w: 2.9, h: 0.95, fontSize: 48, bold: true, color: i === 2 ? C.accent1 : C.text2, fontFace: THEME.headFontFace, valign: "bottom" });
    T(s, l, { x, y: 2.6, w: 2.9, h: 0.4, fontSize: 15, color: C.accent4 });
  });
  const groups = [
    ["FaUsers", "Demographic", "Age (stored in days), gender, height, weight"],
    ["FaStethoscope", "Clinical", "Systolic and diastolic blood pressure; cholesterol and glucose (3 levels each)"],
    ["FaRunning", "Lifestyle", "Smoking, alcohol, physical activity (self-reported, yes/no)"],
    ["FaHeartbeat", "Outcome", "cardio: presence of cardiovascular disease (0/1)"],
  ];
  for (const [i, [ic, h, t]] of groups.entries()) {
    const x = M + i * 3.11;
    const out = i === 3;
    card(s, x, 3.45, 2.85, 2.85, `${h} card`, out ? C.text2 : C.background2);
    await badge(s, x + 0.3, 3.75, 0.65, ic, out ? C.accent1 : C.accent2, `${h} icon`);
    T(s, h, { x: x + 0.3, y: 4.6, w: 2.3, h: 0.4, fontSize: 18, bold: true, color: out ? C.background1 : C.text2 });
    T(s, t, { x: x + 0.3, y: 5.05, w: 2.3, h: 1.15, fontSize: 14, color: out ? C.background1 : C.text1 });
  }
  T(s, "Source: S. Ulianova, “Cardiovascular Disease dataset,” Kaggle, 2019", { x: M, y: 6.5, w: 9, h: 0.3, fontSize: 11, color: C.accent4, italic: true });
  s.addNotes("Kaggle cardiovascular dataset, semicolon-separated. It covers every variable group the brief lists. The target is perfectly balanced, so accuracy is meaningful and no resampling is needed. Cholesterol and glucose are categories, not lab values. The population and the definition of CVD are not documented, which is a limitation.");

  // ===== 4. Data quality =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Data" });
  head(s, "Data", "No missing values, but many impossible ones");
  card(s, M, 1.6, 5.2, 5.1, "problems card", C.text2);
  T(s, "WHAT WAS WRONG", { x: M + 0.4, y: 1.9, w: 4.4, h: 0.3, fontSize: 12, bold: true, color: C.accent3, charSpacing: 2 });
  T(s, "16,020", { x: M + 0.4, y: 2.25, w: 4.4, h: 1.1, fontSize: 66, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "middle" });
  T(s, "mmHg: the highest systolic blood pressure recorded", { x: M + 0.4, y: 3.35, w: 4.4, h: 0.6, fontSize: 16, color: C.background1 });
  T(s, [
    { text: "Negative blood pressure readings", options: { bullet: true, breakLine: true } },
    { text: "1,236 rows with diastolic at or above systolic", options: { bullet: true, breakLine: true } },
    { text: "Heights of 55 cm, weights of 10 kg", options: { bullet: true } },
  ], { x: M + 0.4, y: 4.3, w: 4.4, h: 2.1, fontSize: 15, color: C.background1, paraSpaceAfter: 8 });

  const flow = [
    ["70,000", "raw records", C.text2],
    ["− 24", "exact duplicates", C.accent4],
    ["− 1,336", "implausible blood pressure", C.accent4],
    ["− 59", "implausible height / weight / BMI", C.accent4],
    ["68,581", "kept for modelling (98%)", C.accent1],
  ];
  const fx = 6.4;
  s.addShape(pres.shapes.LINE, { x: fx + 0.15, y: 1.85, w: 0, h: 2.6, line: { color: HEX.accent5, width: 2 }, objectName: "flow connector" });
  flow.forEach(([n, l, col], i) => {
    const y = 1.65 + i * 0.65;
    s.addShape(pres.shapes.OVAL, { x: fx, y: y + 0.1, w: 0.3, h: 0.3, fill: { color: col }, line: { color: HEX.lt1, width: 2 }, objectName: `flow ${i + 1} dot` });
    T(s, n, { x: fx + 0.55, y, w: 1.6, h: 0.5, fontSize: 22, bold: true, color: col, fontFace: THEME.headFontFace, valign: "middle" });
    T(s, l, { x: fx + 2.25, y, w: 4.1, h: 0.5, fontSize: 15, valign: "middle", bold: i === 4 });
  });
  const how = [
    ["FaFilter", "Fixed study filters, set in advance", "Not tuned to scores; IQR rule rejected: it flags 4,632 diastolic values, many real hypertension"],
    ["FaPlus", "Engineered features", "Age in years, BMI; pulse pressure for EDA only (it equals systolic − diastolic)"],
  ];
  for (const [i, [ic, h, t]] of how.entries()) {
    const y = 4.95 + i * 1.0;
    await badge(s, fx, y, 0.55, ic, C.accent2, `${h} icon`);
    T(s, [{ text: h, options: { bold: true, color: C.text2, breakLine: true } }, { text: t, options: { fontSize: 14 } }], { x: fx + 0.8, y: y - 0.05, w: 5.55, h: 0.9, fontSize: 15 });
  }
  s.addNotes("Data quality was the key preprocessing issue. Nothing is missing, but some values are physically impossible, probably typing errors like 1200 for 120. I used study inclusion filters fixed in advance: systolic 80 to 250, diastolic 40 to 160, systolic strictly above diastolic, since a pulse pressure of zero is impossible, plus height, weight and BMI ranges. They are filters, not proof that every excluded value is impossible. A statistical IQR rule would have deleted many genuine high-risk patients. The clean() function logs each exclusion and asserts the rules hold. We keep 98% of the data and the target stays balanced.");

  // ===== 5. EDA =====
  pres.addSection({ title: "Analysis" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Analysis" });
  head(s, "Exploratory analysis", "Blood pressure, age and cholesterol stand out");
  const cw = 3.85, cg = 0.34;
  const eda = [
    ["23% → 86%", "CVD rate by systolic BP (mmHg)", pres.charts.BAR, ["<120", "120–129", "130–139", "140–159", "160+"], [23.0, 35.6, 59.9, 82.9, 86.1]],
    ["24% → 67%", "CVD rate by age (years)", pres.charts.LINE, ["≤40", "41–45", "46–50", "51–55", "56–60", "61–65"], [23.4, 30.8, 42.5, 46.2, 56.2, 67.0]],
    ["44% → 76%", "CVD rate by cholesterol level", pres.charts.BAR, ["Normal", "Above", "Well above"], [43.5, 59.6, 76.2]],
  ];
  eda.forEach(([big, lab, type, labels, values], i) => {
    const x = M + i * (cw + cg);
    T(s, big, { x, y: 1.55, w: cw, h: 0.7, fontSize: 34, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "middle" });
    T(s, lab, { x, y: 2.25, w: cw, h: 0.35, fontSize: 15, color: C.text2, bold: true });
    const line = type === pres.charts.LINE;
    s.addChart(type, [{ name: "CVD %", labels, values }], {
      ...chartBase(), x: x - 0.1, y: 2.7, w: cw + 0.1, h: 3.05, barDir: "col",
      chartColors: [line ? HEX.accent2 : HEX.accent1], showValue: true, dataLabelPosition: line ? "t" : "outEnd", dataLabelFormatCode: "0",
      valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 100, valAxisMinVal: 0, showLegend: false, barGapWidthPct: 45,
      ...(line ? { lineSize: 3, lineDataSymbol: "circle", lineDataSymbolSize: 9 } : {}), catAxisLabelFontSize: 12,
      objectName: `${lab} chart`,
    });
  });
  card(s, M, 5.95, W - 2 * M, 0.8, "eda note card");
  T(s, [
    { text: "Not significant: ", options: { bold: true, color: C.text2 } },
    { text: "gender (49% vs 50%, p = 0.06).   " },
    { text: "Tiny effects: ", options: { bold: true, color: C.text2 } },
    { text: "smoking, alcohol and activity each differ by under 5 points (likely self-report bias)." },
  ], { x: M + 0.3, y: 5.95, w: W - 2 * M - 0.6, h: 0.8, fontSize: 15, valign: "middle" });
  s.addNotes("CVD rises steeply with blood pressure: from 23% below 120 to 86% at 160 and above. It rises steadily with age, from 24% under 40 to 67% over 60, and with cholesterol level. Mann-Whitney and chi-square tests confirm these at p < 0.001. Gender is not significant. Smoking and alcohol show slightly lower rates among users, which is counter-intuitive and most likely self-report bias and confounding: smokers are mostly men here. The report also has histograms, box plots, scatter plots and the correlation matrix.");

  // ===== 6. Modelling approach =====
  pres.addSection({ title: "Modelling" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  head(s, "Modelling", "A leak-proof pipeline for three models");
  const steps = [
    ["Split", "80 / 20 stratified, grouped on final model inputs so identical inputs never cross"],
    ["Tune", "5-fold group cross-validation; grid / randomized search on ROC-AUC"],
    ["Select", "Simplest model within one standard error of the best training-CV ROC-AUC"],
    ["Evaluate", "Held-out test with bootstrap CIs; the test set never picks the model"],
  ];
  const sw = 3.03;
  s.addShape(pres.shapes.LINE, { x: M + 0.3, y: 1.9, w: 3 * sw, h: 0, line: { color: HEX.accent5, width: 2 }, objectName: "pipeline connector" });
  steps.forEach(([h, t], i) => {
    const x = M + i * sw;
    dot(s, x, 1.6, 0.6, String(i + 1), C.text2, 16);
    T(s, h, { x, y: 2.35, w: sw - 0.3, h: 0.4, fontSize: 18, bold: true, color: C.text2 });
    T(s, t, { x, y: 2.8, w: sw - 0.3, h: 1.0, fontSize: 14 });
  });
  card(s, M, 4.1, W - 2 * M, 2.35, "models card");
  const models = [
    ["FaBalanceScale", "Logistic Regression", "Interpretable baseline: coefficients become odds ratios clinicians can read"],
    ["FaTree", "Random Forest", "Tree ensemble that captures non-linear effects such as age × blood pressure"],
    ["FaProjectDiagram", "Neural Network", "Multilayer perceptron (MLP) with early stopping: does extra complexity pay off?"],
  ];
  const mw = 3.9;
  for (const [i, [ic, h, t]] of models.entries()) {
    const x = M + 0.3 + i * (mw + 0.15);
    await badge(s, x, 4.35, 0.6, ic, i === 1 ? C.accent1 : C.accent2, `${h} icon`);
    T(s, h, { x: x + 0.8, y: 4.35, w: mw - 0.9, h: 0.6, fontSize: 17, bold: true, color: C.text2, valign: "middle" });
    T(s, t, { x, y: 5.1, w: mw - 0.2, h: 0.85, fontSize: 14 });
  }
  T(s, "SVM considered but not used: kernel training cost grows roughly with the square of the ~55,000 training rows.", { x: M, y: 6.55, w: W - 2 * M, h: 0.3, fontSize: 12, color: C.accent4, italic: true });
  s.addNotes("Groups are computed after feature engineering, because rounding age can make different raw rows identical at the model input. Tuning and model selection use only the training data. The selection rule picks the simplest model whose cross-validated ROC-AUC is within one standard error of the best, which puts the accuracy-interpretability trade-off into practice. The MLP uses early stopping on a random 10% of each training fold; that split is not group-aware, but it only affects when training stops and never touches the validation folds or the test set. The dummy model sets the floor: 50% accuracy and AUC 0.5. Everything runs on the CPU.");

  // ===== 7. Results =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  head(s, "Results", "Random Forest and the neural network tie");
  const mlabs = ["Logistic Regression", "Random Forest", "Neural Network"];
  s.addChart(pres.charts.BAR, [
    { name: "Accuracy", labels: mlabs, values: [0.727, 0.734, 0.734] },
    { name: "F1", labels: mlabs, values: [0.705, 0.718, 0.719] },
    { name: "ROC-AUC", labels: mlabs, values: [0.792, 0.804, 0.804] },
  ], {
    ...chartBase(), x: M - 0.1, y: 1.95, w: 7.6, h: 4.75, barDir: "col",
    chartColors: [HEX.dk2, HEX.accent5, HEX.accent1], showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.000", dataLabelFontSize: 12, dataLabelFontBold: false,
    valAxisMinVal: 0.6, valAxisMaxVal: 0.85, valAxisMajorUnit: 0.05, valAxisLabelFormatCode: "0.00", showLegend: true, legendPos: "t", legendFontSize: 13, legendColor: HEX.dk1, barGapWidthPct: 60, objectName: "results chart",
  });
  T(s, "Test set, 13,716 records (axis starts at 0.60)", { x: M, y: 1.55, w: 7.4, h: 0.35, fontSize: 14, color: C.accent4 });
  card(s, 8.35, 1.6, 4.38, 2.2, "hero card", C.text2);
  T(s, "0.804", { x: 8.65, y: 1.75, w: 3.9, h: 1.05, fontSize: 60, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "middle" });
  T(s, "ROC-AUC, Random Forest (95% CI 0.795–0.811); accuracy 0.734 vs 0.505 dummy", { x: 8.65, y: 2.85, w: 3.85, h: 0.8, fontSize: 14, color: C.background1 });
  const res = [
    ["FaEquals", "A tie on training CV", "RF 0.7990 vs MLP 0.7985: a gap of 0.0005, well below one SE (0.002)"],
    ["FaCheck", "Simpler model wins", "Random Forest: top CV score and simpler than the MLP"],
    ["FaExclamation", "Misses ~1 in 3 cases", "Recall 0.68 at the default 0.5 threshold"],
  ];
  for (const [i, [ic, h, t]] of res.entries()) {
    const y = 4.05 + i * 0.92;
    await badge(s, 8.35, y, 0.5, ic, i === 2 ? C.accent1 : C.accent2, `${h} icon`);
    T(s, [{ text: h, options: { bold: true, color: C.text2, breakLine: true } }, { text: t, options: { fontSize: 14 } }], { x: 9.05, y: y - 0.05, w: 3.68, h: 0.85, fontSize: 15 });
  }
  s.addNotes("All metrics, confusion matrices and ROC curves are in the report and notebook. On training cross-validation Random Forest and the MLP differ by 0.0005 ROC-AUC, well below one standard error (0.002). Random Forest has the top score and is the simpler model, so the one-SE rule selects it. On the test set the two are practically identical (ROC-AUC 0.804 each, accuracy 0.734) and the bootstrap intervals overlap (RF 0.795 to 0.811, MLP 0.796 to 0.810), so neither is clearly better. Random Forest has the best Brier score; the MLP has slightly higher recall and F1. Logistic Regression is about 0.01 ROC-AUC lower. The axis starts at 0.6 to show the differences; all models are far above the 0.5 dummy.");

  // ===== 8. Feature importance =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  head(s, "Results", "Blood pressure drives the predictions");
  const imp = [["Systolic BP", 0.1860], ["Age", 0.0391], ["Cholesterol", 0.0282], ["Diastolic BP", 0.0025], ["BMI", 0.0023], ["Physical activity", 0.0015], ["Glucose", 0.0013], ["Weight", 0.0012]].reverse();
  T(s, "Permutation importance (Random Forest): drop in test ROC-AUC", { x: M, y: 1.55, w: 7.6, h: 0.35, fontSize: 14, color: C.accent4 });
  s.addChart(pres.charts.BAR, [{ name: "Drop in ROC-AUC", labels: imp.map((d) => d[0]), values: imp.map((d) => d[1]) }], {
    ...chartBase(), x: M - 0.1, y: 1.95, w: 7.7, h: 4.8, barDir: "bar",
    chartColors: imp.map((d) => (d[0] === "Systolic BP" ? HEX.accent1 : d[1] > 0.02 ? HEX.accent2 : HEX.accent5)),
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "0.000", valAxisHidden: true, valGridLine: { style: "none" }, valAxisMaxVal: 0.21, showLegend: false, barGapWidthPct: 35, objectName: "importance chart",
  });
  T(s, "5×", { x: 8.75, y: 1.6, w: 3.98, h: 1.15, fontSize: 72, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "middle" });
  T(s, "Systolic BP matters about five times more than any other feature (Δ ROC-AUC 0.19)", { x: 8.75, y: 2.8, w: 3.98, h: 0.8, fontSize: 16, color: C.text2, bold: true });
  const insights = [
    ["FaUserMd", "Then age and cholesterol", "All three models agree on this top three"],
    ["FaRunning", "Lifestyle adds almost nothing", "Activity, smoking, alcohol, gender and height each change ROC-AUC by < 0.002"],
  ];
  for (const [i, [ic, h, t]] of insights.entries()) {
    const y = 4.0 + i * 1.3;
    await badge(s, 8.75, y, 0.55, ic, C.accent2, `${h} icon`);
    T(s, [{ text: h, options: { bold: true, color: C.text2, breakLine: true } }, { text: t, options: { fontSize: 14 } }], { x: 9.5, y: y - 0.05, w: 3.23, h: 1.15, fontSize: 15 });
  }
  s.addNotes("Permutation importance shuffles one feature on the test set and measures how much ROC-AUC drops. Systolic BP dominates for every model; Logistic Regression odds ratios agree: about 2.5 times the odds per standard deviation of systolic BP. Systolic and diastolic BP are correlated and share importance, so read them together. Pulse pressure is not a model input because it equals systolic minus diastolic exactly. These describe model behaviour, not causation.");

  // ===== 9. Rigour =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Modelling" });
  head(s, "Rigour", "Three methods I revised, and checks beyond the brief");
  const revs = [
    ["Select on test ROC-AUC", "Select on training CV", "Test-set selection let the test set shape the model and inflate its scores"],
    ["Group on raw rows", "Group on model inputs", "Rounded age makes distinct raw rows identical"],
    ["Take the plain maximum", "Simplest within one SE", "The MLP led by 0.00004 in an earlier run; reported as a revision"],
  ];
  revs.forEach(([before, after, why], i) => {
    const y = 1.6 + i * 1.7;
    card(s, M, y, 7.6, 1.5, `revision ${i + 1} card`);
    dot(s, M + 0.3, y + 0.25, 0.5, String(i + 1), C.text2, 14);
    T(s, before, { x: M + 1.05, y: y + 0.2, w: 3.0, h: 0.6, fontSize: 15, color: C.accent4, strike: "sngStrike", valign: "middle" });
    T(s, "→", { x: M + 4.05, y: y + 0.2, w: 0.45, h: 0.6, fontSize: 22, bold: true, color: C.accent1, align: "center", valign: "middle" });
    T(s, after, { x: M + 4.55, y: y + 0.2, w: 2.9, h: 0.6, fontSize: 16, bold: true, color: C.text2, valign: "middle" });
    T(s, why, { x: M + 1.05, y: y + 0.85, w: 6.4, h: 0.5, fontSize: 14 });
  });
  const extras = [
    ["FaBalanceScale", "Group-bootstrap 95% CIs", "RF ROC-AUC 0.795 to 0.811"],
    ["FaUsers", "Subgroup results", "ROC-AUC 0.83 under 50 vs 0.77 at 50+"],
    ["FaChartLine", "Calibration and PR curves", "Reliability diagram, average precision, Brier"],
    ["FaClipboardCheck", "Dummy baseline and audit", "Validated loading, logged filters, split checks"],
  ];
  T(s, "BEYOND THE BRIEF", { x: 8.75, y: 1.6, w: 4, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 2 });
  for (const [i, [ic, h, t]] of extras.entries()) {
    const y = 2.1 + i * 1.18;
    await badge(s, 8.75, y, 0.55, ic, C.accent2, `${h} icon`);
    T(s, [{ text: h, options: { bold: true, color: C.text2, breakLine: true } }, { text: t, options: { fontSize: 14 } }], { x: 9.5, y: y - 0.05, w: 3.23, h: 1.0, fontSize: 15 });
  }
  s.addNotes("The brief asks for accuracy, precision, recall, F1 and confusion matrices. Left: three methods I revised and why. Selecting by test-set score leaks the test set into the modelling decision. Grouping on raw values missed records that only become identical after rounding. The one-SE rule was adopted after seeing a tie in an earlier run, and I report it as a revision rather than presenting it as planned. I also removed pulse pressure from the model inputs, because it equals systolic minus diastolic, and excluded the two records where systolic equals diastolic. Right: analyses beyond the brief: group-bootstrap confidence intervals, subgroup results, calibration and precision-recall curves, and a dummy baseline.");

  // ===== 10. RQ answers =====
  pres.addSection({ title: "Conclusions" });
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conclusions" });
  head(s, "Conclusions", "Answers to the research questions");
  const ans = [
    ["Significant factors", "Systolic and diastolic BP, age, cholesterol, BMI and glucose (all p < 0.001)"],
    ["Demographics", "Age strongly linked (24% → 67%); gender not significant"],
    ["Lifestyle", "Activity weakly protective; smoking and alcohol effects tiny and likely biased"],
    ["Predictive value", "Systolic BP, age and cholesterol provide nearly all predictive power"],
    ["Model choice", "~73% accuracy, ROC-AUC 0.80; RF and MLP tie, so the simpler Random Forest is chosen"],
  ];
  ans.forEach(([h, t], i) => {
    const y = 1.6 + i * 1.03;
    card(s, M, y, 8.4, 0.88, `RQ${i + 1} answer card`);
    T(s, `RQ${i + 1}`, { x: M + 0.25, y, w: 0.85, h: 0.88, fontSize: 20, bold: true, color: i === 4 ? C.accent1 : C.accent2, fontFace: THEME.headFontFace, valign: "middle" });
    T(s, h, { x: M + 1.15, y, w: 2.15, h: 0.88, fontSize: 16, bold: true, color: C.text2, valign: "middle" });
    T(s, t, { x: M + 3.35, y, w: 4.9, h: 0.88, fontSize: 14, valign: "middle" });
  });
  card(s, 9.3, 1.6, 3.43, 5.0, "final model card", C.text2);
  await badge(s, 9.6, 1.95, 0.8, "FaTree", C.accent1, "final model icon");
  T(s, [
    { text: "FINAL MODEL", options: { fontSize: 12, bold: true, color: C.accent3, charSpacing: 2, breakLine: true } },
    { text: "Random Forest", options: { fontSize: 30, bold: true, color: C.background1, fontFace: THEME.headFontFace } },
  ], { x: 9.6, y: 3.0, w: 2.9, h: 1.5, valign: "top" });
  T(s, "Chosen by the one-SE rule. Use Logistic Regression when explanation matters most.", { x: 9.6, y: 4.6, w: 2.9, h: 1.6, fontSize: 15, color: C.background1 });
  s.addNotes("Summarise each answer in one sentence. Emphasise RQ5: the neural network adds nothing over Random Forest, and both gain only about 0.01 ROC-AUC over Logistic Regression, so a simpler, explainable model is the defensible choice.");

  // ===== 11. Implications / limitations / future =====
  s = pres.addSlide({ masterName: "CONTENT", sectionTitle: "Conclusions" });
  head(s, "Conclusions", "What it means, where it falls short, what comes next");
  const aw = 3.88, ag = 0.29;
  const cols3 = [
    ["FaLightbulb", "Implications", C.accent1, [
      "Prioritise blood pressure, cholesterol and weight control, especially over 50",
      "Cheap routine measurements could support low-cost screening",
      "For screening, lower the threshold to catch more cases",
    ]],
    ["FaExclamationTriangle", "Limitations", C.text2, [
      "~2% removed by study filters; results do not cover excluded patients",
      "Coarse 3-level lab values; self-reported lifestyle",
      "Unknown population and CVD definition; cross-sectional, so not causal",
      "Weaker at age 50+ (ROC-AUC 0.77 vs 0.83)",
    ]],
    ["FaRocket", "Next steps", C.accent2, [
      "Add family history, medication, lipid and ECG data",
      "Try gradient boosting with threshold tuning and calibration",
      "Validate externally; SHAP for patient-level explanations",
    ]],
  ];
  for (const [i, [ic, h, col, items]] of cols3.entries()) {
    const x = M + i * (aw + ag);
    card(s, x, 1.6, aw, 5.1, `${h} card`);
    await badge(s, x + 0.3, 1.9, 0.7, ic, col, `${h} icon`);
    T(s, h, { x: x + 1.2, y: 1.9, w: aw - 1.4, h: 0.7, fontSize: 20, bold: true, color: C.text2, valign: "middle" });
    T(s, items.map((t, j) => ({ text: t, options: { bullet: true, breakLine: j < items.length - 1 } })), { x: x + 0.3, y: 2.9, w: aw - 0.6, h: 3.6, fontSize: 15, paraSpaceAfter: 12 });
  }
  s.addNotes("The model is a screening aid, not a diagnostic tool. The selection rule was adopted after a tie was seen in an earlier run, which is reported as a revision. The ~73% ceiling suggests key predictors are missing from this dataset. Some papers report 87%+ on this data, but that depends heavily on undocumented preprocessing; with standard cleaning, results like ours (around 73%) are typical.");

  // ===== 12. Close =====
  s = pres.addSlide({ masterName: "DARK", sectionTitle: "Conclusions" });
  T(s, "KEY TAKEAWAYS", { x: M, y: 0.7, w: 6, h: 0.35, fontSize: 13, bold: true, color: C.accent1, charSpacing: 2 });
  const take = [
    ["Clean before you model", "Implausible values hide behind “0 missing”"],
    ["Blood pressure leads", "Then age and cholesterol; lifestyle adds little"],
    ["Simple is enough", "~73% accuracy, ROC-AUC 0.80; Random Forest matches a neural network"],
  ];
  take.forEach(([h, t], i) => {
    const y = 1.35 + i * 1.25;
    T(s, `0${i + 1}`, { x: M, y, w: 1.1, h: 1.0, fontSize: 40, bold: true, color: C.accent1, fontFace: THEME.headFontFace, valign: "top" });
    T(s, [{ text: h, options: { fontSize: 22, bold: true, color: C.background1, fontFace: THEME.headFontFace, breakLine: true } }, { text: t, options: { fontSize: 16, color: C.accent5 } }], { x: M + 1.3, y: y + 0.05, w: 6.6, h: 1.05 });
  });
  T(s, "Questions?", { x: 8.6, y: 1.9, w: 4.13, h: 1.4, fontSize: 48, bold: true, color: C.background1, fontFace: THEME.headFontFace, align: "right", valign: "middle" });
  T(s, "Notebook ready to run live", { x: 8.6, y: 3.3, w: 4.13, h: 0.4, fontSize: 16, color: C.accent5, align: "right" });
  ecg(s, 0, 5.4, W, 1.25, HEX.accent1, 3, "closing ECG trace");
  s.addNotes("Recap the three takeaways, then invite questions. Be ready to open the notebook and run cells: load_data, the quality audit, clean(), the split assertion, the selection rule and the model comparison. The full notebook runs in about 2 minutes on the CPU.");

  await pres.writeFile({ fileName: OUT });
  await applyTheme(OUT, THEME);
  console.log("wrote", OUT);
})();
