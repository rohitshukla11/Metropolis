/**
 * Contract addresses on Arbitrum Sepolia, from deployments/arbitrum-sepolia.json (deployed
 * 2026-10-12 UTC, verified on Arbiscan). startBlock is CreatorRegistry's creation block (L2), for the
 * indexer.
 */
import type { Address } from "viem";

export const deployment: {
  chainId: 421614;
  startBlock: number | null;
  CreatorRegistry: Address | null;
  LicenseRegistry: Address | null;
  LicenseEscrow: Address | null;
  ReceiptAnchor: Address | null;
} = {
  chainId: 421614,
  startBlock: 318467180,
  CreatorRegistry: "0xE096452bE57EE285c3D7d29752d1Ac6854b538D5",
  LicenseRegistry: "0xE344b053a8935ACB887863Bb6201B6Fc9Cbc2320",
  LicenseEscrow: "0x50a730C0e9998e1F40a3211f00239ea60Be08163",
  ReceiptAnchor: "0x448B136468289216036a4C13995EA02C39F6B871",
};

export function requireAddress(name: "CreatorRegistry" | "LicenseRegistry" | "LicenseEscrow" | "ReceiptAnchor"): Address {
  const a = deployment[name];
  if (!a) throw new Error(`${name} is not deployed yet`);
  return a;
}
