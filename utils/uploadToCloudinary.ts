// utils/uploadToCloudinary.ts
export async function uploadToCloudinary(file: File) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName)
    throw new Error('Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME in .env.local');
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const fd = new FormData();
  fd.append('file', file);
  if (preset) fd.append('upload_preset', preset);

  const res = await fetch(url, { method: 'POST', body: fd });

  if (!res.ok) {
    // Provide the Cloudinary response body for debugging
    const text = await res.text().catch(() => '');
    throw new Error(
      `Cloudinary upload failed: ${res.status} ${res.statusText} — ${text}`
    );
  }

  const data = await res.json().catch((err) => {
    throw new Error('Failed to parse Cloudinary response JSON: ' + String(err));
  });

  if (!data.secure_url && !data.url)
    throw new Error(
      'Cloudinary response missing secure_url: ' + JSON.stringify(data)
    );
  return (data.secure_url || data.url) as string;
}
