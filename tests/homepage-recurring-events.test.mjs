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

test("homepage events load from the first-party event mirror API", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.match(source, /eventsApiUrl: 'https:\/\/event\.4seas\.xyz\/api\/homepage-events'/)
  assert.match(source, /collection=\$\{encodeURIComponent\(normalizedCollection\)\}&limit=200/)
  assert.match(source, /collection === 'past' \? 'past' : 'upcoming'/)
  assert.match(source, /event\.startsAt/)
  assert.match(source, /event\.endsAt/)
  assert.match(source, /event\.venueName \|\| event\.address/)
  assert.match(source, /event\.coverUrl/)
  assert.match(source, /event\.detailUrl \|\| `https:\/\/event\.4seas\.xyz\/en\/events\//)
  assert.doesNotMatch(source, /api\.sola\.day/)
  assert.doesNotMatch(source, /\/event\/list\?collection=/)
})

test("homepage event gallery and coliving links stay on 4Seas properties", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.match(source, /href="https:\/\/event\.4seas\.xyz\/en"[^>]*>GO check out 4Seas Event Gallery<\/a>/)
  assert.match(source, /href="https:\/\/4seas\.xyz\/coliving"/)
  assert.doesNotMatch(source, /href="https:\/\/app\.sola\.day\/event\/4seas"/)
})
