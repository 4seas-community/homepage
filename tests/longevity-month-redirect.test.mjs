import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(join(root, "longevity/longevitymonth2026/index.html"), "utf8");
const page = "https://4seas.xyz/coliving/en/longevity/longevitymonth2026";
const stay = "https://4seas.xyz/longevity/longevitymonth2026/";

test("the public month path shows the order page and keeps this address", () => {
  assert.match(html, new RegExp(`<iframe id="month" title="Longevity Month 2026"\\s+src="${page}"></iframe>`));
  assert.match(html, /var extra = location\.search \+ location\.hash;/);
  assert.match(html, /if \(extra\) frame\.src = page \+ extra;/);
  assert.match(html, new RegExp(`rel="canonical" href="${stay}"`));
  assert.match(html, /function leaveForm\(form\) \{\n        if \(form && form\.setAttribute\) form\.setAttribute\("target", "_top"\);\n      \}/);
  assert.match(html, /leaveForm\(event\.target\);/);
  assert.match(html, /link\.setAttribute\("target", "_top"\)/);
  assert.doesNotMatch(html, /location\.replace|location\.assign|location\.href\s*=/);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
  assert.match(html, /doc\.__monthStay = true;/);
  assert.doesNotMatch(html, /documentElement\.dataset/);
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1|site-i18n/);
});

test("links off this page and every form open in the top window", () => {
  const outsideSrc = html.slice(html.indexOf("function outside"), html.indexOf("function leaveForm"));
  const leaveSrc = html.slice(html.indexOf("function leaveForm"), html.indexOf("doc.addEventListener(\"click\""));
  const base = "https://4seas.xyz/coliving/en/longevity/longevitymonth2026?from=stay";
  const outside = new Function("base", "here", `${outsideSrc}; return outside;`)(base, new URL(base));
  const leaveForm = new Function(`${leaveSrc}; return leaveForm;`)();

  assert.equal(outside("/coliving/zh/longevity/longevitymonth2026?from=stay"), false);
  assert.equal(outside("/coliving/en/longevity/longevitymonth2026/pay"), false);
  assert.equal(outside("/coliving/en/longevity/longevitymonth2026-other"), true);
  assert.equal(outside("?new=1"), false);
  assert.equal(outside("#week"), false);
  assert.equal(outside("https://4seas.xyz/event"), true);
  assert.equal(outside("https://4seas.xyz/longevity/en/"), true);
  assert.equal(outside("https://4seas.xyz/"), true);

  const localBase = "http://localhost:3300/coliving/en/longevity/longevitymonth2026";
  const localOutside = new Function("base", "here", `${outsideSrc}; return outside;`)(localBase, new URL(localBase));
  assert.equal(localOutside("/coliving/zh/longevity/longevitymonth2026"), false);
  assert.equal(localOutside("http://localhost:3300/coliving/en/start"), true);

  function form() {
    return {
      target: "",
      setAttribute(name, value) { if (name === "target") this.target = value; },
    };
  }

  for (const sample of [form(), form(), form()]) {
    leaveForm(sample);
    assert.equal(sample.target, "_top");
  }
});

test("the page script itself opens forms and outside links in the top window", () => {
  const script = html.slice(html.indexOf("<script>") + "<script>".length, html.indexOf("</script>"));
  const listeners = [];
  const order = {
    target: "",
    setAttribute(name, value) { if (name === "target") this.target = value; },
  };
  const button = {
    nodeType: 1,
    closest(sel) {
      if (sel === "form") return order;
      return null;
    },
  };
  const outsideLink = {
    href: "https://evil.example/phish",
    targetAttr: "",
    nodeType: 1,
    getAttribute(name) { return name === "href" ? this.href : name === "target" ? this.targetAttr : null; },
    setAttribute(name, value) { if (name === "target") this.targetAttr = value; },
    closest(sel) { return sel === "a[href]" ? this : null; },
  };
  const insideLink = {
    href: "/coliving/zh/longevity/longevitymonth2026?from=stay",
    nodeType: 1,
    getAttribute(name) { return name === "href" ? this.href : null; },
    setAttribute() { throw new Error("a month link was sent to the top window"); },
    closest(sel) { return sel === "a[href]" ? this : null; },
  };
  const doc = {
    documentElement: {},
    addEventListener(type, fn) { listeners.push({ type, fn }); },
  };
  const frame = {
    src: "",
    contentDocument: doc,
    contentWindow: { location: { href: `${page}?from=stay` } },
    addEventListener(type, fn) { listeners.push({ type, fn, frame: true }); },
  };
  const fakeDocument = { getElementById() { return frame; } };
  const fakeLocation = { search: "?from=stay", hash: "#week" };
  new Function("document", "location", script)(fakeDocument, fakeLocation);
  assert.equal(frame.src, `${page}?from=stay#week`);
  listeners.find((entry) => entry.frame && entry.type === "load").fn();
  const click = listeners.find((entry) => entry.type === "click");
  const submit = listeners.find((entry) => entry.type === "submit");
  click.fn({ target: button });
  click.fn({ target: outsideLink });
  click.fn({ target: insideLink });
  const peer = { target: "", setAttribute(name, value) { if (name === "target") this.target = value; } };
  submit.fn({ target: peer });
  assert.equal(order.target, "_top");
  assert.equal(outsideLink.targetAttr, "_top");
  assert.equal(peer.target, "_top");
});
