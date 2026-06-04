import { describe, it, expect, beforeAll } from 'vitest'
import { encryptKey, decryptKey } from './crypto'

beforeAll(() => {
  process.env.JWT_SECRET = 'test-secret-for-crypto-tests'
})

describe('encryptKey / decryptKey', () => {
  it('round-trips a value correctly', () => {
    const original = 'sk-my-api-key-12345'
    const encrypted = encryptKey(original)
    expect(encrypted).not.toBe(original)
    expect(decryptKey(encrypted)).toBe(original)
  })

  it('produces different ciphertext each time (random IV)', () => {
    const key = 'same-key'
    const a = encryptKey(key)
    const b = encryptKey(key)
    expect(a).not.toBe(b)
    // but both decrypt to the same value
    expect(decryptKey(a)).toBe(key)
    expect(decryptKey(b)).toBe(key)
  })

  it('ciphertext contains colon separator for IV', () => {
    const encrypted = encryptKey('test')
    expect(encrypted).toContain(':')
  })

  it('round-trips an empty string', () => {
    const encrypted = encryptKey('')
    expect(decryptKey(encrypted)).toBe('')
  })
})
