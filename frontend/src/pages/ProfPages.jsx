import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { SubmissionTable } from './CoordPages'

export function ProfSubmissions() {
  const [rows, setRows] = useState([])
  useEffect(() => { api('/submissions').then(setRows) }, [])
  return (
    <>
      <h1>Mes supports de cours</h1>
      <div className="card">
        <p className="muted">Suivez l'état de vos supports proposés.</p>
        <SubmissionTable rows={rows} base="/supports" hideProf />
        {!rows.length && <p className="muted">Aucun support. <Link to="/supports/nouveau">Proposer un support</Link></p>}
      </div>
    </>
  )
}

export function NewSubmission() {
  const [syllabi, setSyllabi] = useState([])
  const [title, setTitle] = useState('')
  const [sid, setSid] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  useEffect(() => { api('/syllabi').then((s) => { setSyllabi(s); if (s[0]) setSid(s[0].id) }) }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (!file) return setErr('Veuillez joindre un fichier (PDF, DOCX ou TXT).')
    const form = new FormData()
    form.append('title', title); form.append('syllabus_id', sid); form.append('notes', notes); form.append('file', file)
    try { const r = await api('/submissions', { method: 'POST', form }); nav(`/supports/${r.id}`) }
    catch (x) { setErr(x.message) }
  }

  return (
    <>
      <h1>Proposer un support de cours</h1>
      <form className="card form" onSubmit={submit}>
        <label>Titre du support<input required value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label>Module / Syllabus
          <select value={sid} onChange={(e) => setSid(e.target.value)}>
            {syllabi.map((s) => <option key={s.id} value={s.id}>{s.module}</option>)}
          </select>
        </label>
        <label>Notes pour le coordinateur<textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></label>
        <label>Fichier<input type="file" accept=".pdf,.docx,.txt" onChange={(e) => setFile(e.target.files[0])} /></label>
        {err && <div className="error">{err}</div>}
        <button className="btn">Soumettre</button>
      </form>
    </>
  )
}
