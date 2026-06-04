import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock prisma before importing the route
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { authRoutes } from './auth'
import { prisma } from '../../src/lib/prisma.js'

const mockUser = prisma.user as {
  findUnique: ReturnType<typeof vi.fn>
  create: ReturnType<typeof vi.fn>
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.JWT_SECRET = 'test-secret'
})

describe('POST /login', () => {
  it('returns 400 for invalid body', async () => {
    const req = new Request('http://localhost/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email', password: '123' }),
    })
    const res = await authRoutes.request('/login', req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when user does not exist', async () => {
    mockUser.findUnique.mockResolvedValue(null)

    const res = await authRoutes.request('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', password: 'password123' }),
    })
    expect(res.status).toBe(401)
  })
})

describe('POST /register', () => {
  it('returns 400 for invalid body', async () => {
    const res = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bad', password: '123', name: 'X' }),
    })
    expect(res.status).toBe(400)
  })

  it('returns 409 when email already exists', async () => {
    mockUser.findUnique.mockResolvedValue({ id: '1', email: 'exists@test.com' })

    const res = await authRoutes.request('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'exists@test.com', password: 'password123', name: 'Teste' }),
    })
    expect(res.status).toBe(409)
  })
})
