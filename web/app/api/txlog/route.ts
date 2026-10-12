import type { NextRequest } from "next/server";
import { USDC } from "@/lib/chain";
import { deployment } from "@/lib/deployment";
import { pub } from "@/lib/server/chain";
import { dbList, dbPut } from "@/lib/server/db";

/**
 * Transaction timings (send → receipt), measured where the transaction was sent: the browser posts
 * them here. Each is logged as one JSON line and kept, but only for a successful transaction to one of
 * the protocol contracts or USDC, so the list is real on-chain activity. GET lists the latest, for the
 * confirmation times quoted in the README (all public data: hashes, function names, milliseconds).
 */
type Entry = { hash: string; fn: string; from: string; ms: number; gasUsed: string; block: string; at: number };

const allowed = () => new Set([deployment.CreatorRegistry, deployment.LicenseRegistry, deployment.LicenseEscrow, deployment.ReceiptAnchor, USDC].filter(Boolean).map((a) => a!.toLowerCase()));

export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => ({}))) as { hash?: string; fn?: string; from?: string; ms?: number; gasUsed?: string };
  if (!/^0x[0-9a-f]{64}$/.test(b.hash ?? "")) return Response.json({ ok: false }, { status: 400 });
  const entry = { hash: b.hash!, fn: String(b.fn).slice(0, 40), from: String(b.from).slice(0, 42).toLowerCase(), ms: Math.round(Number(b.ms)), gasUsed: String(b.gasUsed).slice(0, 20) };
  console.log(JSON.stringify({ service: "tx", ...entry }));
  try {
    const r = await pub().getTransactionReceipt({ hash: entry.hash as `0x${string}` });
    if (r.status === "success" && r.to && allowed().has(r.to.toLowerCase()) && Number.isFinite(entry.ms) && entry.ms > 0)
      await dbPut<Entry>("txlog", entry.hash, { ...entry, block: r.blockNumber.toString(), at: Date.now() });
  } catch {}
  return Response.json({ ok: true });
}

export async function GET() {
  const rows = (await dbList<Entry>("txlog")).sort((a, b) => b.at - a.at).slice(0, 200);
  return Response.json({ entries: rows });
}
