import type { NextRequest } from "next/server";
import type { TransactionSerializable, TypedDataDefinition } from "viem";
import { bigParse } from "@/lib/bigjson";
import { fail, HttpError, json } from "@/lib/server/http";
import { ensureTestBrand, TEST_BRAND, testBrandAddress, testBrandEnabled, testBrandSignMessage, testBrandSignTransaction, testBrandSignTypedData } from "@/lib/server/testbrand";

/**
 * SERVER-HELD TEST BRAND, LOCAL ONLY (lib/server/testbrand). GET says whether it exists (and sets it up
 * once); POST signs for it. Off, it answers { enabled: false } and refuses to sign; it is always off in a
 * production build.
 */
export async function GET() {
  try {
    if (!testBrandEnabled()) return json({ enabled: false });
    await ensureTestBrand();
    return json({ enabled: true, address: testBrandAddress(), name: TEST_BRAND.name });
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!testBrandEnabled()) throw new HttpError(404, "no test brand on this server");
    const b = bigParse<{ op?: string; message?: string; typedData?: TypedDataDefinition; transaction?: TransactionSerializable }>(await req.text());
    if (b.op === "signMessage") return json({ signature: await testBrandSignMessage(b.message ?? "") });
    if (b.op === "signTypedData" && b.typedData) return json({ signature: await testBrandSignTypedData(b.typedData) });
    if (b.op === "signTransaction" && b.transaction) return json({ signed: await testBrandSignTransaction(b.transaction) });
    throw new HttpError(400, "op must be signMessage, signTypedData or signTransaction");
  } catch (e) {
    return fail(e);
  }
}
