import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export const Badge = ({ status }) => {
  const cls = { 'soumis': 'blue', 'évalué': 'amber', 'validé': 'green', 'à corriger': 'red' }[status]
  return <span className={`badge ${cls}`}>{status}</span>
}

export function SubmissionTable({ rows, base, hideProf }) {
  if (!rows.length) return null
  return (
    <table>
      <thead><tr><th>Titre</th>{!hideProf && <th>Professeur</th>}<th>Module</th><th>Date</th><th>Score IA</th><th>Statut</th></tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td><Link to={`${base}/${r.id}`}>{r.title}</Link></td>
            {!hideProf && <td>{r.prof_name}</td>}
            <td>{r.module}</td>
            <td>{r.created_at.replace('T', ' ')}</td>
            <td>{r.evaluation ? `${r.evaluation.overall}%` : '—'}</td>
            <td><Badge status={r.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function CoordSubmissions() {
  const [rows, setRows] = useState([])
  const [filter, setFilter] = useState('')
  useEffect(() => { api('/submissions').then(setRows) }, [])
  const shown = filter ? rows.filter((r) => r.status === filter) : rows
  return (
    <>
      <h1>Soumissions des professeurs</h1>
      <div className="card">
        <div className="seg">
          {['', 'soumis', 'évalué', 'validé', 'à corriger'].map((f) => (
            <button key={f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>{f || 'Tous'}</button>
          ))}
        </div>
        <SubmissionTable rows={shown} base="/soumissions" />
        {!shown.length && <p className="muted">Aucune soumission.</p>}
      </div>
    </>
  )
}

const blank = { module: '', description: '', pass_score: 70, criteria: [{ title: '', description: '', keywords: [], weight: 25 }] }

export function Syllabi() {
  const [list, setList] = useState([])
  const [edit, setEdit] = useState(null)
  const [open, setOpen] = useState({}) // syllabus id -> criteria expanded
  const load = () => api('/syllabi').then(setList)
  useEffect(() => { load() }, [])

  const save = async () => {
    const body = { ...edit }
    await api(edit.id ? `/syllabi/${edit.id}` : '/syllabi', { method: edit.id ? 'PUT' : 'POST', body })
    setEdit(null); load()
  }
  const importDoc = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    const form = new FormData(); form.append('file', f)
    try { setEdit(await api('/syllabi/import', { method: 'POST', form })) } catch (x) { alert(x.message) }
    e.target.value = ''
  }
  const setCrit = (i, patch) => setEdit({ ...edit, criteria: edit.criteria.map((c, j) => (j === i ? { ...c, ...patch } : c)) })

  if (edit) {
    const total = edit.criteria.reduce((a, c) => a + Number(c.weight || 0), 0)
    return (
      <>
        <h1>{edit.id ? 'Modifier le syllabus' : 'Nouveau syllabus'}</h1>
        <div className="card form">
          <label>Module<input value={edit.module} onChange={(e) => setEdit({ ...edit, module: e.target.value })} /></label>
          <label>Description<input value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
          <label>Score minimum de validation (%)<input type="number" value={edit.pass_score} onChange={(e) => setEdit({ ...edit, pass_score: +e.target.value })} /></label>
          <h3>Critères d'évaluation <small className={total === 100 ? 'muted' : 'error-text'}>(total pondération : {total}/100)</small></h3>
          {edit.criteria.map((c, i) => (
            <div className="crit" key={i}>
              <input placeholder="Titre" value={c.title} onChange={(e) => setCrit(i, { title: e.target.value })} />
              <input placeholder="Description" value={c.description} onChange={(e) => setCrit(i, { description: e.target.value })} />
              <input placeholder="Mots-clés (séparés par des virgules)" value={c.keywords.join(', ')}
                onChange={(e) => setCrit(i, { keywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })} />
              <input type="number" title="Poids" value={c.weight} onChange={(e) => setCrit(i, { weight: +e.target.value })} />
              <button className="btn ghost" onClick={() => setEdit({ ...edit, criteria: edit.criteria.filter((_, j) => j !== i) })}>Retirer</button>
            </div>
          ))}
          <button className="btn ghost" onClick={() => setEdit({ ...edit, criteria: [...edit.criteria, { title: '', description: '', keywords: [], weight: 10 }] })}>Ajouter un critère</button>
          <div className="row"><button className="btn" onClick={save}>Enregistrer</button><button className="btn ghost" onClick={() => setEdit(null)}>Annuler</button></div>
        </div>
      </>
    )
  }

  return (
    <>
      <h1>Syllabus & critères</h1>
      <div className="row">
        <button className="btn" onClick={() => setEdit(structuredClone(blank))}>Nouveau syllabus</button>
        <label className="btn ghost filebtn">Importer un descriptif de module (.docx)<input type="file" accept=".docx" hidden onChange={importDoc} /></label>
      </div>
      {list.map((s) => (
        <div className="card" key={s.id}>
          <div className="row between"><h3>{s.module}</h3><button className="btn ghost" onClick={() => setEdit(structuredClone(s))}>Modifier</button></div>
          <p className="muted">{s.description} · seuil {s.pass_score}%</p>
          <button className={`collapse-toggle ${open[s.id] ? 'open' : ''}`} aria-expanded={!!open[s.id]}
            onClick={() => setOpen({ ...open, [s.id]: !open[s.id] })}>
            <span className="chev" />
            Critères d'évaluation ({s.criteria.length})
          </button>
          <div className={`collapse ${open[s.id] ? 'open' : ''}`}>
            <div>
              <ul className="crit-list">
                {s.criteria.map((c, i) => <li key={i}><strong>{c.title}</strong> <span className="w">{c.weight}%</span><div className="muted">{c.description}</div></li>)}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
