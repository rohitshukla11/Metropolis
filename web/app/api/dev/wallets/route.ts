import { devWallets } from "@/lib/server/devwallets";
import { json } from "@/lib/server/http";

/** DEV ONLY: the seeded test wallets (see lib/server/devwallets). An empty list when they are off. */
export async function GET() {
  return json({ wallets: await devWallets() });
}
