/** Average adult reading speed for technical prose, in words per minute. */
export const BASELINE_WPM = 200;

/**
 * Word count used for both the reading estimate and the ML reading-speed feature.
 * Fenced code blocks are stripped first — code is scanned, not read at prose
 * speed, and counting it inflates every estimate on a code-heavy chapter.
 */
export function countWords(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/[#>*_\-|]/g, " ");
  const words = prose.split(/\s+/).filter(Boolean);
  return words.length;
}

export function estimateMinutes(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / BASELINE_WPM));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
