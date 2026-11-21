export const getToken = () => localStorage.getItem('token')

export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = { Authorization: `Bearer ${getToken() || ''}` }
  let payload
  if (form) payload = form
  else if (body) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body) }
  const res = await fetch(`/api${path}`, { method, headers, body: payload })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.detail || `Erreur ${res.status}`)
  }
  return res.json()
}
