const BASE = ''  // proxy Vite aponta /api → localhost:3001

function getToken() {
  return localStorage.getItem('token')
}

export async function apiGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Não autorizado') }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Erro na requisição') }
  return res.json()
}

export async function apiPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  })
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Não autorizado') }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Erro na requisição') }
  return res.json()
}

export async function apiPut<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  })
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Não autorizado') }
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Erro') }
  return res.json()
}

export async function apiPatch<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
    body: JSON.stringify(body),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Erro') }
  return res.json()
}

export async function apiDelete<T = unknown>(url: string): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error((e as { error?: string }).error ?? 'Erro') }
  return res.json()
}
