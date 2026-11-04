from pathlib import Path
from typing import Literal
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field, model_validator

HERE = Path(__file__).resolve().parent
app = FastAPI(title='Cardio Explorer — academic demo')
app.mount('/static', StaticFiles(directory=HERE / 'static'), name='static')
app.mount('/reports', StaticFiles(directory=HERE.parent / 'reports'), name='reports')
_bundle = None

def bundle():
    global _bundle
    if _bundle is None:
        path = HERE / 'artifacts/model.joblib'
        if not path.exists():
            raise HTTPException(503, 'Model not prepared. Run python web/prepare.py first.')
        _bundle = joblib.load(path)
    return _bundle

class Inputs(BaseModel):
    age_years: float = Field(ge=0, le=120, allow_inf_nan=False)
    gender: Literal[1, 2]
    height: float = Field(ge=120, le=220, allow_inf_nan=False)
    weight: float = Field(ge=30, le=200, allow_inf_nan=False)
    ap_hi: float = Field(ge=80, le=250, allow_inf_nan=False)
    ap_lo: float = Field(ge=40, le=160, allow_inf_nan=False)
    cholesterol: Literal[1, 2, 3]
    gluc: Literal[1, 2, 3]
    smoke: Literal[0, 1]
    alco: Literal[0, 1]
    active: Literal[0, 1]

    @model_validator(mode='after')
    def consistent(self):
        if self.ap_lo >= self.ap_hi:
            raise ValueError('Diastolic pressure must be below systolic pressure.')
        if not 10 <= self.weight / (self.height / 100) ** 2 <= 70:
            raise ValueError('BMI lies outside the study inclusion range (10–70).')
        return self

@app.get('/')
def index():
    return FileResponse(HERE / 'static/index.html')

@app.get('/api/model')
def model_info():
    return bundle()['metadata']

@app.post('/api/predict')
def predict(inputs: Inputs):
    b = bundle()
    lo, hi = b['metadata']['age_range']
    if not lo <= inputs.age_years <= hi:
        raise HTTPException(422, f'Age is outside the study range ({lo}–{hi} years). No prediction is provided.')
    data = inputs.model_dump()
    data['age_years'] = float(pd.Series([inputs.age_years]).round(1).iloc[0])
    data['male'] = int(inputs.gender == 2)
    data['bmi'] = float(pd.Series([inputs.weight / (inputs.height / 100) ** 2]).round(2).iloc[0])
    X = pd.DataFrame([data])[b['metadata']['features']]
    score = float(b['model'].predict_proba(X)[0, 1])
    return {'classification': int(score >= b['metadata']['threshold']), 'model_score': score, 'threshold': b['metadata']['threshold'], 'bmi': data['bmi'], 'pulse_pressure': inputs.ap_hi - inputs.ap_lo, 'message': 'Research classification only. This score is not a diagnosis, disease severity, or validated future cardiovascular risk.'}
