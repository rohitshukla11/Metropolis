import "server-only";
/**
 * One-time ETH top-up to a new embedded wallet on Arbitrum Sepolia, so creators and brands can pay gas
 * without buying any. Dynamic's gas sponsorship does not list Arbitrum Sepolia
 * (https://www.dynamic.xyz/docs/embedded-wallets/gas-sponsorship.md); sponsored gas through EIP-7702 and
 * a paymaster is on the roadmap.
 *
 * Size: DRIP_AMOUNT_ETH (default 0.0002 ETH) covers about 20 transactions of up to 500,000 gas at the
 * 0.02 gwei Arbitrum Sepolia gas price measured on 2026-10-12.
 *
 * Limits:
 *  - per address: once. Only a wallet with zero balance and nonce 0 qualifies, so the chain itself is
 *    the ledger and the cap survives restarts and multiple instances;
 *  - per IP: DRIP_PER_IP_PER_HOUR (default 3), and per instance: DRIP_PER_HOUR (default 30), in memory;
 *  - every request (sent, refused, rate limited or failed) is logged as one JSON line.
 */
import { createHash } from "node:crypto";
import { createWalletClient, http, isAddress, parseEther, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { pub, rpcUrl, serverChain } from "./chain";
import { loadKey } from "./keys";

const HOUR = 3_600_000;
const perIpLimit = () => Number(process.env.DRIP_PER_IP_PER_HOUR ?? 3);
const globalLimit = () => Number(process.env.DRIP_PER_HOUR ?? 30);
const amount = () => parseEther(process.env.DRIP_AMOUNT_ETH ?? "0.0002");

const byIp = new Map<string, number[]>();
let global: number[] = [];
const inFlight = new Set<string>();

export type DripResult = { status: number; body: Record<string, unknown> };

function log(event: Record<string, unknown>) {
  console.log(JSON.stringify({ at: new Date().toISOString(), service: "drip", ...event }));
}

const recent = (times: number[], now: number) => times.filter((t) => now - t < HOUR);

export async function drip(addressInput: string, ip: string): Promise<DripResult> {
  const ipHash = createHash("sha256").update(ip).digest("hex").slice(0, 12);
  const key = loadKey("DRIP_KEY_FILE", "DRIP_PRIVATE_KEY");
  if (!key) {
    log({ result: "not-configured", ipHash });
    return { status: 503, body: { error: "gas top-up is not configured on this server" } };
  }
  if (!isAddress(addressInput)) {
    log({ result: "bad-address", ipHash });
    return { status: 400, body: { error: "bad address" } };
  }
  const address = addressInput.toLowerCase() as Address;

  const now = Date.now();
  const ipTimes = recent(byIp.get(ipHash) ?? [], now);
  global = recent(global, now);
  if (ipTimes.length >= perIpLimit() || global.length >= globalLimit()) {
    log({ result: "rate-limited", address, ipHash });
    return { status: 429, body: { error: "too many top-ups right now, try again later" } };
  }
  if (inFlight.has(address)) {
    log({ result: "in-progress", address, ipHash });
    return { status: 409, body: { error: "already in progress" } };
  }

  inFlight.add(address);
  try {
    const client = pub();
    const [balance, nonce] = await Promise.all([client.getBalance({ address }), client.getTransactionCount({ address })]);
    if (balance > 0n || nonce > 0) {
      log({ result: "refused-not-new", address, ipHash });
      return { status: 409, body: { error: "only new, empty wallets get a top-up" } };
    }
    const wallet = createWalletClient({ chain: serverChain(), transport: http(rpcUrl()), account: privateKeyToAccount(key) });
    const value = amount();
    const hash = await wallet.sendTransaction({ to: address, value });
    ipTimes.push(now);
    byIp.set(ipHash, ipTimes);
    global.push(now);
    log({ result: "sent", address, ipHash, amount: value.toString(), hash });
    return { status: 200, body: { hash, amount: value.toString() } };
  } catch (e) {
    log({ result: "error", address, ipHash, error: e instanceof Error ? e.message.slice(0, 200) : "unknown" });
    return { status: 502, body: { error: "the top-up transaction failed" } };
  } finally {
    inFlight.delete(address);
  }
}
