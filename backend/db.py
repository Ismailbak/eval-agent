import json
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / "app.db"
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)


def conn():
    c = sqlite3.connect(DB_PATH)
    c.row_factory = sqlite3.Row
    return c


SCHEMA = """
CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, role TEXT);
CREATE TABLE IF NOT EXISTS syllabi(
  id INTEGER PRIMARY KEY, coordinator_id INTEGER, module TEXT, description TEXT,
  criteria TEXT, pass_score INTEGER DEFAULT 70);
CREATE TABLE IF NOT EXISTS submissions(
  id INTEGER PRIMARY KEY, prof_id INTEGER, syllabus_id INTEGER, title TEXT, notes TEXT,
  filename TEXT, stored_path TEXT, status TEXT DEFAULT 'soumis', created_at TEXT,
  evaluation TEXT, decision_comment TEXT);
"""

DEFAULT_CRITERIA = [
    {"title": "Objectifs pédagogiques", "description": "Les objectifs d'apprentissage sont clairement énoncés.", "keywords": ["objectif", "compétence", "acquis"], "weight": 20},
    {"title": "Couverture du programme", "description": "Les chapitres du syllabus sont couverts.", "keywords": ["chapitre", "plan", "programme", "sommaire"], "weight": 30},
    {"title": "Exemples et exercices", "description": "Le support contient des exemples, TD/TP et exercices.", "keywords": ["exemple", "exercice", "tp", "td"], "weight": 25},
    {"title": "Évaluation et références", "description": "Modalités d'évaluation et bibliographie présentes.", "keywords": ["évaluation", "examen", "bibliographie", "référence"], "weight": 25},
]

MOCK_SYLLABI = [
    {
        "module": "M214 - Bases de Données Relationnelles",
        "description": "Génie Informatique, semestre 3 - module disciplinaire de 60 h (cours, TD, TP).",
        "pass_score": 70,
        "criteria": [
            {"title": "Objectifs et compétences visées", "description": "Objectifs, prérequis (algorithmique, programmation) et compétences à acquérir.", "keywords": ["objectif", "competence", "prerequis"], "weight": 10},
            {"title": "Modélisation conceptuelle", "description": "Modèle entité-association, cardinalités, passage au modèle relationnel.", "keywords": ["entite", "association", "cardinalite", "merise", "uml"], "weight": 20},
            {"title": "Modèle relationnel et normalisation", "description": "Clés, dépendances fonctionnelles, formes normales, algèbre relationnelle.", "keywords": ["cle primaire", "dependance", "forme normale", "algebre relationnelle"], "weight": 20},
            {"title": "Langage SQL", "description": "LDD, LMD, jointures, sous-requêtes, agrégats, vues.", "keywords": ["select", "jointure", "group by", "sous-requete", "vue"], "weight": 20},
            {"title": "Transactions et optimisation", "description": "Propriétés ACID, concurrence, index, plans d'exécution.", "keywords": ["transaction", "acid", "index", "concurrence"], "weight": 10},
            {"title": "Travaux pratiques et études de cas", "description": "TP sur un SGBD et mini-projet de conception.", "keywords": ["tp", "exercice", "mini-projet", "etude de cas"], "weight": 10},
            {"title": "Évaluation et références", "description": "Modalités d'évaluation et bibliographie.", "keywords": ["evaluation", "examen", "bibliographie", "reference"], "weight": 10},
        ],
    },
    {
        "module": "M121 - Mécanique des Sols",
        "description": "Génie Civil, semestre 4 - module disciplinaire de 56 h (cours, TD, TP de laboratoire).",
        "pass_score": 65,
        "criteria": [
            {"title": "Objectifs et compétences visées", "description": "Objectifs, prérequis (RDM, géologie) et compétences à acquérir.", "keywords": ["objectif", "competence", "prerequis"], "weight": 10},
            {"title": "Identification et classification des sols", "description": "Granulométrie, limites d'Atterberg, classification LCPC / USCS.", "keywords": ["granulometrie", "atterberg", "classification", "teneur en eau"], "weight": 20},
            {"title": "Hydraulique des sols", "description": "Perméabilité, loi de Darcy, écoulements, contraintes effectives.", "keywords": ["permeabilite", "darcy", "contrainte effective", "ecoulement"], "weight": 20},
            {"title": "Compressibilité et consolidation", "description": "Essai oedométrique, tassements, théorie de Terzaghi.", "keywords": ["oedometre", "tassement", "consolidation", "terzaghi"], "weight": 20},
            {"title": "Résistance au cisaillement", "description": "Critère de Mohr-Coulomb, essais triaxial et boîte de cisaillement.", "keywords": ["mohr", "coulomb", "cohesion", "cisaillement", "triaxial"], "weight": 15},
            {"title": "Travaux pratiques et applications", "description": "Essais de laboratoire et exercices de dimensionnement.", "keywords": ["tp", "essai", "exercice", "application"], "weight": 5},
            {"title": "Évaluation et références", "description": "Modalités d'évaluation et bibliographie.", "keywords": ["evaluation", "examen", "bibliographie", "reference"], "weight": 10},
        ],
    },
]


def init():
    with conn() as c:
        c.executescript(SCHEMA)
        if not c.execute("SELECT 1 FROM users").fetchone():
            c.executemany(
                "INSERT INTO users(email,password,name,role) VALUES(?,?,?,?)",
                [
                    ("prof@emsi.ma", "prof123", "Professeur Démo", "prof"),
                    ("coord@emsi.ma", "coord123", "Coordinateur Démo", "coordinator"),
                ],
            )
            c.execute(
                "INSERT INTO syllabi(coordinator_id,module,description,criteria,pass_score) VALUES(2,?,?,?,70)",
                ("Language de Programmation", "Syllabus 1APT - Semestre 1", json.dumps(DEFAULT_CRITERIA)),
            )
        c.execute("UPDATE users SET name='Professeur Démo' WHERE email='prof@emsi.ma' AND name<>'Professeur Démo'")
        sample = Path(__file__).parent.parent / "documents" / "evaluation criteria.docx"
        old = c.execute("SELECT id FROM syllabi WHERE module='Language de Programmation'").fetchone()
        if old and sample.exists():  # replace the placeholder demo syllabus with the real sample descriptif
            import syllabus_import
            d = syllabus_import.parse(str(sample))
            c.execute("UPDATE syllabi SET module=?, description=?, criteria=?, pass_score=? WHERE id=?",
                      (d["module"], d["description"], json.dumps(d["criteria"]), d["pass_score"], old["id"]))
        for m in MOCK_SYLLABI:  # idempotent: only inserted when missing
            if not c.execute("SELECT 1 FROM syllabi WHERE module=?", (m["module"],)).fetchone():
                c.execute(
                    "INSERT INTO syllabi(coordinator_id,module,description,criteria,pass_score) VALUES(2,?,?,?,?)",
                    (m["module"], m["description"], json.dumps(m["criteria"]), m["pass_score"]),
                )
