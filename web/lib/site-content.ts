/**
 * Marketing copy that is data, not code. Every number here is a real measurement with its source;
 * testimonials are real quotes only. An empty list hides the section entirely.
 */

export const MEASUREMENTS: {
  /** CreatorRegistry.register on Arbitrum Sepolia, send to receipt over the public RPC. Null until measured: the card is hidden. */
  registerMs: { value: number; source: string } | null;
  rendersWithReceipt: { value: number; source: string };
} = {
  registerMs: {
    value: 230,
    source: "CreatorRegistry.register on Arbitrum Sepolia, 2026-10-12, local run: send to receipt in the browser over the public RPC",
  },
  /** By construction: payRender anchors the receipt in the same transaction, and files are released only after it. */
  rendersWithReceipt: {
    value: 100,
    source: "LicenseEscrow.payRender anchors the receipt in the same transaction that pays the creator",
  },
};

export type Testimonial = { quote: string; name: string; role: string };

/** Real, attributed quotes only. Leave empty until there are some: the section is then not rendered. */
export const TESTIMONIALS: Testimonial[] = [];

export const BUILT_ON = ["Arbitrum", "Dynamic", "Didit", "Mera", "Envio", "Gemini", "C2PA"];
