/**
 * Helper to validate Google Maps links
 * Accepts:
 * - https://maps.google.com/...
 * - https://maps.app.goo.gl/...
 * - https://goo.gl/maps/...
 * - https://www.google.com/maps/...
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  const trimmed = url.trim().toLowerCase()

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return false
  }

  const validPatterns = [
    'maps.google.',
    'maps.app.goo.gl',
    'goo.gl/maps',
    'google.com/maps',
    'google.co.in/maps',
  ]

  return validPatterns.some((pattern) => trimmed.includes(pattern))
}

/**
 * Format link for display/opening
 */
export function formatGoogleMapsUrl(url: string): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`
  }
  return trimmed
}
