const BASE = '' // proxy Vite aponta /api → localhost:3001

function getToken() {
  return localStorage.getItem('token')
}

function networkUnavailable(): Error {
  return new Error('Servidor indisponível. Verifique se a API está rodando.')
}

async function extractError(res: Response): Promise<Error> {
  const e = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
  if (res.status === 503 && e.code === 'DATABASE_UNAVAILABLE') {
    return new Error(e.error ?? 'Banco de dados indisponível.')
  }
  return new Error(e.error ?? 'Erro na requisição')
}

export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  }).catch(() => {
    throw networkUnavailable()
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Não autorizado')
  }
  if (!res.ok) throw await extractError(res)
  return res.json()
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  }).catch(() => {
    throw networkUnavailable()
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Não autorizado')
  }
  if (!res.ok) throw await extractError(res)
  return res.json()
}

export async function apiPut<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  }).catch(() => {
    throw networkUnavailable()
  })
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('Não autorizado')
  }
  if (!res.ok) throw await extractError(res)
  return res.json()
}

export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  }).catch(() => {
    throw networkUnavailable()
  })
  if (!res.ok) throw await extractError(res)
  return res.json()
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  }).catch(() => {
    throw networkUnavailable()
  })
  if (!res.ok) throw await extractError(res)
  return res.json()
}
