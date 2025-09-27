// utils/uploadToCloudinarySigned.ts
export async function uploadToCloudinarySigned(file: File) {
  // request signature from our server
  const signRes = await fetch('/api/cloudinary/sign', { method: 'POST' });
  if (!signRes.ok) {
    const t = await signRes.text().catch(() => '');
    throw new Error(`Sign request failed: ${signRes.status} ${t}`);
  }
  const sign = await signRes.json();
  const { signature, timestamp, apiKey, cloudName, uploadPreset } = sign;

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', String(apiKey));
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  if (uploadPreset) fd.append('upload_preset', uploadPreset);

  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      `Cloudinary upload failed: ${res.status} ${res.statusText} — ${text}`
    );
  }
  const data = await res.json();
  return data.secure_url || data.url;
}
