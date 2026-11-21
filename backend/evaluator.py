"""Evaluation agent.

`evaluate()` is the single entry point. The current implementation is a MOCK
(keyword-coverage heuristic). To plug in a real LLM, replace the body of
`evaluate()` and keep the returned shape unchanged.
"""
import re
import unicodedata
from pathlib import Path


def _norm(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def extract_text(path: str) -> str:
    p = Path(path)
    ext = p.suffix.lower()
    try:
        if ext == ".pdf":
            from pypdf import PdfReader
            return "\n".join((pg.extract_text() or "") for pg in PdfReader(p).pages)
        if ext == ".docx":
            import docx
            return "\n".join(par.text for par in docx.Document(p).paragraphs)
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""


def evaluate(text: str, syllabus: dict) -> dict:
    low = _norm(text)
    words = len(re.findall(r"\w+", low))
    results, total, weights = [], 0.0, 0
    for crit in syllabus["criteria"]:
        kws = [_norm(k) for k in crit.get("keywords", [])]
        found = [k for k in kws if k in low]
        ratio = len(found) / len(kws) if kws else (1.0 if words > 200 else 0.5)
        score = round(ratio * 100)
        missing = [k for k in kws if k not in found]
        results.append({
            "criterion": crit["title"],
            "weight": crit["weight"],
            "score": score,
            "evidence": f"Termes détectés : {', '.join(found)}" if found else "Aucun élément détecté.",
            "suggestion": f"Ajouter du contenu sur : {', '.join(missing)}." if missing else "Conforme.",
        })
        total += score * crit["weight"]
        weights += crit["weight"]
    overall = round(total / weights) if weights else 0
    if words < 150:
        summary = "Le document est très court ou illisible ; vérifier le fichier."
    elif overall >= syllabus["pass_score"]:
        summary = "Le support respecte globalement les exigences du syllabus."
    else:
        summary = "Le support ne satisfait pas encore les exigences du syllabus."
    return {
        "overall": overall,
        "passed": overall >= syllabus["pass_score"],
        "summary": summary,
        "criteria": results,
        "word_count": words,
        "engine": "mock-keyword-v1",
    }
