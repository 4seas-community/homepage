import { readFile } from "node:fs/promises"
import test from "node:test"
import assert from "node:assert/strict"

test("homepage recurring event labels use the correct weekdays", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.match(source, /<h4 class="heading-6">AI Goddess<\/h4>[\s\S]*?<div class="text-block-6">Every Monday<\/div>/)
  assert.match(source, /<h4 class="heading-6">Screening<\/h4>[\s\S]*?<div class="text-block-6">Every Saturday<\/div>/)
  assert.doesNotMatch(source, /<h4 class="heading-6">AI Goddess<\/h4>[\s\S]*?<div class="text-block-6">Every Wednesday<\/div>/)
  assert.doesNotMatch(source, /<h4 class="heading-6">Screening<\/h4>[\s\S]*?<div class="text-block-6">Every Friday<\/div>/)
})
