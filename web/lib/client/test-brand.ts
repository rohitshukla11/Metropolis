"use client";
/**
 * The browser side of the SERVER-HELD TEST BRAND (local only; see lib/server/testbrand): a viem account
 * whose signatures come from /api/test-brand, so the key never reaches the browser and there are no
 * wallet prompts.
 */
import { createWalletClient, http, type Account, type Address, type Chain, type Hex, type Transport, type WalletClient } from "viem";
import { toAccount } from "viem/accounts";
import { appChain } from "@/lib/chain";
import { bigStringify } from "@/lib/bigjson";

async function sign<T>(body: Record<string, unknown>): Promise<T> {
  const r = await fetch("/api/test-brand", { method: "POST", headers: { "content-type": "application/json" }, body: bigStringify(body) });
  const j = (await r.json()) as T & { error?: string };
  if (!r.ok) throw new Error(j.error ?? `test brand signing failed (${r.status})`);
  return j;
}

export function serverHeldClient(address: Address): WalletClient<Transport, Chain, Account> {
  const account = toAccount({
    address,
    signMessage: async ({ message }) => (await sign<{ signature: Hex }>({ op: "signMessage", message: typeof message === "string" ? message : String(message) })).signature,
    signTypedData: async (typedData) => (await sign<{ signature: Hex }>({ op: "signTypedData", typedData })).signature,
    signTransaction: async (transaction) => (await sign<{ signed: Hex }>({ op: "signTransaction", transaction })).signed,
  });
  return createWalletClient({ account, chain: appChain, transport: http() }) as WalletClient<Transport, Chain, Account>;
}
