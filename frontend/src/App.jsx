import { useEffect, useState } from 'react'
import { Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import { api, getToken } from './api'
import Login from './pages/Login'
import { ProfSubmissions, NewSubmission } from './pages/ProfPages'
import { CoordSubmissions, Syllabi } from './pages/CoordPages'
import SubmissionDetail from './pages/SubmissionDetail'

const NAV = {
  prof: [
    ['/supports', 'Mes supports'],
    ['/supports/nouveau', 'Proposer un support'],
  ],
  coordinator: [
    ['/soumissions', 'Soumissions'],
    ['/syllabus', 'Syllabus & critères'],
  ],
}

export default function App() {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    if (!getToken()) return setReady(true)
    api('/me').then(setUser).catch(() => localStorage.removeItem('token')).finally(() => setReady(true))
  }, [])

  if (!ready) return null
  if (!user) return <Login onLogin={(u) => { setUser(u); nav(u.role === 'prof' ? '/supports' : '/soumissions') }} />

  const home = user.role === 'prof' ? '/supports' : '/soumissions'
  const logout = () => { localStorage.removeItem('token'); setUser(null); nav('/') }
  const initials = user.name.split(' ').map((w) => w[0]).slice(0, 2).join('')

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">ÉCOLE MAROCAINE DES SCIENCES DE L'INGÉNIEUR</div>
        <div className="who">
          <span className="avatar">{initials}</span>
          <div><strong>{user.name}</strong><small>{user.role === 'prof' ? 'Professeur' : 'Coordinateur'}</small></div>
        </div>
      </header>
      <aside className="sidebar">
        <div className="section">{user.role === 'prof' ? 'ESPACE PROFESSEUR' : 'ESPACE COORDINATEUR'}</div>
        {NAV[user.role].map(([to, label]) => (
          <NavLink key={to} to={to} end className={({ isActive }) => (isActive ? 'active' : '')}>{label}</NavLink>
        ))}
        <button className="logout" onClick={logout}>Déconnexion</button>
      </aside>
      <main>
        <Routes>
          {user.role === 'prof' ? (
            <>
              <Route path="/supports" element={<ProfSubmissions />} />
              <Route path="/supports/nouveau" element={<NewSubmission />} />
              <Route path="/supports/:id" element={<SubmissionDetail user={user} />} />
            </>
          ) : (
            <>
              <Route path="/soumissions" element={<CoordSubmissions />} />
              <Route path="/soumissions/:id" element={<SubmissionDetail user={user} />} />
              <Route path="/syllabus" element={<Syllabi />} />
            </>
          )}
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </main>
    </div>
  )
}
