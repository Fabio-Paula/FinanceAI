import { describe, it, expect } from 'vitest'
import { formatCurrency, formatDate, formatDateTime, cn } from './utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('handles conditional classes', () => {
    const condition = false
    expect(cn('base', condition && 'hidden', 'visible')).toBe('base visible')
  })
})

describe('formatCurrency', () => {
  it('formats positive number as BRL', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1.234,56')
    expect(result).toContain('R$')
  })

  it('formats zero', () => {
    expect(formatCurrency(0)).toContain('0,00')
  })

  it('formats negative number', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500,00')
  })

  it('accepts a numeric string', () => {
    const result = formatCurrency('2500.00')
    expect(result).toContain('2.500,00')
  })

  it('returns zero for NaN input', () => {
    const result = formatCurrency('abc')
    expect(result).toContain('0,00')
  })
})

describe('formatDate', () => {
  it('formats ISO date string as DD/MM/YYYY', () => {
    expect(formatDate('2026-06-15')).toBe('15/06/2026')
  })

  it('accepts a Date object', () => {
    const d = new Date('2026-01-01T12:00:00Z')
    expect(formatDate(d)).toMatch(/01\/01\/2026/)
  })
})

describe('formatDateTime', () => {
  it('includes date and time parts', () => {
    const result = formatDateTime('2026-06-15T10:30:00')
    expect(result).toContain('15/06/2026')
  })
})
