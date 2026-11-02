# NIT6160 cardiovascular disease project

**Sunil Sapkota — s8206069**

## Submission files

Submit only:

1. `NIT6160_Cardio_Project.ipynb`
2. `NIT6160_Cardio_Project_Report.docx`

The notebook is the single analysis implementation. It contains the full code and embedded outputs; it does not import repository modules. If `cardio_train.csv` is not beside the notebook, it downloads the public dataset from an immutable GitHub commit and checks SHA-256. Internet access is therefore needed to rerun without a local CSV. No CSV, figures folder, source folder, JSON, ZIP or whole project needs to be submitted. The brief separately lists a presentation; these two deliverables follow the current requested file scope.

## Reproduce

Install `requirements.txt` in a virtual environment, open the notebook in Jupyter, then choose Restart and Run All. Tuning may take several minutes depending on hardware. Generated figures and JSON are outputs, not extra submission inputs. To rebuild the Word report after a completed notebook run, run `python scripts/build_report.py` from the repository root.

## Review changes

- Removed the redundant `src/` baseline, extra EDA notebook and superseded baseline reports.
- Grouped final engineered inputs before splitting to prevent identical rounded profiles crossing train and test.
- Selected model family using training cross-validation, not test scores.
- Kept three tuned models and the dummy reference, with accuracy, precision, recall, F1, ROC-AUC, average precision and Brier score.
- Added group-bootstrap uncertainty, subgroup counts/metrics, reliability diagrams and precision-recall curves.
- Added student identification and aligned the report with current results and three journal papers.

Validation: fixed best-parameter refits reproduced every saved test metric for all three models. New diagnostics executed successfully. Original search outputs were retained; this is not described as a fresh independent validation study.

## Data and boundaries

Kaggle source: https://www.kaggle.com/datasets/sulianova/cardiovascular-disease-dataset

70,000 raw records; 68,583 retained under explicit study filters. The outcome is recorded disease presence, not a future heart attack. There is no triglyceride variable, and geographic provenance is insufficient for claims of local validity in Nepal or India. Reuse terms, external validation, calibration and workflow evaluation must be addressed before any clinical or commercial deployment. Lecturer approval must be confirmed by the student; the report does not invent it.
