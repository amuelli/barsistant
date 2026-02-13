/// <reference lib="deno.ns" />
import { assertEquals } from "jsr:@std/assert";
import { SUPPORTED_IMPORT_SOURCE_DOMAINS } from "../contracts/imports.ts";
import { validateSourceUrl } from "./source_url_validation.ts";

Deno.test("validateSourceUrl accepts allowed domains and normalizes URL output", () => {
  const result = validateSourceUrl(
    "  https://www.liquor.com/recipes/negroni  ",
  );

  assertEquals(result, {
    kind: "ok",
    sourceUrl: "https://www.liquor.com/recipes/negroni",
  });
});

Deno.test("validateSourceUrl accepts each configured supported domain", () => {
  for (const domain of SUPPORTED_IMPORT_SOURCE_DOMAINS) {
    assertEquals(
      validateSourceUrl(`https://${domain}/recipes/test`),
      { kind: "ok", sourceUrl: `https://${domain}/recipes/test` },
    );
    assertEquals(
      validateSourceUrl(`https://www.${domain}/recipes/test`),
      { kind: "ok", sourceUrl: `https://www.${domain}/recipes/test` },
    );
  }
});

Deno.test("validateSourceUrl rejects invalid URL-shaped inputs", () => {
  assertEquals(validateSourceUrl(undefined), { kind: "invalid_url" });
  assertEquals(validateSourceUrl(""), { kind: "invalid_url" });
  assertEquals(validateSourceUrl("   "), { kind: "invalid_url" });
  assertEquals(validateSourceUrl("not-a-url"), { kind: "invalid_url" });
  assertEquals(validateSourceUrl("ftp://www.liquor.com/recipes/negroni"), {
    kind: "invalid_url",
  });
});

Deno.test("validateSourceUrl rejects unsupported domains", () => {
  assertEquals(
    validateSourceUrl("https://example.com/negroni"),
    { kind: "unsupported_domain" },
  );
  assertEquals(
    validateSourceUrl("https://subdomain.liquor.com/negroni"),
    { kind: "unsupported_domain" },
  );
});
