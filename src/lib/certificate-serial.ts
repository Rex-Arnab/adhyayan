const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 — read aloud safely

/** Serial format: ADH-YYYY-XXXXXXXX */
export function makeSerial(year = new Date().getFullYear(), random = Math.random): string {
  let body = "";
  for (let i = 0; i < 8; i += 1) {
    body += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return `ADH-${year}-${body}`;
}
