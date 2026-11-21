"""Builds a draft evaluation syllabus from an EMSI 'Descriptif du module' (.docx).

The result is only a DRAFT: the coordinator reviews and edits it in the UI.
"""
import re
import unicodedata
from collections import Counter

import docx

STOP = set("""avec dans pour entre leur leurs cette ainsi tels telles dont sont etre fait faire plus
moins selon ceux celles ainsi lors chaque autres autre comme aussi pendant apres avant depuis vers
sous sans tout toute tous toutes elements element partie introduction etude principes principaux ponts pont differents differentes structures presentation exploration compris aspects integration definition methodes classification processus fonction application""".split())


def norm(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s.lower()) if unicodedata.category(c) != "Mn")


def words(s: str, minlen=6):
    return [w for w in re.findall(r"[a-z]+", norm(s)) if len(w) >= minlen and w not in STOP]


def _cells(d):
    seen = []  # keep references: id() of short-lived proxies can be recycled
    for t in d.tables:
        for r in t.rows:
            for c in r.cells:
                if any(c._tc is x for x in seen):
                    continue
                seen.append(c._tc)
                yield c.text.strip()


def parse(path: str) -> dict:
    d = docx.Document(path)
    cells = list(_cells(d))

    module = ""
    for i, c in enumerate(cells):
        if norm(c).startswith("intitule du module") and i + 1 < len(cells) and cells[i + 1]:
            module = cells[i + 1]
            break
    number = next((cells[i + 1] for i, c in enumerate(cells) if "ordre du module" in norm(c) and i + 1 < len(cells)), "")

    comp = next((c for c in cells if "COMPETENCES A ACQUERIR" in c.upper().replace("É", "E")), "")
    comp_lines = []
    if comp:
        part = re.split(r"COMP[ÉE]TENCES A ACQU[ÉE]RIR", comp, flags=re.I)[-1]
        comp_lines = [l.strip() for l in part.split("\n") if len(l.strip()) > 25 and not l.strip().startswith("(")]
    comp_kw = [w for w, _ in Counter(w for l in comp_lines for w in words(l, 7)).most_common(6)]

    content = next((c for c in cells if re.search(r"^\s*[ÉE]l[ée]ment\s*1", c, re.I | re.M)), "")
    groups, cur = [], None
    for line in content.split("\n"):
        line = line.strip()
        if m := re.match(r"^\d+\s*[-.)]\s*(.+)", line):
            cur = {"title": m.group(1).strip(" ."), "body": []}
            groups.append(cur)
        elif cur and line:
            cur["body"].append(line)

    criteria = [{
        "title": "Objectifs et compétences visées",
        "description": "Le support énonce les objectifs, les prérequis et les compétences à acquérir du module.",
        "keywords": ["objectif", "competence", "prerequis"] + comp_kw[:3],
        "weight": 15,
    }]
    n = len(groups)
    pool = 55
    for g in groups:
        kws = list(dict.fromkeys(words(g["title"], 5)))[:3]
        kws += [w for w, _ in Counter(w for l in g["body"] for w in words(l, 7)).most_common(2) if w not in kws]
        criteria.append({
            "title": g["title"],
            "description": "Contenu prévu au descriptif : " + (g["body"][0] if g["body"] else g["title"]),
            "keywords": kws[:5],
            "weight": max(1, pool // n) if n else 0,
        })
    if n:  # distribute the rounding remainder so weights total exactly 100
        for i in range(pool - sum(c["weight"] for c in criteria[1:])):
            criteria[1 + i % n]["weight"] += 1
    criteria += [
        {"title": "Applications, TD/TP et exemples", "description": "Exemples, exercices, travaux dirigés/pratiques ou projet d'application.",
         "keywords": ["exemple", "exercice", "application", "projet"], "weight": 15},
        {"title": "Évaluation et références", "description": "Modalités d'évaluation et bibliographie.",
         "keywords": ["evaluation", "examen", "bibliographie", "reference"], "weight": 15},
    ]
    return {
        "module": f"{number} - {module}".strip(" -") if module else "Module importé",
        "description": "Brouillon généré depuis le descriptif du module ; à vérifier par le coordinateur.",
        "pass_score": 70,
        "criteria": criteria,
    }
