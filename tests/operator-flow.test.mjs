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

test("release artifacts cannot carry macOS AppleDouble metadata", () => {
  const script = read("scripts/release-244.sh");

  // macOS tar turns unstrippable xattrs into "._name" members and hides them
  // from its own `tar -tzf`, so two releases reached the server with ~160 stray
  // files. Prevent them at pack time...
  assert.match(script, /COPYFILE_DISABLE=1 tar -C "\$\{stage\}"/);
  // ...and never describe an archive with the reader that hides them.
  assert.doesNotMatch(script, /tar -tzf "\$\{PLAN_ARTIFACT\}"/);
  assert.doesNotMatch(script, /tar -tzf "\$\{artifact\}"/);

  // The verifier must reject AppleDouble members, unsafe paths, and a file
  // count that disagrees with the staged tree.
  assert.match(script, /verify_artifact\(\) \{/);
  assert.match(script, /startswith\("\._"\)/);
  assert.match(script, /unsafe path/);
  assert.match(script, /archive holds %d files, expected %d/);

  // Both the planning and the applying path must run it.
  assert.match(script, /verify_artifact "\$\{artifact\}" "\$\{file_count\}"/);
  assert.match(script, /verify_artifact "\$\{PLAN_ARTIFACT\}" "\$\{PLAN_FILE_COUNT\}"/);
});

test("planning cleans up its staging directory", () => {
  const script = read("scripts/release-244.sh");

  // The EXIT trap runs after plan_release returns, so `stage` must not be a
  // function-local or `set -u` aborts the cleanup and leaks a full site copy.
  assert.doesNotMatch(script, /local [^\n]*\bstage\b/);
  assert.match(script, /^stage=""$/m);
  assert.match(script, /trap 'if \[\[ -n "\$\{stage\}" \]\]; then rm -rf "\$\{stage\}"; fi' EXIT/);
});

test("GitHub Actions runs tests but cannot deploy", () => {
  const workflow = read(".github/workflows/test.yml");
  assert.match(workflow, /node --test tests\/\*\.test\.mjs/);
  assert.doesNotMatch(workflow, /(ssh|rsync|4seas-home|workflow_dispatch)/);
});
