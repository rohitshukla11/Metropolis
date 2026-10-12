import "server-only";
/**
 * SERVER-HELD TEST BRAND, LOCAL ONLY. A brand wallet whose key stays on this server
 * (TEST_BRAND_KEY_FILE, default ../.secrets/test-brand.key), so one person can act as both creator and
 * brand in the same browser during a local test run. It exists only when a non-production server runs
 * with TEST_BRAND=1: in a production build it is off even if the variable is set, like the DEV wallets.
 *
 * Its profile ("Brew & Co.", a fictional brand) goes through the normal brand-onboarding code, signed by
 * its key. The browser never sees the key: it asks /api/test-brand to sign, and only messages, EIP-712
 * data and transactions to the protocol contracts or USDC on this chain are signed. Every signature is
 * logged as {"service":"test-brand"}.
 */
import { BRAND_POLICY_VERSION, brandPolicyHash, brandProfileFields } from "@/lib/brand-policy";
import { actionMessage } from "@/lib/auth";
import { USDC } from "@/lib/chain";
import { deployment } from "@/lib/deployment";
import type { Address, Hex, TransactionSerializable, TypedDataDefinition } from "viem";
import { privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts";
import { HttpError } from "./http";
import { loadKey } from "./keys";

export const TEST_BRAND = {
  name: "Brew & Co.",
  website: "brewandco.example",
  uses: ["Advertising", "Social"],
  monthlyRenders: "50–500",
} as const;

/** On only in a non-production server with TEST_BRAND=1, and only when its key file exists. */
export const testBrandEnabled = () => process.env.NODE_ENV !== "production" && process.env.TEST_BRAND === "1";

function account(): PrivateKeyAccount {
  if (!testBrandEnabled()) throw new HttpError(404, "no test brand on this server");
  if (!process.env.TEST_BRAND_KEY_FILE && !process.env.TEST_BRAND_PRIVATE_KEY) process.env.TEST_BRAND_KEY_FILE = "../.secrets/test-brand.key";
  const key = loadKey("TEST_BRAND_KEY_FILE", "TEST_BRAND_PRIVATE_KEY");
  if (!key) throw new HttpError(503, "test brand key not found (TEST_BRAND_KEY_FILE)");
  return privateKeyToAccount(key);
}

const log = (event: Record<string, unknown>) => console.log(JSON.stringify({ at: new Date().toISOString(), service: "test-brand", note: "server-held test brand (local only)", ...event }));

export function testBrandAddress(): Address | null {
  return testBrandEnabled() ? account().address : null;
}

let ready: Promise<void> | null = null;
/**
 * Once per server process: the brand profile and policy through the normal brand code (skipped when
 * already complete), and one gas top-up from the drip if the wallet is new and empty.
 */
export function ensureTestBrand(): Promise<void> {
  if (!testBrandEnabled()) return Promise.resolve();
  ready ??= (async () => {
    const acct = account();
    const who = acct.address;
    const sign = async (action: string, fields: Record<string, string>) => {
      const message = actionMessage(action, { wallet: who.toLowerCase(), ...fields });
      return { message, signature: await acct.signMessage({ message }) };
    };
    const { getBrand, isComplete, saveBrandProfile, signBrandPolicy } = await import("./brands");
    const existing = await getBrand(who);
    if (!existing || existing.name !== TEST_BRAND.name) {
      const fields = brandProfileFields({ ...TEST_BRAND, uses: [...TEST_BRAND.uses], logoSha256: null });
      await saveBrandProfile({ address: who, auth: await sign("save brand profile", fields), ...TEST_BRAND, uses: [...TEST_BRAND.uses] });
      log({ result: "profile-saved", address: who });
    }
    if (!isComplete(await getBrand(who))) {
      await signBrandPolicy(who, await sign("agree to the brand policy", { version: BRAND_POLICY_VERSION, "text sha256": await brandPolicyHash() }));
      log({ result: "policy-signed", address: who });
    }
    const { drip } = await import("./drip");
    const r = await drip(who, "test-brand-setup");
    log({ result: "gas-top-up", address: who, status: r.status, ...(typeof r.body.hash === "string" ? { hash: r.body.hash } : { reason: r.body.error }) });
  })().catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

/** Contracts the test brand may send transactions to: the protocol and USDC, nothing else. */
const allowedTo = () => new Set([deployment.CreatorRegistry, deployment.LicenseRegistry, deployment.LicenseEscrow, deployment.ReceiptAnchor, USDC].filter(Boolean).map((a) => a!.toLowerCase()));

export async function testBrandSignMessage(message: string): Promise<Hex> {
  if (typeof message !== "string" || !message.startsWith("Likeness: ")) throw new HttpError(400, "only Likeness action messages are signed");
  const sig = await account().signMessage({ message });
  log({ op: "signMessage", action: message.split("\n")[0] });
  return sig;
}

export async function testBrandSignTypedData(data: TypedDataDefinition): Promise<Hex> {
  const domain = (data as { domain?: { chainId?: number | bigint } }).domain;
  if (Number(domain?.chainId) !== deployment.chainId) throw new HttpError(400, "typed data for another chain");
  const sig = await account().signTypedData(data);
  log({ op: "signTypedData", primaryType: (data as { primaryType?: string }).primaryType });
  return sig;
}

export async function testBrandSignTransaction(tx: TransactionSerializable): Promise<Hex> {
  if (Number(tx.chainId) !== deployment.chainId) throw new HttpError(400, `transaction for chain ${tx.chainId}, not ${deployment.chainId}`);
  if (!tx.to || !allowedTo().has(tx.to.toLowerCase())) throw new HttpError(400, "only transactions to the protocol contracts or USDC are signed");
  if (tx.value && BigInt(tx.value) !== 0n) throw new HttpError(400, "the test brand never sends ETH");
  const raw = await account().signTransaction(tx);
  log({ op: "signTransaction", to: tx.to, selector: (tx.data ?? "0x").slice(0, 10) });
  return raw;
}
