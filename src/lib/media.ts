const apiBase =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3001/v1'

export function normalizeMediaUrl(uri: string | null | undefined): string | null {
  if (!uri) return null

  if (uri.startsWith('/v1/media/') || uri.startsWith('/media/')) {
    const origin = apiBase.replace(/\/v1$/, '')
    return `${origin}${uri.startsWith('/v1') ? uri : `/v1${uri}`}`
  }

  try {
    const parsed = new URL(uri)
    if (parsed.pathname.startsWith('/v1/media/')) {
      const origin = apiBase.replace(/\/v1$/, '')
      return `${origin}${parsed.pathname}`
    }
  } catch {
    // not a URL
  }

  return uri
}
