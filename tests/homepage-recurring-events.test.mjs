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

  assert.match(source, /eventsApiUrl: 'https:\/\/4seas\.xyz\/event\/api\/homepage-events'/)
  assert.match(source, /collection=\$\{encodeURIComponent\(normalizedCollection\)\}&limit=200/)
  assert.match(source, /collection === 'past' \? 'past' : 'upcoming'/)
  assert.match(source, /event\.startsAt/)
  assert.match(source, /event\.endsAt/)
  assert.match(source, /event\.venueName \|\| event\.address/)
  assert.match(source, /event\.coverUrl/)
  assert.match(source, /event\.detailUrl \|\| `https:\/\/4seas\.xyz\/event\/events\//)
  assert.doesNotMatch(source, /api\.sola\.day/)
  assert.doesNotMatch(source, /\/event\/list\?collection=/)
})

test("homepage event gallery and coliving links stay on 4Seas properties", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.match(source, /href="https:\/\/4seas\.xyz\/event"[^>]*>GO check out 4Seas Event Gallery<\/a>/)
  assert.match(source, /href="https:\/\/4seas\.xyz\/coliving"/)
  assert.doesNotMatch(source, /href="https:\/\/app\.sola\.day\/event\/4seas"/)
})

test("homepage uses the standalone Longevity Month poster", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")
  const styles = await readFile(new URL("../css/4seas-631dbf.webflow.css", import.meta.url), "utf8")
  const bannerStart = source.indexOf('<div class="swiper-wrapper banner_slider_wrapper">')
  const bannerEnd = source.indexOf('<div class="code_hide w-embed w-script">', bannerStart)
  const banner = source.slice(bannerStart, bannerEnd)
  const poster = await readFile(new URL("../images/zuzalu-longevity-month-2026.png", import.meta.url))

  assert.match(source, /<div class="swiper-slide banner_slider_item">\s*<div class="div-block-33 longevity-banner-frame">\s*<img src="images\/zuzalu-longevity-month-2026\.png" alt="Zuzalu Longevity Month 2026" class="image-13 longevity-banner-image">/)
  assert.equal((source.match(/class="swiper-slide banner_slider_item"/g) || []).length, 1)
  assert.doesNotMatch(source, /banner_slider_Swiper|swiper-bundle\.min\.js/)
  assert.doesNotMatch(banner, /<a\b/)
  assert.equal(poster.subarray(0, 8).toString("hex"), "89504e470d0a1a0a")
  assert.match(styles, /\.section-2 \.longevity-banner-image \{[\s\S]*?position: static;/)
})

test("homepage removes the two old event ads but keeps the organizer action", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.doesNotMatch(source, /href="https:\/\/ethchiangmai\.com\/"/)
  assert.doesNotMatch(source, /href="https:\/\/cypherpunk\.town\/"/)
  assert.match(source, /href="https:\/\/linktr\.ee\/tk4seas"[^>]*>[\s\S]*?I want to organize an event/)
})

test("homepage navigation links Coliving to its local route", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.match(source, /<a href="\/coliving" class="fn-navbar-link-box w-nav-link">Coliving<\/a>/)
  assert.doesNotMatch(source, />Tribes<\/a>/)
})

test("homepage no longer shows the September 2026 footer marker", async () => {
  const source = await readFile(new URL("../index.html", import.meta.url), "utf8")

  assert.doesNotMatch(source, /2026 Sep Updated/)
})
