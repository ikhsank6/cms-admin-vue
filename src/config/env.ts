const env = import.meta.env

export const config = {
  apiBaseUrl: (env.VITE_API_BASE_URL as string | undefined) || '/api/v1',
  useMock: env.VITE_API_MOCK === 'true',
  siteUrl: ((env.VITE_SITE_URL as string | undefined) || window.location.origin).replace(/\/$/, ''),
  uploadMaxBytes: Number(env.VITE_UPLOAD_MAX_MB || 10) * 1024 * 1024,
} as const
