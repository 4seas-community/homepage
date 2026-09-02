# 4Seas Homepage Agent Instructions

This repository is the static production homepage for `https://4seas.xyz/`.

Before any production deployment, read and follow [DEPLOYMENT.md](DEPLOYMENT.md) completely and use the installed `4seas-remote-ops` skill. The deployment guide is mandatory even for one-line HTML changes.

Key rules:

- Run `node --test tests/*.test.mjs` and preview locally before proposing a release.
- Compare the release payload with the active server release. Only intended production files may differ.
- Obtain an explicit execution-card confirmation immediately before the first production mutation.
- Use the SSH helper supplied by `4seas-remote-ops`; never weaken host-key or user-key checks.
- Never edit `/opt/4seas-home/current` or an active release in place.
- Create a new UTC-named release and switch `current` atomically.
- The homepage is reported as `legacy` by `4seas-site`. Do not enable, disable, recreate, or otherwise work around that boundary.
- Preserve the previous release as the rollback point. Do not delete releases during deployment.
- Validate from both the server and an independent local client. Roll back immediately if any required validation fails.
- When CSS or JavaScript changes, version its URL in `index.html` so Cloudflare cannot serve the previous asset for up to seven days.

The production payload allowlist is: `404.html`, `favicon.ico`, `index.html`, `css/`, `images/`, `js/`, and `RELEASE-MANIFEST.txt`. Tests, Git metadata, documentation, environment files, and credentials must never be included.
