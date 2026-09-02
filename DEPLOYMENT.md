# 4Seas Homepage Production Deployment

This runbook is written for Codex and for teammates who have the same scoped 4Seas homepage permissions. It incorporates the failure and rollback lessons from the September 2026 footer release.

## Scope and prerequisites

- Site: `https://4seas.xyz/`
- Remote base: `/opt/4seas-home`
- Releases: `/opt/4seas-home/releases/<UTC timestamp>-<revision>`
- Active pointer: `/opt/4seas-home/current`
- Rollback: atomically point `current` to the previously recorded release.

Every operator must use their own SSH account and private key. Their local remote-ops helper must pin:

- the operator's expected public-key fingerprint;
- the server's verified ED25519 host-key fingerprint;
- strict host-key checking.

Do not copy another operator's private key, reuse their hard-coded identity helper, or weaken fingerprint checks. The installed `4seas-remote-ops` skill and its live host profile are authoritative; read them before operating production.

## Non-negotiable invariants

1. Never edit `current` or an active release in place.
2. Never deploy directly from an uninspected working tree.
3. Never include `.git`, tests, docs, `.env` files, keys, credentials, or unrelated files in the payload.
4. Never delete old releases as part of deployment.
5. The homepage is currently `legacy` in `4seas-site`; inventory is read-only for this deployment. Do not call `enable`, `disable`, or `new` for it.
6. Capture the active release and health baseline before mutation.
7. Show an execution card and obtain explicit confirmation immediately before mutation.
8. Stop at the first unexpected result. If a switched release fails validation, roll back immediately.

## 1. Inspect and validate locally

From the repository root:

```bash
git status --short
git diff --check
git diff -- index.html css tests
node --test tests/*.test.mjs
```

Confirm the diff contains only the requested change. For a tiny footer update, verify that no event logic, links, images, or unrelated styles changed.

Preview with a local server:

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/` in a browser. Check desktop and narrow/mobile widths, scroll to the bottom, and confirm there are no console or layout errors relevant to the change.

## 2. Handle long-lived asset caching

Cloudflare currently serves static CSS with `cache-control: public, max-age=604800`. Replacing a CSS file at the same URL can leave users on the previous CSS for up to seven days even when the new HTML is live.

Therefore:

- For HTML-only changes, prefer existing classes when that produces the required design.
- If CSS or JavaScript content changes, update its reference in `index.html` with a release version, for example:

```html
<link href="css/4seas-631dbf.webflow.css?v=20260902" rel="stylesheet" type="text/css">
```

- Add or update a test that asserts the intended versioned asset URL.
- During public validation, fetch that exact versioned URL and compare its content hash with the staged file.

Do not assume HTTP 200 means the new asset was served. Compare hashes.

## 3. Build an allowlisted artifact

Create an isolated temporary directory. Never archive the repository root directly.

```bash
FOURSEAS_STAGE_DIR="$(mktemp -d /tmp/4seas-home-stage.XXXXXX)"
rsync -a 404.html favicon.ico index.html css images js "${FOURSEAS_STAGE_DIR}/"
```

On macOS, remove extended attributes from the temporary copy only:

```bash
xattr -cr "${FOURSEAS_STAGE_DIR}"
```

Add `RELEASE-MANIFEST.txt` to the temporary directory with:

- project name;
- UTC preparation time;
- source commit or dirty-tree base commit;
- concise change description;
- tests and preview performed.

Use the editing tool to create the manifest; do not put secrets or credentials in it.

Scan the payload before packaging:

```bash
find "${FOURSEAS_STAGE_DIR}" -type f \
  \( -name '.env' -o -name '.env.*' -o -name '*.pem' -o -name '*.key' \
     -o -name '*.p12' -o -name '*.pfx' -o -iname '*credential*' \
     -o -iname '*secret*' \)
```

Investigate any result. Also scan text files for private-key headers and credential assignments without printing suspected secret values.

Package explicit top-level entries. Do not archive `.`: a `mktemp` directory is commonly mode `700`, and archiving its root metadata can overwrite the remote release directory mode and cause Nginx HTTP 403.

```bash
FOURSEAS_ARTIFACT="/tmp/4seas-home-<UTC>-<revision>.tar.gz"
tar -C "${FOURSEAS_STAGE_DIR}" -czf "${FOURSEAS_ARTIFACT}" \
  404.html favicon.ico index.html css images js RELEASE-MANIFEST.txt
```

Verify that the archive has no absolute path, `..` component, or root `./` metadata entry. Record:

- artifact SHA-256;
- byte size;
- file count;
- `index.html` SHA-256;
- changed CSS/JavaScript SHA-256 values.

## 4. Run read-only production preflight

Use `scripts/preflight.sh` from the installed `4seas-remote-ops` skill. Then collect homepage-specific baseline evidence with the pinned SSH helper:

- `sudo -n 4seas-site list`;
- `readlink -f /opt/4seas-home/current`;
- confirm the result is beneath `/opt/4seas-home/releases/`;
- Nginx active state and bounded recent journal;
- `sudo -n /usr/sbin/nginx -t`;
- public homepage HTTP status and identifying content;
- disk space and write permission on `releases/`;
- proposed target and temporary upload paths do not exist.

Generate a new target name. Never reuse a failed or previously active release:

```text
/opt/4seas-home/releases/YYYYMMDDTHHMMSSZ-<revision>-<description>
```

## 5. Compare production file content

Before confirmation, create sorted SHA-256 inventories of:

- every allowlisted file in the active release, excluding its manifest;
- every allowlisted file in the staged payload, excluding its manifest.

Normalize both paths to relative names and diff them. The file count and every unchanged file hash must match. The only differing hashes should be the files named in the requested change.

This check caught unintended payload drift and should not be skipped for a one-line update.

## 6. Present the execution card

The card must state:

- exact site and remote base;
- exact new release directory;
- exact artifact SHA-256 and intended file differences;
- current release used as rollback point;
- upload, checksum, extraction, atomic switch, Nginx test/reload actions;
- server-side and independent local validations;
- rollback trigger and exact rollback action;
- confirmation that no old release, other site, database, or Git remote will be changed.

Obtain explicit confirmation. If the target, artifact checksum, permission strategy, commands, or rollback plan materially changes, show a new card and reconfirm.

## 7. Upload and stage safely

Use the pinned SSH helper, not bare `ssh` or relaxed host-key options. Stream the archive to a uniquely named temporary upload file inside `releases/`, then compare the remote SHA-256 with the recorded local SHA-256.

Before extraction:

1. Recheck `current` still equals the recorded old release.
2. Recheck the target and upload path did not exist before this deployment.
3. Reject unsafe archive paths.
4. Create the target explicitly with effective mode `755`.
5. Extract the archive, which must not contain root-directory metadata.

The parent `releases/` directory uses setgid. A correctly accessible target may therefore report mode `2755`. Validate the effective access bits, not strict string equality:

```bash
FOURSEAS_TARGET_MODE="$(stat -c %a "${FOURSEAS_TARGET}")"
FOURSEAS_EFFECTIVE_MODE="$(printf '%s' "${FOURSEAS_TARGET_MODE}" | sed 's/.*\(...\)$/\1/')"
test "${FOURSEAS_EFFECTIVE_MODE}" = 755
```

`2755` is valid: the leading `2` preserves group inheritance. `2700` is invalid because Nginx cannot traverse the directory.

After extraction, verify file count, key file hashes, expected marker content, and readable/traversable path components with `namei -l`. Remove only the temporary upload archive after all staged checks pass.

Do not modify the staged release after it passes validation. If staging is wrong, leave it inactive and create a new release for the corrected attempt.

## 8. Switch atomically

Immediately before switching, refresh `4seas-site list`, current release, target integrity, Nginx state, and public baseline again.

Create a uniquely named temporary symlink beside `current`, then atomically rename it over `current` on the same filesystem:

```bash
ln -s "${FOURSEAS_TARGET}" "${FOURSEAS_NEXT_LINK}"
mv -Tf "${FOURSEAS_NEXT_LINK}" /opt/4seas-home/current
```

Then run:

```bash
sudo -n /usr/sbin/nginx -t
sudo -n /usr/bin/systemctl reload nginx.service
```

The switch command must have an error handler that restores the recorded old release if any post-switch server validation fails.

## 9. Validate from two sides

From the server:

- `current` resolves exactly to the new release;
- Nginx is active;
- the active `index.html` hash matches staging;
- the expected new content exists;
- public `https://4seas.xyz/` returns HTTP 200 and the expected content;
- bounded Nginx journal shows a successful reload and no relevant failure.

From the operator's computer, independently repeat:

- public homepage HTTP 200;
- expected content marker present;
- changed versioned CSS/JavaScript URL returns the staged SHA-256;
- browser rendering at the changed section matches the local preview.

If any required validation fails, atomically restore the old release, test and reload Nginx, and verify recovery from both sides. Do not improvise a live fix inside the active release.

## 10. Report and retain rollback

The final audit summary must include:

- active new release;
- previous rollback release;
- artifact and key file hashes;
- local test result;
- server and local HTTP/content evidence;
- Nginx state and reload evidence;
- whether rollback occurred;
- cache status or any remaining risk.

Keep both the new and previous releases. Cleanup is a separate reviewed task.

## Failure patterns from September 2026

### HTTP 403 immediately after switching

Check `namei -l <release>/index.html` and `stat -c %a <release>`. A top-level release mode of `2700` blocks Nginx. Roll back first. Create a new release whose effective access bits are `755`; accept the server's expected setgid form `2755`.

### HTML is new but CSS is old

Check response headers and compare content hashes. `cf-cache-status: HIT`, a nonzero `age`, and a seven-day `max-age` indicate Cloudflare is serving the previous same-URL asset. Use a versioned asset URL in `index.html` and validate that exact URL. Do not declare success based only on HTTP 200.

### Validation logic rejects `2755`

Do not compare the full numeric mode to the literal string `755`. Compare the last three effective access digits. The setgid bit is intentional on this server.
