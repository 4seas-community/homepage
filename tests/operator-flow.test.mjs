import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("GitHub is documented as the only homepage source of truth", () => {
  const readme = read("README.md");
  assert.match(readme, /GitHub is the only source of truth/);
  assert.match(readme, /Gitea is a downstream copy/);
});

test("Gitea sync is fast-forward-only and never force-pushes", () => {
  const script = read("scripts/sync-gitea.sh");
  assert.match(script, /merge-base --is-ancestor/);
  assert.match(script, /github_sha.*refs\/heads\/main/s);
  assert.doesNotMatch(script, /push[^\n]*(--force|-f\b)/);
});

test("production release uses an atomic switch and has rollback", () => {
  const script = read("scripts/release-244.sh");
  assert.match(script, /mv -Tf/);
  assert.match(script, /rollback_remote/);
  assert.match(script, /Post-switch validation failed/);
  assert.match(script, /--approve/);
  assert.match(script, /remote_site.*enabled.*legacy/s);
});

test("GitHub Actions runs tests but cannot deploy", () => {
  const workflow = read(".github/workflows/test.yml");
  assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
  assert.doesNotMatch(workflow, /(ssh|rsync|4seas-home|workflow_dispatch)/);
});
