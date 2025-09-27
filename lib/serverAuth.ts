// lib/serverAuth.ts
import { NextApiRequest } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export function getTokenFromReq(req: NextApiRequest): string | null {
  const cookie = req.headers.cookie || '';
  const found = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('ac_token='));
  if (!found) return null;
  return found.split('=')[1] ?? null;
}

export function verifyAdmin(req: NextApiRequest) {
  const token = getTokenFromReq(req);
  if (!token) throw new Error('Not authenticated');
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if ((payload as any)?.role !== 'admin') throw new Error('Not authorized');
    return payload;
  } catch (err) {
    throw new Error('Invalid token');
  }
}
