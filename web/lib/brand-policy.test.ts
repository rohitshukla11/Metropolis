import { describe, expect, it } from "vitest";
import { emailMatchesWebsite, websiteDomain } from "./brand-policy";
import { cleanTags } from "./creator-profile";

describe("brand domain check", () => {
  it("matches a work email to its website, subdomains either way", () => {
    expect(emailMatchesWebsite("ads@brewandco.example", "https://www.brewandco.example/en")).toBe(true);
    expect(emailMatchesWebsite("me@marketing.brewandco.example", "brewandco.example")).toBe(true);
    expect(emailMatchesWebsite("me@brewandco.example", "shop.brewandco.example")).toBe(true);
  });
  it("never verifies a free email domain or a different company", () => {
    expect(emailMatchesWebsite("brewandco.brand@gmail.com", "brewandco.example")).toBe(false);
    expect(emailMatchesWebsite("ads@brewandco.example", "othershop.example")).toBe(false);
    expect(emailMatchesWebsite("ads@notbrewandco.example", "brewandco.example")).toBe(false);
  });
  it("reads a website's domain", () => {
    expect(websiteDomain("www.brewandco.example")).toBe("brewandco.example");
    expect(websiteDomain("not a site")).toBeNull();
  });
});

describe("style tags", () => {
  it("keeps only curated values, never anything sensitive", () => {
    expect(cleanTags({ tone: ["warm", "religion:x"], setting: ["urban", "ethnicity"], ageRange: "30" } as never)).toEqual({ tone: ["warm"], setting: ["urban"], ageRange: null });
  });
});
