import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { devWallets, devWalletsEnabled } from "./devwallets";

describe("dev wallets", () => {
  afterEach(() => vi.unstubAllEnvs());
  const seed = () => {
    const dir = mkdtempSync(path.join(tmpdir(), "devwallets-"));
    writeFileSync(path.join(dir, "wallets.json"), JSON.stringify({ wallets: [{ role: "brand", label: "Test brand", address: "0x1" }] }));
    vi.stubEnv("DEV_KEYS_DIR", dir);
  };

  it("are off without DEV_WALLETS=1, as an empty list rather than an error", async () => {
    seed();
    vi.stubEnv("DEV_WALLETS", "");
    expect(devWalletsEnabled()).toBe(false);
    expect(await devWallets()).toEqual([]);
  });

  it("are off in a production build even with DEV_WALLETS=1", async () => {
    seed();
    vi.stubEnv("DEV_WALLETS", "1");
    vi.stubEnv("NODE_ENV", "production");
    expect(await devWallets()).toEqual([]);
  });

  it("are listed in development with DEV_WALLETS=1", async () => {
    seed();
    vi.stubEnv("DEV_WALLETS", "1");
    vi.stubEnv("NODE_ENV", "development");
    expect(await devWallets()).toEqual([{ role: "brand", label: "Test brand", address: "0x1" }]);
  });
});
