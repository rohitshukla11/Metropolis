/**
 * Matching a public-profile image against the creator's attested reference photos: the best score
 * across all of them counts, not just one. Pure, so it can be tested without the face models.
 *
 * Thresholds (local matcher, cosine similarity):
 *  - a real photo: LOCAL_FACE_MATCH_THRESHOLD (default 0.55). The match is the identity check: it must be
 *    the attested person.
 *  - an approved sample: SAMPLE_FACE_MATCH_THRESHOLD (default 0.45). Its provenance is already proven (Likeness
 *    rendered it from the reference set whose hash is on chain), so the match only checks that the render
 *    still looks like the creator; rendered faces score lower than photos of the same person.
 */
export type FaceScore = { ok: boolean; score: number | null; detail: string };

export const sampleThreshold = () => Number(process.env.SAMPLE_FACE_MATCH_THRESHOLD ?? 0.45);

/** Run `compare` against each reference in turn; stop at the first pass, else report the best score. */
export async function bestMatch(references: Uint8Array[], compare: (reference: Uint8Array) => Promise<FaceScore>): Promise<FaceScore & { tried: number }> {
  if (references.length === 0) throw new Error("no reference photos to compare against");
  let best: FaceScore | null = null;
  let tried = 0;
  for (const r of references) {
    tried++;
    const m = await compare(r);
    if (m.ok) return { ...m, tried };
    if (!best || (m.score ?? -1) > (best.score ?? -1)) best = m;
  }
  return { ...best!, tried };
}
