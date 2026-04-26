/**
 * Build the URL stored in MongoDB for disk-based uploads.
 * In production, set PUBLIC_URL to your Render service origin (https://xxx.onrender.com)
 * so the frontend (on a different host) can load /uploads/... from the API origin.
 */
export function buildStoredUploadUrl(filename) {
  if (!filename) return '';
  const rel = `/uploads/${filename}`;
  const publicBase = String(process.env.PUBLIC_URL || '').replace(/\/$/, '');
  if (publicBase) return `${publicBase}${rel}`;
  return rel;
}
