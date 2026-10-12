/** JSON with bigints, for signing requests: a bigint travels as {"$bigint":"123"}. */
export const bigStringify = (v: unknown) => JSON.stringify(v, (_, x) => (typeof x === "bigint" ? { $bigint: x.toString() } : x));
export const bigParse = <T>(s: string): T =>
  JSON.parse(s, (_, x) => (x && typeof x === "object" && typeof x.$bigint === "string" && Object.keys(x).length === 1 ? BigInt(x.$bigint) : x)) as T;
