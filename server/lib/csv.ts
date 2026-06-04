function detectDelimiter(line: string): string {
  const semicolons = (line.match(/;/g) ?? []).length
  const commas = (line.match(/,/g) ?? []).length
  return semicolons > commas ? ';' : ','
}

function splitLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const lines = clean.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const delimiter = detectDelimiter(lines[0])
  const headers = splitLine(lines[0], delimiter).map(h => h.replace(/^"|"$/g, ''))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = splitLine(lines[i], delimiter)
    if (values.length < 2) continue
    const row: Record<string, string> = {}
    headers.forEach((h, j) => { row[h] = (values[j] ?? '').replace(/^"|"$/g, '') })
    rows.push(row)
  }

  return { headers, rows }
}

export function parseAmount(raw: string): number {
  let v = raw.replace(/[R$\s]/g, '')
  const negative = v.includes('-') || (v.startsWith('(') && v.endsWith(')'))
  v = v.replace(/[()]/g, '').replace(/^-/, '')

  // Brazilian format: 1.234,56 → last separator is comma
  if (v.includes(',')) {
    const commaIdx = v.lastIndexOf(',')
    const dotIdx = v.lastIndexOf('.')
    if (dotIdx < commaIdx) {
      // dots are thousands separators, comma is decimal
      v = v.replace(/\./g, '').replace(',', '.')
    } else {
      // comma is thousands separator
      v = v.replace(/,/g, '')
    }
  }

  const num = parseFloat(v)
  return isNaN(num) ? 0 : negative ? -Math.abs(num) : num
}

export function parseDate(raw: string): Date | null {
  const v = raw.trim()

  // dd/mm/yyyy or dd-mm-yyyy
  const dmy = v.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) {
    const d = new Date(`${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}T12:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  }

  // yyyy-mm-dd
  const ymd = v.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})/)
  if (ymd) {
    const d = new Date(`${ymd[1]}-${ymd[2]}-${ymd[3]}T12:00:00Z`)
    return isNaN(d.getTime()) ? null : d
  }

  return null
}
