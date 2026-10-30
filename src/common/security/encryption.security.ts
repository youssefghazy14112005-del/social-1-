import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ENC_KEY, IV_LENGTH } from '../../config.js';
export function encrypt(value: string): string {
  const iv = randomBytes(IV_LENGTH); const cipher = createCipheriv('aes-256-cbc', Buffer.from(ENC_KEY, 'utf8'), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}::${encrypted.toString('hex')}`;
}
export function decrypt(value: string): string {
  const [ivHex, encryptedHex] = value.split('::');
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted value');
  const decipher = createDecipheriv('aes-256-cbc', Buffer.from(ENC_KEY, 'utf8'), Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
}
