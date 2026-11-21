import { useEffect, useRef, useState } from 'react'

const STAGES = [
  'Lecture du document',
  'Extraction du texte et de la structure',
  'Mise en correspondance avec le syllabus',
  'Notation critère par critère',
  'Synthèse et recommandations',
]
const LINES = [92, 100, 78, 96, 60, 100, 88, 70, 94, 100, 82, 56, 90, 98, 74, 40]

/** Plays the analysis sequence. `result` may arrive at any time; the animation waits for it at stage 3. */
export function AnalysisPanel({ title, filename, result, onDone }) {
  const [stage, setStage] = useState(0)
  const [ci, setCi] = useState(0)
  const crits = result?.evaluation?.criteria || []
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    let t
    if (stage < 3) t = setTimeout(() => setStage(stage + 1), 1000)
    else if (stage === 3 && result) {
      if (ci < crits.length) t = setTimeout(() => setCi(ci + 1), 380)
      else t = setTimeout(() => setStage(4), 500)
    } else if (stage === 4) t = setTimeout(() => done.current(), 1100)
    return () => clearTimeout(t)
  }, [stage, ci, result, crits.length])

  const progress = stage < 3 ? (stage + 1) * 14 : stage === 3 ? 44 + (crits.length ? (ci / crits.length) * 44 : 0) : 100

  return (
    <div className="analysis">
      <div className="doc" aria-hidden>
        <div className="doc-head">{filename}</div>
        {LINES.map((w, i) => (
          <div key={i} className="doc-line" style={{ width: `${w}%`, animationDelay: `${(i / LINES.length) * 2.4}s` }} />
        ))}
        <div className="beam" />
      </div>

      <div className="steps">
        <h3>Analyse en cours</h3>
        <p className="muted">{title}</p>
        <ol>
          {STAGES.map((s, i) => {
            const state = i < stage ? 'done' : i === stage ? 'active' : 'todo'
            return (
              <li key={s} className={state}>
                <span className="mark">{state === 'done' ? '' : state === 'active' ? <i className="spin" /> : ''}</span>
                <div>
                  {s}
                  {i === 3 && stage === 3 && (
                    <div className="live">
                      {crits.slice(0, ci).map((c) => (
                        <div key={c.criterion} className="live-row">
                          <span>{c.criterion}</span><b className={c.score >= 70 ? 'g' : c.score >= 50 ? 'a' : 'r'}>{c.score}%</b>
                        </div>
                      )).slice(-4)}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
        <div className="progress"><div style={{ width: `${progress}%` }} /></div>
      </div>
    </div>
  )
}

export function useCountUp(target, ms = 1400) {
  const [v, setV] = useState(0)
  useEffect(() => {
    let raf, start
    const tick = (t) => {
      start ??= t
      const p = Math.min(1, (t - start) / ms)
      setV(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function ScoreRing({ value, passed }) {
  const n = useCountUp(value)
  const R = 62, C = 2 * Math.PI * R
  return (
    <div className={`ring ${passed ? 'ok' : 'ko'}`}>
      <svg viewBox="0 0 150 150">
        <circle className="ring-bg" cx="75" cy="75" r={R} />
        <circle className="ring-fg" cx="75" cy="75" r={R} strokeDasharray={C}
          style={{ '--c': C, '--off': C * (1 - value / 100) }} />
      </svg>
      <div className="ring-n">{n}<small>%</small></div>
      <div className="ring-l">{passed ? 'Conforme' : 'Non conforme'}</div>
    </div>
  )
}
