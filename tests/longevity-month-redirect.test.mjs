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
  assert.match(html, /action\.indexOf\("\/pay\/start"\) !== -1 && method && method\.value === "peer"/);
  assert.match(html, /form\.setAttribute\("target", "_top"\)/);
  assert.match(html, /link\.setAttribute\("target", "_top"\)/);
  assert.doesNotMatch(html, /location\.replace|location\.assign|location\.href\s*=/);
  assert.doesNotMatch(html, /http-equiv="refresh"/);
  assert.doesNotMatch(html, /localhost|127\.0\.0\.1|site-i18n/);
});

test("links that leave the month page break out, and only Peer payment does", () => {
  const outsideSrc = html.slice(html.indexOf("function outside"), html.indexOf("function leaveForPeer"));
  const leaveSrc = html.slice(html.indexOf("function leaveForPeer"), html.indexOf("doc.addEventListener(\"click\""));
  const base = "https://4seas.xyz/coliving/en/longevity/longevitymonth2026?from=stay";
  const outside = new Function("base", `${outsideSrc}; return outside;`)(base);
  const leaveForPeer = new Function(`${leaveSrc}; return leaveForPeer;`)();

  assert.equal(outside("/coliving/zh/longevity/longevitymonth2026?from=stay"), false);
  assert.equal(outside("?new=1"), false);
  assert.equal(outside("#week"), false);
  assert.equal(outside("https://4seas.xyz/event"), true);
  assert.equal(outside("https://4seas.xyz/longevity/en/"), true);
  assert.equal(outside("https://4seas.xyz/"), true);

  function form(action, method) {
    return {
      target: "",
      getAttribute(name) { return name === "action" ? action : null; },
      querySelector() { return method ? { value: method } : null; },
      setAttribute(name, value) { if (name === "target") this.target = value; },
    };
  }

  const peer = form("/coliving/en/longevity/longevitymonth2026/pay/start", "peer");
  const wise = form("/coliving/en/longevity/longevitymonth2026/pay/start", "wise");
  const order = form("/coliving/en/longevity/longevitymonth2026/order", "peer");
  leaveForPeer(peer);
  leaveForPeer(wise);
  leaveForPeer(order);
  assert.equal(peer.target, "_top");
  assert.equal(wise.target, "");
  assert.equal(order.target, "");
});
