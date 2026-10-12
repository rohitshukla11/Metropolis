/**
 * Block timestamps for logs, when the RPC includes them. Some RPCs put `blockTimestamp` on each log;
 * the public Arbitrum Sepolia endpoint sends it as "0x0", so a zero (or missing, or unparseable) value
 * means "unknown" and the caller reads the block header instead.
 */
import type { Hex } from "viem";

export type LogWithTime = { blockNumber: bigint | null; blockTimestamp?: Hex | bigint | string | null };

export function timestampsFromLogs(logs: LogWithTime[]): Map<bigint, number> {
  const times = new Map<bigint, number>();
  for (const l of logs) {
    if (l.blockNumber === null || l.blockTimestamp === undefined || l.blockTimestamp === null) continue;
    const ts = Number(l.blockTimestamp);
    if (Number.isFinite(ts) && ts > 0) times.set(l.blockNumber, ts);
  }
  return times;
}
