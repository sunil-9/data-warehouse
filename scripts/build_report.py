import json
from pathlib import Path
from docx import Document
from docx.shared import Cm,Pt,RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.enum.text import WD_ALIGN_PARAGRAPH
r=json.loads(Path('reports/notebook_results.json').read_text())
n=json.loads(Path('NIT6160_Cardio_Project.ipynb').read_text())
doc=Document();sec=doc.sections[0]
sec.top_margin=sec.bottom_margin=sec.left_margin=sec.right_margin=Cm(2)
sec.page_width=Cm(21);sec.page_height=Cm(29.7)
for name in ['Normal','Title','Subtitle','Heading 1','Heading 2','Caption']:
 st=doc.styles[name];st.font.name='Calibri';st.font.color.rgb=RGBColor(0,0,0)
 st.paragraph_format.line_spacing=1.5
 st.paragraph_format.space_after=Pt(6)
doc.styles['Normal'].font.size=Pt(11)
doc.styles['Title'].font.size=Pt(20)
doc.styles['Heading 1'].font.size=Pt(14)
doc.styles['Heading 2'].font.size=Pt(12)
doc.styles['Caption'].paragraph_format.left_indent=Cm(0)
doc.styles['Caption'].paragraph_format.right_indent=Cm(0)
doc.styles['Caption'].paragraph_format.first_line_indent=Cm(0)
# Remove inherited decorative title borders from the default template.
for style in doc.styles:
 if style.element.pPr is not None:
  for border in list(style.element.pPr.findall(qn('w:pBdr'))):
   style.element.pPr.remove(border)
def p(t):return doc.add_paragraph(t)
def h(t):doc.add_heading(t,level=1)
def table(headers,rows):
 t=doc.add_table(rows=1, cols=len(headers));t.style='Table Grid'
 for c,v in zip(t.rows[0].cells,headers):c.text=str(v)
 for row in rows:
  for c,v in zip(t.add_row().cells,row):c.text=str(v)
 for i,row in enumerate(t.rows):
  for c in row.cells:
   for para in c.paragraphs:
    para.paragraph_format.line_spacing=1.5;para.paragraph_format.space_after=Pt(4);para.paragraph_format.space_before=Pt(4)
    for run in para.runs:run.font.size=Pt(11);run.bold=i==0
   if i==0:
    shade=OxmlElement('w:shd');shade.set(qn('w:fill'),'E7EDF2');c._tc.get_or_add_tcPr().append(shade)
  prop=row._tr.get_or_add_trPr()
  prop.append(OxmlElement('w:cantSplit'))
  if i==0:prop.append(OxmlElement('w:tblHeader'))
 return t
def fig(name,caption,width=16):
 path=Path('figures')/name
 if path.exists():
  para=doc.add_paragraph();para.add_run().add_picture(str(path),width=Cm(width))
  para.paragraph_format.keep_with_next=True
  doc.add_paragraph(caption,style='Caption')
sel=r['selected_model'];scores=r['test'][sel]
doc.add_paragraph('Explainable Cardiovascular Disease Classification',style='Title')
p('Using routine clinical and lifestyle indicators')
p('Sunil Sapkota | s8206069 | NIT6160 Data Warehousing and Mining | H8W4 2026')
h('1 Introduction and objectives')
p('This project investigates whether routine demographic, examination and lifestyle indicators can classify recorded cardiovascular disease status. It compares Logistic Regression, Random Forest and a multilayer perceptron neural network using a public dataset of 70,000 records [1]. The emphasis is on transparent preprocessing, a reproducible comparison and explanations that distinguish association from causation. The problem is relevant to health awareness in Nepal and India, but the dataset is not established as representative of either population.')
p('Lipid health provides an accessible motivation for the topic. However, triglycerides are not measured in this dataset. Cholesterol and glucose are three-level categories, rather than measured concentrations. Consequently, the analysis cannot assess triglycerides specifically, predict a future heart attack or provide a clinically validated risk percentage.')
p(f'The selected model is {sel}, chosen using training cross-validation ROC-AUC before comparing held-out scores. Its internal test accuracy is {scores["Accuracy"]:.3f}, ROC-AUC is {scores["ROC-AUC"]:.3f} and recall is {scores["Recall"]:.3f}. These results support further research rather than immediate clinical deployment.')
h('2 Dataset selection')
p('The Kaggle Cardiovascular Disease dataset contains 70,000 rows and 13 columns: a record identifier, 11 input variables and a binary outcome, cardio [1]. Age is stored in days, height in centimetres, weight in kilograms and blood pressure in mmHg. The semicolon-separated file is validated before analysis. The original population, recruitment protocol, exact diagnostic definition and outcome timing require stronger documentation. A unique record ID is not proof of a unique patient. Lecturer confirmation of dataset suitability remains an administrative requirement and is not asserted as completed.')
table(['Group','Variables','Meaning'],[['Demographic','age, gender','Age in days; documented gender codes'],['Body measurements','height, weight','Measurements used to derive BMI'],['Clinical','ap_hi, ap_lo, cholesterol, gluc','Blood pressure and ordinal lab categories'],['Lifestyle','smoke, alco, active','Binary reported indicators'],['Outcome','cardio','Recorded disease presence or absence']])
h('3 Literature survey and research questions')
p('Bhatt et al. [2] studied the same 70,000-record dataset using k-modes clustering and tuned classifiers, including Random Forest, XGBoost and MLP. They reported their highest cross-validated accuracy of 87.28% with MLP. This motivates comparing linear and nonlinear models, but their clustering and preprocessing differ from this study. Their headline scores are not a like-for-like benchmark, and this project does not attribute score differences to a single cause.')
p('Kahraman [3] examined integrated healthcare data using multiple machine learning methods. The study motivates testing tabular nonlinear approaches and considering broader sources of health information. Combining sources can change outcome definitions and cohort composition, so a reported gain does not demonstrate improvement on this project’s unchanged cardiovascular dataset. This project therefore uses a single documented source and clearly identifies its analysis population.')
p('Sadr et al. [4] combined CNN/LSTM, KNN and XGBoost predictions through voting. They evaluated two public datasets and a local dataset. Their 70,000-record source was reduced to 62,267 observations after preprocessing. This illustrates how cleaning policies alter the study population. The study motivates comparing model complexity, while its results cannot establish the safety or transportability of this project’s models. Independent local validation remains necessary.')
p('The resulting research questions are: RQ1, which recorded factors are most associated with disease status? RQ2, how does status vary by age and recorded gender? RQ3, what associations appear for smoking, alcohol and activity? RQ4, which inputs contribute most to model predictions? RQ5, which classifier gives the strongest balance of internal predictive performance and interpretability? These questions connect descriptive analysis to modelling without claiming a causal explanation or future-event forecast.')
h('4 Exploration and preprocessing')
e=r['exclusions']
p(f'The raw data has no missing cells. Target counts are 35,021 without recorded disease and 34,979 with recorded disease, making the sample approximately balanced. There are 24 exact duplicate records when the identifier is excluded, 41 repeated raw predictor profiles and 17 raw profiles with conflicting labels. Identical input values can arise from different people, so duplicate handling is an explicit analysis choice rather than proof of a recording error.')
p('The notebook reports means, medians, modes, variance, standard deviation, ranges, interquartile ranges, skewness and kurtosis. Raw blood-pressure extremes, including negative and very large values, warrant review. Statistical outliers are not automatically clinical errors: discarding every IQR outlier could remove genuine high measurements. Instead, this analysis applies fixed study inclusion filters and reports the exclusions. The filters are not presented as universally valid physiological boundaries.')
table(['Step','Records removed or retained'],[['Raw records',70000],['Exact duplicates removed',e['exact duplicate records removed']],['Blood pressure filters removed',e['implausible blood pressure removed']],['Body measurement filters removed',e['implausible height/weight/BMI removed']],['Invalid code filters removed',e['invalid category codes removed']],['Final retained records',e['final rows']]])
p('The blood-pressure filters retain systolic values from 80 to 250 and diastolic values from 40 to 160, with diastolic no higher than systolic. Body filters retain height from 120 to 220, weight from 30 to 200 and BMI from 10 to 70. Although these remove obvious recording problems, some excluded extremes may be genuine. A future sensitivity analysis should compare justified policies and report performance for excluded groups where possible.')
p('Feature engineering converts age to years, derives BMI and pulse pressure, and recodes gender. The resulting model has 13 predictors. Rounded age and BMI can make previously distinct raw rows identical at the model input. To avoid this leakage route, the group identifier is calculated from the final engineered inputs, not the unrounded raw values. Scaling for Logistic Regression and MLP is fitted inside each training fold. No test data is used to fit scaling parameters.')
fig('02_histograms.png','Figure 1 Distributions of retained measurements by recorded disease status')
h('5 Visualisation and associations')
stats=r['descriptive_statistics']
table(['Variable','Mean','Median','Variance','SD'],[[key,*[f'{value[k]:.2f}' for k in ['mean','median','var','std']]] for key,value in stats.items()])
p('Table values describe the retained cohort. Blood pressure is in mmHg, body measurements use cm and kg, and age is in years. Variance is in squared units; SD is in the original variable units. Mean and median differ more for weight and BMI than age, consistent with the observed right tails. These summaries guide preprocessing and interpretation rather than determine automatic row exclusions.')
p('Histograms, target-group box plots, categorical proportions, ordered age and BMI plots, scatter plots and a correlation matrix describe the data. The notebook includes the complete figures and association tests. Blood pressure, age and cholesterol show stronger separation than the binary lifestyle variables. Within this selected cohort, disease-positive proportions rise across higher cholesterol categories. These sample proportions are not population prevalence estimates for Nepal, India or the recruitment country.')
p('Chi-square tests and Mann–Whitney tests accompany effect sizes, because a large sample can produce small p-values for weak associations. The tests are exploratory and do not adjust for confounding or multiple comparisons. Counter-intuitive smoking or alcohol associations must not be interpreted as protective effects. Self-report error, selection, confounding and behaviour changes after diagnosis are possible explanations, not mechanisms established by these records.')
fig('04_prevalence_categorical.png','Figure 2 Disease-positive proportions within the retained sample by categorical indicator')
h('6 Models and evaluation design')
p('Logistic Regression supplies a relatively transparent baseline. Random Forest models nonlinear patterns and interactions without requiring standardisation. MLP tests whether a flexible neural model provides enough improvement to justify reduced interpretability. A prior-probability dummy classifier gives a reference that useful models should outperform. All models use the same cohort and partitions, with a fixed seed of 42 [5].')
p(f'The group-aware split produces {r["split"]["train"]:,} training rows and {r["split"]["test"]:,} test rows. Five-fold stratified group cross-validation is used within training. Logistic Regression uses grid search, while Random Forest and MLP each use a bounded four-candidate randomized search. Candidate counts and ranges are recorded in the notebook. This is a finite search, not proof of globally optimal settings. Some MLP candidate fits reached the 300-iteration limit, so convergence remains an optimisation limitation. MLP internal early stopping is disabled so its random internal split does not bypass the group policy.')
p('The model family is selected by its best training cross-validation ROC-AUC. Test scores do not change that selection. Re-scoring tuned settings on the same folds is reported only as a post-selection diagnostic; it is not nested cross-validation or an unbiased robustness estimate. Earlier versions of the repository exposed test outcomes, so this remains an exploratory internal comparison rather than a pristine confirmatory evaluation. A fresh external cohort is needed for a stronger claim.')
table(['Model','Selected settings'],[[name,', '.join(f'{k.replace("clf__", "")}={v}' for k,v in params.items())] for name,params in r['best_params'].items()])
table(['Model','Training CV selection AUC'],[[k,f'{v:.4f}'] for k,v in r['selection_cv_scores'].items()])
p('The held-out comparison reports accuracy, precision, recall, F1, ROC-AUC, average precision, Brier score and confusion matrices. The classification threshold remains 0.5. Brier score evaluates squared probability error and reflects both discrimination and calibration; it cannot alone establish good calibration. The reliability diagram supplements Brier score with observed-versus-predicted proportions. It is an internal diagnostic, not evidence that the scores are calibrated for another population. Repeated model development should not use these test results to optimise features or thresholds.')
h('7 Results and model interpretation')
table(['Model','Accuracy','Precision','Recall','F1','AUC'],[[k.replace('Neural Network (MLP)','MLP'),*[f'{v[m]:.3f}' for m in ['Accuracy','Precision','Recall','F1','ROC-AUC']]] for k,v in r['test'].items()])
p(f'{sel} was selected on training CV, with a test ROC-AUC of {scores["ROC-AUC"]:.3f}. The small AUC gap between the nonlinear models is not evidence of statistically significant superiority. Its recall of {scores["Recall"]:.3f} means approximately {(1-scores["Recall"])*100:.1f}% of positive test records are missed at the default threshold. This is a material limitation for any proposed screening workflow. A deployment threshold would require a defined follow-up capacity and an explicit trade-off between missed positives and unnecessary follow-up, selected on development data.')
fig('08_confusion_matrices.png','Figure 3 Confusion matrices at the fixed classification threshold')
p('The notebook compares standardised Logistic Regression coefficients, Random Forest impurity importance and permutation importance. These explain model behaviour rather than independent causal effects. Pulse pressure is derived from systolic and diastolic pressure, and BMI from weight and height. Their dependence complicates individual coefficient interpretation. Permuting a derived variable independently can create physically inconsistent combinations; correlated inputs can also mask each other’s contribution. Interpret importance rankings as conditional diagnostics and read related variables together.')
fig('11_feature_importance.png','Figure 4 Coefficient and feature importance diagnostics with correlated inputs')
p('RQ1 and RQ4 are addressed by the association and importance analyses: blood pressure, age and cholesterol are informative in this dataset. RQ2 is addressed by the age and recorded-gender comparisons, without inferring code meanings from average height. RQ3 is addressed through reported lifestyle proportions and exploratory tests; small or unexpected associations do not establish prevention effects. RQ5 is answered by the common-partition model comparison and training-CV selection. The simpler linear model remains useful when the additional predictive value of a more complex model is small.')
h('8 Uncertainty and subgroup diagnostics')
ci=r['group_bootstrap_95_ci'][sel]
table(['Selected model metric','Point estimate','95 percent interval'],[[key,f'{scores[key]:.3f}',f'{bounds[0]:.3f} to {bounds[1]:.3f}'] for key,bounds in ci.items()])
p('The percentile intervals use 300 bootstrap resamples of final-input groups, keeping identical profiles together. They are conditional on this fitted model and selected test cohort. They do not include uncertainty from training, filter choice or deployment in a new setting. Overlapping intervals and the small model gaps caution against describing one nonlinear model as definitively superior.')
table(['Group','N','Positive','Recall','AUC'],[[item['Group'],item['N'],item['Positive cases'],f"{item['Recall']:.3f}",f"{item['ROC-AUC']:.3f}"] for item in r['subgroups']])
p('These group-specific results make aggregate accuracy more transparent. Age groups and recorded gender groups can differ in baseline disease frequency, case mix and score distributions. Differences in recall or AUC warrant investigation, but this descriptive analysis does not prove discrimination or equitable clinical outcomes. Subgroup metrics should be reassessed with uncertainty and adequate local samples before deployment.')
fig('12_probability_diagnostics.png','Figure 5 Reliability and precision recall diagnostics for the internally evaluated models')
table(['Model','Average precision','Brier score'],[[name,f"{item['Avg precision']:.3f}",f"{item['Brier']:.3f}"] for name,item in r['test'].items()])
p('The precision-recall curve shows how sensitivity and positive predictive value trade off across thresholds. The horizontal reference is the positive fraction in this test sample, not population prevalence. No threshold is selected from this figure. Reliability curves show whether predicted and observed fractions align within quantile bins; finite bins and an unrepresentative cohort limit interpretation.')
h('9 Limitations implications and conclusion')
p('The principal limitations are uncertain provenance and diagnosis definition, cross-sectional labels, coarse self-reported variables and selection introduced by the filters. No TG measurement, follow-up period, medication detail or independent clinical outcome assessment is available. The grouped split prevents identical engineered inputs crossing partitions but cannot establish patient-level independence. Small fold variation and similar internal test scores do not prove absence of overfitting, fairness or geographic transportability.')
p('For a research prototype, the workflow could support a demonstration of validated inputs, an experimental classification score and model explanations. It does not establish a medical diagnosis or treatment recommendation. Before live clinical use, the next steps are representative local data collection, independent external validation, calibration, subgroup evaluation and prospective workflow assessment. Commercial redistribution and dataset reuse terms also require verification. These requirements matter more than presenting an unusually high accuracy score to prospective investors.')
p('The project demonstrates a reproducible comparison of three classifiers on a large public health dataset while retaining nearly 98% of records. Its central contribution is a transparent evaluation workflow, including grouping after feature engineering and selecting the model without test-score optimisation. The evidence supports a useful academic analysis and a research demonstration. It does not yet support deployment as a validated cardiovascular screening product.')
h('References')
refs=[
'[1] S. Ulianova, “Cardiovascular Disease dataset,” Kaggle, 2019. [Online]. Available: https://www.kaggle.com/datasets/sulianova/cardiovascular-disease-dataset',
'[2] C. M. Bhatt, P. Patel, T. Ghetia, and P. L. Mazzeo, “Effective heart disease prediction using machine learning techniques,” Algorithms, vol. 16, no. 2, Art. no. 88, 2023, doi: 10.3390/a16020088.',
'[3] A. Kahraman, “Machine learning techniques for improved prediction of cardiovascular diseases using integrated healthcare data,” Frontiers in Artificial Intelligence, vol. 8, Art. no. 1694450, 2025, doi: 10.3389/frai.2025.1694450.',
'[4] H. Sadr, A. Salari, M. T. Ashoobi, and M. Nazari, “Cardiovascular disease diagnosis: a holistic approach using the integration of machine learning and deep learning models,” European Journal of Medical Research, vol. 29, Art. no. 455, 2024, doi: 10.1186/s40001-024-02044-7.',
'[5] F. Pedregosa et al., “Scikit-learn: Machine learning in Python,” Journal of Machine Learning Research, vol. 12, pp. 2825–2830, 2011.'
]
for ref in refs:p(ref)
# Keep all table borders explicit and light grey.
for t_index, t in enumerate(doc.tables):
 if len(t.rows) <= 7:
  for row in list(t.rows)[:-1]:
   for cell in row.cells:
    for paragraph in cell.paragraphs:
     paragraph.paragraph_format.keep_with_next=True
 pr=t._tbl.tblPr
 borders=OxmlElement('w:tblBorders')
 for edge in ['top','left','bottom','right','insideH','insideV']:
  v=OxmlElement('w:'+edge);v.set(qn('w:val'),'single');v.set(qn('w:sz'),'4');v.set(qn('w:color'),'D9D9D9');borders.append(v)
 pr.append(borders)
for paragraph in doc.paragraphs:
 if paragraph.style.name.startswith('Heading'):paragraph.paragraph_format.keep_with_next=True
out=Path('NIT6160_Cardio_Project_Report.docx');doc.save(out)
print('Saved',out,'Words',sum(len(x.text.split()) for x in doc.paragraphs))
