import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { Badge } from './CoordPages'
import { AnalysisPanel, ScoreRing } from './EvalAnimation'

export default function SubmissionDetail({ user }) {
  const { id } = useParams()
  const [s, setS] = useState(null)
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState(null) // result held back while the analysis animation plays
  const [fetched, setFetched] = useState(false)
  const [comment, setComment] = useState('')
  const [confirmDel, setConfirmDel] = useState(false)
  const nav = useNavigate()
  const isCoord = user.role === 'coordinator'

  useEffect(() => { api(`/submissions/${id}`).then(setS) }, [id])
  if (!s) return null

  const run = async () => {
    setBusy(true); setPending(null); setFetched(false)
    try { setPending(await api(`/submissions/${id}/evaluate`, { method: 'POST' })); setFetched(true) }
    catch (x) { setBusy(false); alert(x.message) }
  }
  const finish = () => { setS(pending); setPending(null); setBusy(false) }
  const decide = async (status) => setS(await api(`/submissions/${id}/decision`, { method: 'POST', body: { status, comment } }))
  const remove = async () => { await api(`/submissions/${id}`, { method: 'DELETE' }); nav('/soumissions') }
  const ev = s.evaluation

  return (
    <>
      <h1>{s.title}</h1>
      <div className="card">
        <div className="row between">
          <div className="muted">{s.prof_name} · {s.module} · {s.filename} · {s.created_at.replace('T', ' ')}</div>
          <Badge status={s.status} />
        </div>
        {s.notes && <p><em>Notes : {s.notes}</em></p>}
        {isCoord && (
          <div className="row">
            {!confirmDel ? (
              <button className="btn ghost danger-text" onClick={() => setConfirmDel(true)}>Supprimer la soumission</button>
            ) : (
              <>
                <span className="error">Supprimer définitivement cette soumission et son fichier ?</span>
                <button className="btn danger" onClick={remove}>Confirmer la suppression</button>
                <button className="btn ghost" onClick={() => setConfirmDel(false)}>Annuler</button>
              </>
            )}
          </div>
        )}
        {s.decision_comment && <div className="note">Commentaire du coordinateur : {s.decision_comment}</div>}
      </div>

      <div className="card">
        <div className="row between">
          <h3>Évaluation de l'agent IA</h3>
          {isCoord && <button className="btn" disabled={busy} onClick={run}>{busy ? 'Analyse en cours' : ev ? 'Relancer' : "Lancer l'évaluation"}</button>}
        </div>
        {busy && <AnalysisPanel title={s.title} filename={s.filename} result={fetched ? pending : null} onDone={finish} />}
        {!busy && !ev && <p className="muted">Pas encore évalué.</p>}
        {!busy && ev && (
          <div key="result" className="reveal">
            <div className="result-head">
              <ScoreRing value={ev.overall} passed={ev.passed} />
              <div>
                <p className="summary">{ev.summary}</p>
                <small className="muted">{ev.word_count} mots analysés · moteur {ev.engine}</small>
              </div>
            </div>
            <table>
              <thead><tr><th>Critère</th><th>Poids</th><th>Score</th><th>Preuves</th><th>Suggestion</th></tr></thead>
              <tbody>
                {ev.criteria.map((c, i) => (
                  <tr key={c.criterion} className="rise" style={{ animationDelay: `${0.5 + i * 0.07}s` }}>
                    <td>{c.criterion}</td><td>{c.weight}%</td>
                    <td><div className="bar"><div style={{ '--w': `${c.score}%`, animationDelay: `${0.6 + i * 0.07}s` }} /></div>{c.score}%</td>
                    <td>{c.evidence}</td><td>{c.suggestion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isCoord && ev && (
        <div className="card form">
          <h3>Décision du coordinateur</h3>
          <textarea rows={3} placeholder="Commentaire pour le professeur" value={comment} onChange={(e) => setComment(e.target.value)} />
          <div className="row">
            <button className="btn" onClick={() => decide('validé')}>Valider</button>
            <button className="btn danger" onClick={() => decide('à corriger')}>Demander des corrections</button>
          </div>
        </div>
      )}
    </>
  )
}
