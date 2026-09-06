/**
 * Possessive form of a name.
 *
 * Names already ending in s or z take a bare apostrophe ("James' dashboard"),
 * which reads better than "James's" in a heading. Everything else takes 's.
 * Returns null for an empty name so callers can fall back rather than render
 * a stray apostrophe.
 */
export function possessive(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return /[sz]$/i.test(trimmed) ? `${trimmed}'` : `${trimmed}'s`;
}

/** First word of a name, for greetings. */
export function firstName(name: string | null | undefined): string | null {
  const trimmed = name?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}
