# Coliving community introduction · release handoff

This PR prepares the reviewed Coliving page for a separately approved release.
No server deployment, Gitea sync, or application change has been executed.

- `/coliving-community/` renders English without JavaScript.
- Explicit routes: `/coliving-community/en/`, `/coliving-community/zh/`, `/coliving-community/th/`.
- The language selector preserves query and section. Storage denial does not break the page.
- Root navigation adds Coliving immediately after Longevity.
- Apply links retain `https://4seas.xyz/coliving/en/start`; consultations retain `https://linktr.ee/4seascoliving`.
- `/coliving/` is the existing application; this introduction does not replace it.
- The six-photo hero, health/community content, two rows of activity cards, monthly package, group options, Nimman and Mountain View sections match the accepted local V46.
- Only dependencies actually referenced by the page are included. No preview site, research folder, credentials, applicant data or database content is shipped.

## Review locally

```sh
node --test tests/*.test.mjs
python3 -m http.server 4199 --bind 127.0.0.1
python3 scripts/validate-coliving.py --base-url http://127.0.0.1:4199/
```

Inspect the root navigation and all three locales at desktop and mobile widths.
Check language links, menu open/close, all photo assets, package/group apply links
and consultation links. The source photo library is existing 4Seas material;
brightness is applied by display filters, preserving original photographs.

## Operator release

Follow DEPLOYMENT.md after merge: synchronize GitHub main and Gitea, inspect the
active release, generate an allowlisted artifact and diff, and obtain the explicit
execution-card confirmation before any production mutation. Ensure the static
homepage serves `/coliving-community/` and all nested locale/assets paths; the
existing application proxy at `/coliving/` must remain intact. The release script
checks exact response hashes on the server and from the operator client, and
rolls back on failure.
