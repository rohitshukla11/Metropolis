import { afterEach, describe, expect, it, vi } from "vitest";
import { bestMatch, sampleThreshold } from "./facecheck";

const refs = [new Uint8Array([1]), new Uint8Array([2]), new Uint8Array([3])];
const scorer = (scores: number[], threshold: number) => async (r: Uint8Array) => {
  const score = scores[r[0] - 1];
  return { ok: score >= threshold, score, detail: `similarity ${score}` };
};

describe("face check against the attested photos", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("passes when any one reference matches, even if the first doesn't", async () => {
    const m = await bestMatch(refs, scorer([0.48, 0.61, 0.4], 0.55));
    expect(m).toMatchObject({ ok: true, score: 0.61, tried: 2 });
  });

  it("reports the best score across all references when none matches", async () => {
    const m = await bestMatch(refs, scorer([0.41, 0.5, 0.47], 0.55));
    expect(m).toMatchObject({ ok: false, score: 0.5, tried: 3 });
  });

  it("uses a lower bar for approved samples (0.45 by default), which a 0.48 render passes", async () => {
    expect(sampleThreshold()).toBe(0.45);
    expect((await bestMatch(refs, scorer([0.48, 0.44, 0.4], sampleThreshold()))).ok).toBe(true);
    vi.stubEnv("SAMPLE_FACE_MATCH_THRESHOLD", "0.5");
    expect((await bestMatch(refs, scorer([0.48, 0.44, 0.4], sampleThreshold()))).ok).toBe(false);
  });

  it("refuses to run without references", async () => {
    await expect(bestMatch([], scorer([], 0.55))).rejects.toThrow(/no reference/);
  });
});
