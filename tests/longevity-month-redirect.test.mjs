import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(join(root, "longevity/longevitymonth2026/index.html"), "utf8");
const target = "https://4seas.xyz/coliving/en/longevity/longevitymonth2026";

test("the public month path jumps to the English order page and keeps the query", () => {
  assert.match(html, new RegExp(`location\\.replace\\("${target}" \\+ location\\.search \\+ location\\.hash\\)`));
  assert.match(html, new RegExp(`http-equiv="refresh" content="0; url=${target}"`));
  assert.match(html, new RegExp(`rel="canonical" href="${target}"`));
  assert.match(html, new RegExp(`<a href="${target}">`));
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1|site-i18n/);
});
