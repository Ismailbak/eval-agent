import { useEffect, useState } from 'react'
import { api } from '../api'

const VALUES = [
  ['Excellence', "Des supports de cours rigoureux, alignés sur les exigences pédagogiques de chaque module."],
  ['Rigueur', "Une évaluation transparente, fondée sur des critères explicites définis par les coordinateurs."],
  ['Innovation', "Un agent d'analyse assiste les coordinateurs et fournit aux enseignants un retour rapide et précis."],
  ['Engagement', "Un suivi clair du dépôt à la validation, au service de la qualité de la formation."],
]

function Splash() {
  return (
    <div className="splash">
      <img src="/emsi-logo.png" alt="EMSI" />
      <div className="splash-bar"><div /></div>
    </div>
  )
}

export default function Login({ onLogin }) {
  const [splash, setSplash] = useState(() => !sessionStorage.getItem('splashSeen'))
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!splash) return
    const t = setTimeout(() => { sessionStorage.setItem('splashSeen', '1'); setSplash(false) }, 2400)
    return () => clearTimeout(t)
  }, [splash])

  const submit = async (e) => {
    e.preventDefault()
    try {
      const r = await api('/login', { method: 'POST', body: { email, password } })
      localStorage.setItem('token', r.token)
      onLogin(r.user)
    } catch (x) { setErr(x.message) }
  }

  if (splash) return <Splash />

  return (
    <div className="login-split">
      <section className="login-about">
        <img src="/emsi-logo.png" alt="EMSI" className="about-logo" />
        <h1>Plateforme d'évaluation des supports de cours</h1>
        <p className="lead">
          Une plateforme dédiée à la qualité pédagogique de l'École Marocaine des Sciences de l'Ingénieur :
          les enseignants déposent leurs supports de cours, les coordinateurs les évaluent au regard du syllabus
          avec l'appui d'un agent d'analyse.
        </p>
        <div className="values">
          {VALUES.map(([t, d]) => (
            <div key={t}><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
        <small className="about-foot">Membre de Honoris United Universities</small>
      </section>

      <section className="login-form-side">
        <form onSubmit={submit}>
          <h2>Connexion</h2>
          <p className="muted">Accédez à votre espace professeur ou coordinateur.</p>
          <label>Adresse email<input value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></label>
          <label>Mot de passe<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {err && <div className="error">{err}</div>}
          <button className="btn">Se connecter</button>
          <div className="hint">
            Démo : <a href="#" onClick={(e) => { e.preventDefault(); setEmail('prof@emsi.ma'); setPassword('prof123') }}>professeur</a>
            {' · '}
            <a href="#" onClick={(e) => { e.preventDefault(); setEmail('coord@emsi.ma'); setPassword('coord123') }}>coordinateur</a>
          </div>
        </form>
      </section>
    </div>
  )
}
