import { describe, expect, it } from "vitest";
import { releasedMessage } from "./dashboard-copy";

describe("dashboard copy", () => {
  it("confirms a photo release with the padded licence number", () => {
    expect(releasedMessage("1")).toBe("Photos released to licence #0001. Renders under it can run now.");
    expect(releasedMessage("12345")).toBe("Photos released to licence #12345. Renders under it can run now.");
  });
});
