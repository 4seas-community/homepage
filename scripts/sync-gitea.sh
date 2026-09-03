#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly repo_root="$(cd "${script_dir}/.." && pwd)"
# shellcheck source=operator-common.sh
source "${script_dir}/operator-common.sh"

mode="${1:---check}"
[[ "${mode}" == "--check" || "${mode}" == "--apply" ]] || fail \
  "usage: $0 [--check|--apply]"

prepare_gitea_access
cd "${repo_root}"

[[ -z "$(git status --porcelain)" ]] || fail "working tree is not clean"
[[ "$(git branch --show-current)" == "main" ]] || fail "switch to main before syncing"

origin_url="$(git remote get-url origin 2>/dev/null || true)"
[[ "${origin_url}" == "https://github.com/4seas-community/homepage.git" || \
   "${origin_url}" == "git@github.com:4seas-community/homepage.git" ]] || fail \
  "origin must be the GitHub homepage repository"

if ! git remote get-url gitea >/dev/null 2>&1; then
  git remote add gitea "${FOURSEAS_GITEA_URL}"
fi

git fetch --prune origin main
gitea_git fetch --prune gitea main

github_sha="$(git rev-parse origin/main)"
gitea_sha="$(git rev-parse gitea/main)"
head_sha="$(git rev-parse HEAD)"

[[ "${head_sha}" == "${github_sha}" ]] || fail \
  "local main is not GitHub main; run: git pull --ff-only origin main"

if [[ "${github_sha}" == "${gitea_sha}" ]]; then
  printf 'Gitea is already synchronized at %s.\n' "${github_sha}"
  exit 0
fi

git merge-base --is-ancestor "${gitea_sha}" "${github_sha}" || fail \
  "GitHub and Gitea have diverged; refusing to overwrite either repository"

node --test tests/*.test.mjs

printf 'GitHub main: %s\n' "${github_sha}"
printf 'Gitea main:  %s\n' "${gitea_sha}"
printf 'Commits to synchronize:\n'
git log --oneline "${gitea_sha}..${github_sha}"

if [[ "${mode}" == "--check" ]]; then
  printf '\nCheck complete. After review, run: %s --apply\n' "$0"
  exit 0
fi

gitea_git push gitea "${github_sha}:refs/heads/main"
gitea_git fetch gitea main
synced_sha="$(git rev-parse gitea/main)"
[[ "${synced_sha}" == "${github_sha}" ]] || fail "post-push Gitea SHA does not match GitHub"
printf 'Synchronized GitHub main to Gitea at %s. Production was not changed.\n' "${synced_sha}"
