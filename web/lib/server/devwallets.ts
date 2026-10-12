import "server-only";
/**
 * DEV ONLY. The seeded test wallets (written by `pnpm seed`), so the UI can act as the unverified test
 * creator or the test brand without Dynamic. Off unless a non-production server runs with DEV_WALLETS=1;
 * these are throwaway testnet keys, never real users' keys. When off, the answer is an empty list (not an
 * error), so pages don't log a failed request on every load.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";

export type DevWallet = { role: string; label: string; address: string; key?: string; devSecret?: string };

export const devWalletsEnabled = () => process.env.NODE_ENV !== "production" && process.env.DEV_WALLETS === "1";

export async function devWallets(): Promise<DevWallet[]> {
  if (!devWalletsEnabled()) return [];
  const dir = path.resolve(/*turbopackIgnore: true*/ process.cwd(), process.env.DEV_KEYS_DIR ?? "../.secrets/dev");
  try {
    return JSON.parse(await readFile(path.join(dir, "wallets.json"), "utf8")).wallets ?? [];
  } catch {
    return [];
  }
}
