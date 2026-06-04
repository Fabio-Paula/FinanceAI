import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

function deriveKey(secret: string): Buffer {
  return createHash('sha256').update(secret).digest()
}

export function encryptKey(text: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
  const key = deriveKey(secret)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

export function decryptKey(data: string): string {
  const secret = process.env.JWT_SECRET ?? 'dev-secret-change-in-production'
  const [ivHex, encHex] = data.split(':')
  const key = deriveKey(secret)
  const iv = Buffer.from(ivHex, 'hex')
  const encrypted = Buffer.from(encHex, 'hex')
  const decipher = createDecipheriv('aes-256-cbc', key, iv)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}
