import { describe, expect, it } from "vitest";
import { timestampsFromLogs } from "./timestamps";

describe("log timestamps", () => {
  it("uses a real blockTimestamp from the log", () => {
    expect(timestampsFromLogs([{ blockNumber: 10n, blockTimestamp: "0x68e2a000" }]).get(10n)).toBe(0x68e2a000);
    expect(timestampsFromLogs([{ blockNumber: 11n, blockTimestamp: 1_791_831_672n }]).get(11n)).toBe(1_791_831_672);
  });

  it('treats "0x0" (what the public Arbitrum Sepolia RPC sends) as unknown, so the block header is read', () => {
    const t = timestampsFromLogs([{ blockNumber: 318_505_814n, blockTimestamp: "0x0" }]);
    expect(t.has(318_505_814n)).toBe(false);
  });

  it("treats a missing or unparseable timestamp as unknown", () => {
    const t = timestampsFromLogs([{ blockNumber: 1n }, { blockNumber: 2n, blockTimestamp: null }, { blockNumber: 3n, blockTimestamp: "nope" }]);
    expect(t.size).toBe(0);
  });
});
