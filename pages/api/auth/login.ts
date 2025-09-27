// pages/api/auth/login.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'changeme';
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { password } = req.body ?? {};
  if (!password) return res.status(400).json({ error: 'Missing password' });

  if (password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '8h' });
  res.setHeader(
    'Set-Cookie',
    `ac_token=${token}; HttpOnly; Path=/; Max-Age=${8 * 3600}; SameSite=Lax`
  );
  return res.status(200).json({ ok: true });
}
