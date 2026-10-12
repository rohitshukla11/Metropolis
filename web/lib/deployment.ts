/**
 * Contract addresses on Arbitrum Sepolia, from deployments/arbitrum-sepolia.json. startBlock is
 * CreatorRegistry's creation block, for the indexer. Null until the contracts are deployed.
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
  startBlock: null,
  CreatorRegistry: null,
  LicenseRegistry: null,
  LicenseEscrow: null,
  ReceiptAnchor: null,
};

export function requireAddress(name: "CreatorRegistry" | "LicenseRegistry" | "LicenseEscrow" | "ReceiptAnchor"): Address {
  const a = deployment[name];
  if (!a) throw new Error(`${name} is not deployed yet`);
  return a;
}
