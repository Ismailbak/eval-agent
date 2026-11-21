import json
import os
import secrets
import shutil
from datetime import datetime
from typing import List, Optional

from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import db
import evaluator
import syllabus_import

app = FastAPI(title="EMSI Évaluation des supports")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
db.init()
TOKENS: dict = {}


def current_user(authorization: str = Header(default="")):
    uid = TOKENS.get(authorization.replace("Bearer ", ""))
    if not uid:
        raise HTTPException(401, "Non authentifié")
    with db.conn() as c:
        return dict(c.execute("SELECT id,email,name,role FROM users WHERE id=?", (uid,)).fetchone())


def require(role):
    def dep(u=Depends(current_user)):
        if u["role"] != role:
            raise HTTPException(403, "Accès refusé")
        return u
    return dep


class Login(BaseModel):
    email: str
    password: str


@app.post("/api/login")
def login(b: Login):
    with db.conn() as c:
        u = c.execute("SELECT id,email,name,role FROM users WHERE email=? AND password=?", (b.email, b.password)).fetchone()
    if not u:
        raise HTTPException(401, "Identifiants invalides")
    t = secrets.token_hex(16)
    TOKENS[t] = u["id"]
    return {"token": t, "user": dict(u)}


@app.get("/api/me")
def me(u=Depends(current_user)):
    return u


# ---------- Syllabi ----------
class Criterion(BaseModel):
    title: str
    description: str = ""
    keywords: List[str] = []
    weight: int = 10


class SyllabusIn(BaseModel):
    module: str
    description: str = ""
    criteria: List[Criterion]
    pass_score: int = 70


def syl_row(r):
    d = dict(r)
    d["criteria"] = json.loads(d["criteria"])
    return d


@app.get("/api/syllabi")
def list_syllabi(u=Depends(current_user)):
    with db.conn() as c:
        return [syl_row(r) for r in c.execute("SELECT * FROM syllabi ORDER BY id DESC")]


@app.post("/api/syllabi/import")
def import_syllabus(file: UploadFile = File(...), u=Depends(require("coordinator"))):
    if not file.filename.lower().endswith(".docx"):
        raise HTTPException(400, "Format attendu : .docx")
    path = db.UPLOAD_DIR / f"syllabus_{secrets.token_hex(6)}.docx"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        return syllabus_import.parse(str(path))
    except Exception:
        raise HTTPException(422, "Document illisible")


@app.post("/api/syllabi")
def create_syllabus(b: SyllabusIn, u=Depends(require("coordinator"))):
    with db.conn() as c:
        cur = c.execute(
            "INSERT INTO syllabi(coordinator_id,module,description,criteria,pass_score) VALUES(?,?,?,?,?)",
            (u["id"], b.module, b.description, json.dumps([x.model_dump() for x in b.criteria]), b.pass_score),
        )
        return syl_row(c.execute("SELECT * FROM syllabi WHERE id=?", (cur.lastrowid,)).fetchone())


@app.put("/api/syllabi/{sid}")
def update_syllabus(sid: int, b: SyllabusIn, u=Depends(require("coordinator"))):
    with db.conn() as c:
        c.execute(
            "UPDATE syllabi SET module=?,description=?,criteria=?,pass_score=? WHERE id=?",
            (b.module, b.description, json.dumps([x.model_dump() for x in b.criteria]), b.pass_score, sid),
        )
        return syl_row(c.execute("SELECT * FROM syllabi WHERE id=?", (sid,)).fetchone())


# ---------- Submissions ----------
def sub_row(r):
    d = dict(r)
    d["evaluation"] = json.loads(d["evaluation"]) if d["evaluation"] else None
    d.pop("stored_path", None)
    return d


SUB_SQL = """SELECT s.*, u.name AS prof_name, y.module AS module FROM submissions s
JOIN users u ON u.id=s.prof_id JOIN syllabi y ON y.id=s.syllabus_id"""


@app.post("/api/submissions")
def submit(
    title: str = Form(...), syllabus_id: int = Form(...), notes: str = Form(""),
    file: UploadFile = File(...), u=Depends(require("prof")),
):
    path = db.UPLOAD_DIR / f"{secrets.token_hex(6)}_{file.filename}"
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    with db.conn() as c:
        cur = c.execute(
            "INSERT INTO submissions(prof_id,syllabus_id,title,notes,filename,stored_path,created_at) VALUES(?,?,?,?,?,?,?)",
            (u["id"], syllabus_id, title, notes, file.filename, str(path), datetime.now().isoformat(timespec="minutes")),
        )
        return sub_row(c.execute(SUB_SQL + " WHERE s.id=?", (cur.lastrowid,)).fetchone())


@app.get("/api/submissions")
def list_submissions(u=Depends(current_user)):
    q, args = SUB_SQL, ()
    if u["role"] == "prof":
        q, args = q + " WHERE s.prof_id=?", (u["id"],)
    with db.conn() as c:
        return [sub_row(r) for r in c.execute(q + " ORDER BY s.id DESC", args)]


def get_sub(c, sid, u):
    r = c.execute(SUB_SQL + " WHERE s.id=?", (sid,)).fetchone()
    if not r or (u["role"] == "prof" and r["prof_id"] != u["id"]):
        raise HTTPException(404, "Introuvable")
    return r


@app.get("/api/submissions/{sid}")
def get_submission(sid: int, u=Depends(current_user)):
    with db.conn() as c:
        return sub_row(get_sub(c, sid, u))


@app.post("/api/submissions/{sid}/evaluate")
def run_evaluation(sid: int, u=Depends(require("coordinator"))):
    with db.conn() as c:
        r = get_sub(c, sid, u)
        syl = syl_row(c.execute("SELECT * FROM syllabi WHERE id=?", (r["syllabus_id"],)).fetchone())
        result = evaluator.evaluate(evaluator.extract_text(r["stored_path"]), syl)
        c.execute("UPDATE submissions SET evaluation=?, status='évalué' WHERE id=?", (json.dumps(result), sid))
        return sub_row(c.execute(SUB_SQL + " WHERE s.id=?", (sid,)).fetchone())


class Decision(BaseModel):
    status: str  # validé | à corriger
    comment: str = ""


@app.post("/api/submissions/{sid}/decision")
def decide(sid: int, b: Decision, u=Depends(require("coordinator"))):
    if b.status not in ("validé", "à corriger"):
        raise HTTPException(400, "Statut invalide")
    with db.conn() as c:
        get_sub(c, sid, u)
        c.execute("UPDATE submissions SET status=?, decision_comment=? WHERE id=?", (b.status, b.comment, sid))
        return sub_row(c.execute(SUB_SQL + " WHERE s.id=?", (sid,)).fetchone())


@app.delete("/api/submissions/{sid}")
def delete_submission(sid: int, u=Depends(require("coordinator"))):
    with db.conn() as c:
        r = get_sub(c, sid, u)
        c.execute("DELETE FROM submissions WHERE id=?", (sid,))
    try:
        os.remove(r["stored_path"])
    except OSError:
        pass
    return {"deleted": sid}
