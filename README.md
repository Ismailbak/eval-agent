# Évaluation des supports de cours

Application web à deux interfaces : les professeurs déposent leurs supports de cours, les coordinateurs les font évaluer par un agent d'analyse au regard du syllabus du module.

## Lancer

```
cd backend  && pip install -r requirements.txt && python -m uvicorn main:app --port 8000
cd frontend && npm install && npm run dev      # http://localhost:5173
```

Comptes de démonstration : `prof@emsi.ma` / `prof123` et `coord@emsi.ma` / `coord123`.

## Structure

- `backend/` : API FastAPI, SQLite, import de syllabus (.docx), agent d'évaluation (`evaluator.py`, moteur à mots-clés interchangeable).
- `frontend/` : interface React (Vite).
- `presentation/` : présentation PowerPoint (`build.js` la régénère).

## Limites connues

Évaluation par mots-clés (prototype), authentification de démonstration, formats PDF/DOCX/TXT uniquement. Voir la présentation pour la feuille de route.
