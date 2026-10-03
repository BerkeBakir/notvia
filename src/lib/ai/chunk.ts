/**
 * Bir metni örtüşmeli karakter parçalarına böler.
 * Boş/whitespace metinde boş dizi döner.
 */
export function chunkText(
  text: string,
  opts: { size?: number; overlap?: number } = {},
): string[] {
  const size = opts.size ?? 1500;
  const overlap = opts.overlap ?? 200;
  const clean = text.trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];

  const step = size - overlap;
  const chunks: string[] = [];
  for (let start = 0; start < clean.length; start += step) {
    chunks.push(clean.slice(start, start + size));
    if (start + size >= clean.length) break;
  }
  return chunks;
}
