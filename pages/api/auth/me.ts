// pages/api/auth/me.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookie = req.headers.cookie || '';
  const match = cookie
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith('ac_token='));
  if (!match) return res.status(200).json({ authenticated: false });
  const token = match.split('=')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return res.status(200).json({ authenticated: true, payload });
  } catch (err) {
    return res.status(200).json({ authenticated: false });
  }
}
