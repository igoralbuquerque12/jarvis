import { randomBytes } from 'node:crypto';

export function generateToken(length: number): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = randomBytes(length);

  return Array.from(bytes, (b) => caracteres[b % caracteres.length]).join('');
}
