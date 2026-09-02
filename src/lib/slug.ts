/**
 * Generate a URL-safe slug from a name.
 *
 * Unicode letters (Korean, etc.) are preserved rather than stripped: the
 * previous /[^a-z0-9\s-]/ filter reduced an all-Korean name to an empty
 * string, which then violated the NOT NULL / UNIQUE constraint on slug.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // keep letters/numbers in any script
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, ''); // trim leading/trailing hyphens
}

/**
 * Validate a slug taken from a URL segment before querying with it.
 *
 * Mirrors what generateSlug() produces, so Unicode slugs (e.g. Korean) are
 * accepted; an ASCII-only pattern here 404s posts that saved successfully.
 */
export function isValidSlug(slug: string): boolean {
  return /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(slug);
}

/**
 * Decode a slug taken from a URL segment.
 *
 * Next.js hands route params through still percent-encoded, so a Unicode slug
 * arrives as "%EA%B0%9C..." rather than "개발...". Validating or querying with
 * that raw value fails and 404s a post that exists. Normalizes to NFC so a
 * decomposed URL still matches the NFC form stored in the database.
 */
export function decodeSlug(slug: string): string {
  try {
    return decodeURIComponent(slug).normalize('NFC');
  } catch {
    // Malformed percent-encoding: return as-is so validation rejects it.
    return slug;
  }
}
