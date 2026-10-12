/**
 * Arbitrum Sepolia, from https://docs.arbitrum.io/for-devs/dev-tools-and-resources/chain-info:
 * chain ID 421614, Arbiscan at sepolia.arbiscan.io. viem's built-in definition matches it; only the RPC
 * can be overridden (NEXT_PUBLIC_RPC_URL), e.g. with a provider endpoint instead of the public one.
 */
import { arbitrumSepolia } from "viem/chains";
import { defineChain, type Address } from "viem";

export const appChain = defineChain({
  ...arbitrumSepolia,
  rpcUrls: { default: { http: [process.env.NEXT_PUBLIC_RPC_URL || arbitrumSepolia.rpcUrls.default.http[0]] } },
});

/** Circle USDC, 6 decimals: https://developers.circle.com/stablecoins/usdc-contract-addresses (Arbitrum Sepolia) */
export const USDC: Address = "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";

export const explorer = {
  name: "Arbiscan",
  tx: (hash: string) => `${appChain.blockExplorers.default.url}/tx/${hash}`,
  address: (a: string) => `${appChain.blockExplorers.default.url}/address/${a}`,
};

/** Where testnet USDC comes from. */
export const USDC_FAUCET = "https://faucet.circle.com";
