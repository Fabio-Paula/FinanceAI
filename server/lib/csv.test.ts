import { describe, it, expect } from 'vitest'
import { parseCSV, parseAmount, parseDate } from './csv'

describe('parseAmount', () => {
  it('parses Brazilian format with thousands dot and decimal comma', () => {
    expect(parseAmount('1.234,56')).toBe(1234.56)
  })

  it('parses parentheses as negative', () => {
    expect(parseAmount('(1.234,56)')).toBe(-1234.56)
  })

  it('parses leading minus as negative', () => {
    expect(parseAmount('-500,00')).toBe(-500)
  })

  it('strips R$ and spaces', () => {
    expect(parseAmount('R$ 2.500,00')).toBe(2500)
  })

  it('parses plain decimal', () => {
    expect(parseAmount('100.50')).toBe(100.5)
  })

  it('returns 0 for invalid input', () => {
    expect(parseAmount('abc')).toBe(0)
  })

  it('parses zero', () => {
    expect(parseAmount('0,00')).toBe(0)
  })
})

describe('parseDate', () => {
  it('parses dd/mm/yyyy', () => {
    const d = parseDate('15/06/2026')
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2026)
    expect(d!.getUTCMonth()).toBe(5)
    expect(d!.getUTCDate()).toBe(15)
  })

  it('parses dd-mm-yyyy', () => {
    const d = parseDate('01-01-2025')
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2025)
  })

  it('parses yyyy-mm-dd', () => {
    const d = parseDate('2026-03-20')
    expect(d).not.toBeNull()
    expect(d!.getUTCFullYear()).toBe(2026)
    expect(d!.getUTCMonth()).toBe(2)
  })

  it('returns null for invalid date', () => {
    expect(parseDate('invalid')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(parseDate('')).toBeNull()
  })
})

describe('parseCSV', () => {
  it('parses simple comma-delimited CSV', () => {
    const text = 'name,amount\nJoão,100\nMaria,200'
    const { headers, rows } = parseCSV(text)
    expect(headers).toEqual(['name', 'amount'])
    expect(rows).toHaveLength(2)
    expect(rows[0]).toEqual({ name: 'João', amount: '100' })
  })

  it('parses semicolon-delimited CSV', () => {
    const text = 'data;valor\n01/06/2026;1.500,00\n02/06/2026;200,00'
    const { headers, rows } = parseCSV(text)
    expect(headers).toEqual(['data', 'valor'])
    expect(rows[0].valor).toBe('1.500,00')
  })

  it('strips UTF-8 BOM', () => {
    const text = '﻿name,amount\nTest,50'
    const { headers } = parseCSV(text)
    expect(headers[0]).toBe('name')
  })

  it('handles quoted fields with commas', () => {
    const text = 'desc,amount\n"Padaria, São Paulo",10.00'
    const { rows } = parseCSV(text)
    expect(rows[0].desc).toBe('Padaria, São Paulo')
  })

  it('returns empty for single-line input', () => {
    const { headers, rows } = parseCSV('only one line')
    expect(headers).toEqual([])
    expect(rows).toEqual([])
  })

  it('normalises CRLF line endings', () => {
    const text = 'a,b\r\n1,2\r\n3,4'
    const { rows } = parseCSV(text)
    expect(rows).toHaveLength(2)
  })
})
