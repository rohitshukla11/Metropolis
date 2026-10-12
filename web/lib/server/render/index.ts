import "server-only";
/**
 * Renderers behind one interface:
 *  - Gemini image generation (lib/server/render/gemini) when GEMINI_API_KEY is set;
 *  - only when it is not: the DevRenderer, a clearly marked TEST RENDER (reference composite plus
 *    text overlay) so receipts, payment and verification can run end to end. In a production build it
 *    also needs DEV_RENDERER=1; otherwise renders are refused rather than faked.
 * A configured provider that fails never falls through to the DevRenderer: the render fails instead,
 * with the provider's own error (quota, billing, safety block).
 */
import { geminiModels } from "../gemini";
import { devRender } from "./dev";
import { geminiRender } from "./gemini";
import type { RenderInput, RenderOutput } from "./types";

export type { RenderInput, RenderOutput } from "./types";

/** The test renderer runs in development and tests, and in production only with DEV_RENDERER=1. */
const devRendererAllowed = () => process.env.NODE_ENV !== "production" || process.env.DEV_RENDERER === "1";

export function rendererPlan(): { primary: string; test: boolean } {
  if (process.env.GEMINI_API_KEY) return { primary: `Gemini (${geminiModels.image()})`, test: false };
  if (!devRendererAllowed()) return { primary: "Not configured (GEMINI_API_KEY)", test: false };
  return { primary: "DevRenderer (TEST RENDER)", test: true };
}

export async function render(input: RenderInput): Promise<RenderOutput & { attempts: string[] }> {
  if (!process.env.GEMINI_API_KEY) {
    if (!devRendererAllowed()) throw new Error("render failed: no image model is configured on this server (GEMINI_API_KEY)");
    return { ...(await devRender(input)), attempts: ["dev"] };
  }
  try {
    return { ...(await geminiRender(input)), attempts: [`${geminiModels.image()}: ok`] };
  } catch (e) {
    throw new Error(`render failed: ${(e as Error).message}`);
  }
}
