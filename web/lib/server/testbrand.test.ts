import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { USDC } from "@/lib/chain";
import { deployment } from "@/lib/deployment";
import { testBrandAddress, testBrandEnabled, testBrandSignMessage, testBrandSignTransaction } from "./testbrand";

describe("server-held test brand (local only)", () => {
  const key = generatePrivateKey();
  beforeEach(() => {
    const dir = mkdtempSync(path.join(tmpdir(), "testbrand-"));
    writeFileSync(path.join(dir, "test-brand.key"), key);
    vi.stubEnv("TEST_BRAND_KEY_FILE", path.join(dir, "test-brand.key"));
  });
  afterEach(() => vi.unstubAllEnvs());

  it("is off without TEST_BRAND=1", () => {
    vi.stubEnv("TEST_BRAND", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(testBrandEnabled()).toBe(false);
    expect(testBrandAddress()).toBeNull();
  });

  it("is off in a production build even with TEST_BRAND=1: no address, no signatures, the route says disabled", async () => {
    vi.stubEnv("TEST_BRAND", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(testBrandEnabled()).toBe(false);
    expect(testBrandAddress()).toBeNull();
    await expect(testBrandSignMessage("Likeness: start brand session\nwallet: 0x1")).rejects.toMatchObject({ status: 404 });
    const { GET, POST } = await import("@/app/api/test-brand/route");
    expect(await (await GET()).json()).toEqual({ enabled: false });
    const r = await POST(new Request("http://localhost/api/test-brand", { method: "POST", body: JSON.stringify({ op: "signMessage", message: "Likeness: x" }) }) as never);
    expect(r.status).toBe(404);
  });

  it("locally with TEST_BRAND=1, signs only Likeness messages and transactions to the protocol or USDC on this chain", async () => {
    vi.stubEnv("TEST_BRAND", "1");
    vi.stubEnv("NODE_ENV", "development");
    expect(testBrandAddress()).toBe(privateKeyToAccount(key).address);
    expect(await testBrandSignMessage("Likeness: start brand session\nwallet: 0x1")).toMatch(/^0x[0-9a-f]{130}$/);
    await expect(testBrandSignMessage("anything else")).rejects.toThrow(/only Likeness/);
    const tx = { chainId: deployment.chainId, to: USDC, data: "0x095ea7b3" as const, nonce: 0, gas: 100_000n, maxFeePerGas: 1n, maxPriorityFeePerGas: 0n, type: "eip1559" as const };
    expect(await testBrandSignTransaction(tx)).toMatch(/^0x02/);
    await expect(testBrandSignTransaction({ ...tx, chainId: 1 })).rejects.toThrow(/chain/);
    await expect(testBrandSignTransaction({ ...tx, to: "0x000000000000000000000000000000000000dEaD" })).rejects.toThrow(/only transactions/);
    await expect(testBrandSignTransaction({ ...tx, value: 1n })).rejects.toThrow(/never sends ETH/);
  });
});
