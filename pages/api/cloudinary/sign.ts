// pages/api/cloudinary/sign.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || ''; // optional

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }

  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    return res
      .status(500)
      .json({ error: 'Cloudinary env vars not configured on server' });
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    // include upload_preset if you want to use a preset server-side
    const paramsToSign = UPLOAD_PRESET
      ? `timestamp=${timestamp}&upload_preset=${UPLOAD_PRESET}`
      : `timestamp=${timestamp}`;
    const signature = crypto
      .createHash('sha1')
      .update(paramsToSign + API_SECRET)
      .digest('hex');

    return res.status(200).json({
      signature,
      timestamp,
      apiKey: API_KEY,
      cloudName: CLOUD_NAME,
      uploadPreset: UPLOAD_PRESET || undefined,
    });
  } catch (err: any) {
    console.error('cloudinary sign error', err);
    return res.status(500).json({ error: 'Failed to create signature' });
  }
}
