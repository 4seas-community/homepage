# 4Seas Homepage

Static source for [4seas.xyz](https://4seas.xyz/).

GitHub is the only source of truth for Homepage development:

```text
branch / pull request
        ↓
GitHub main + tests
        ↓ local, manually approved sync
Gitea 4Seas/homepage
        ↓ local release plan + human approval
244 immutable release → validation → success or automatic rollback
```

Gitea is a downstream copy used by 4Seas operations. Do not develop on, merge
into, or force-push its `main` branch. Production is never changed by a GitHub
push or a Gitea sync alone.

## Local preview

```bash
node --test tests/*.test.mjs
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/` and inspect both desktop and narrow layouts.

## Operator setup

The sync and release scripts use each operator's own SSH account and key. Export:

```bash
export FOURSEAS_SSH_USER=<your-244-username>
export FOURSEAS_SSH_KEY="$HOME/.ssh/<your-private-key>"
export FOURSEAS_EXPECTED_USER_KEY_FINGERPRINT='SHA256:<your-public-key-fingerprint>'
```

Get the public-key fingerprint locally:

```bash
ssh-keygen -lf "${FOURSEAS_SSH_KEY}.pub"
```

The scripts require already-verified host keys for both SSH endpoints and refuse
to weaken strict host-key checking. Ask a 4Seas administrator to create your
244/Gitea accounts and grant the same scoped homepage permissions before use.
Never share another operator's private key.

## Sync GitHub to Gitea

After a pull request has been reviewed, tests pass, and it is merged into GitHub
`main`:

```bash
git switch main
git pull --ff-only origin main
./scripts/sync-gitea.sh --check
./scripts/sync-gitea.sh --apply
```

The script runs local tests, requires a clean checkout at GitHub `main`, and only
allows a fast-forward update of Gitea. It refuses divergence and never force-pushes.

## Release to 244

First prepare an immutable artifact and execution card:

```bash
./scripts/release-244.sh plan
```

Review the printed file differences, target release, artifact checksum, active
rollback release, validation steps, and rollback action. After explicit human
approval, run the exact apply command printed by the plan.

The release script uploads a new release, switches `current` atomically, tests
and reloads Nginx, validates from the host and from the operator's computer, and
automatically restores the previous release if any post-switch check fails.

Read [DEPLOYMENT.md](DEPLOYMENT.md) before production work. It is the detailed
runbook and remains authoritative when a script stops for an unexpected state.
