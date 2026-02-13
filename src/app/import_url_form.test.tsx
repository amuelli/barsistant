/// <reference lib="deno.ns" />
import { assertStringIncludes } from "jsr:@std/assert";

Deno.test("import form performs POST submit and status GET readback", async () => {
  const formSource = await Deno.readTextFile(
    new URL("./import_url_form.tsx", import.meta.url),
  );

  assertStringIncludes(formSource, 'fetch("/api/imports", {');
  assertStringIncludes(formSource, "fetch(`/api/imports/${submission.jobId}`)");
  assertStringIncludes(
    formSource,
    "Import queued, but status refresh failed.",
  );
});
