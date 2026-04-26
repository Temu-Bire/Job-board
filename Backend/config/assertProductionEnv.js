/**
 * Fail fast on missing secrets when NODE_ENV=production.
 * Call before `server.listen`.
 */
export function assertProductionEnv() {
  if (process.env.NODE_ENV !== 'production') return;

  const exit = (msg) => {
    // eslint-disable-next-line no-console
    console.error(msg);
    process.exit(1);
  };

  if (!String(process.env.JWT_SECRET || '').trim()) {
    exit('[FATAL] JWT_SECRET must be set in production.');
  }
  if (!String(process.env.MONGODB_URI || '').trim()) {
    exit('[FATAL] MONGODB_URI must be set in production.');
  }

  const cors = String(process.env.CORS_ORIGINS || '').trim();
  if (!cors) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] CORS_ORIGINS is empty. Only non-browser tools or same-origin requests are unrestricted. ' +
        'For a SPA on another host, set CORS_ORIGINS=https://your-frontend.example.com'
    );
  }

  const cloudinaryOk =
    String(process.env.CLOUDINARY_CLOUD_NAME || '').trim() &&
    String(process.env.CLOUDINARY_API_KEY || '').trim() &&
    String(process.env.CLOUDINARY_API_SECRET || '').trim();

  if (!cloudinaryOk && !String(process.env.PUBLIC_URL || '').trim()) {
    // eslint-disable-next-line no-console
    console.warn(
      '[config] PUBLIC_URL is not set while Cloudinary is not fully configured. ' +
        'Disk uploads store /uploads/... paths; set PUBLIC_URL to this API origin (https://...) so URLs in MongoDB resolve from a separate frontend.'
    );
  }
}
