#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly repo_root="$(cd "${script_dir}/.." && pwd)"
readonly release_state_dir="${repo_root}/.release"
stage=""
readonly remote_base="/opt/4seas-home"
readonly public_url="https://4seas.xyz/"
# shellcheck source=operator-common.sh
source "${script_dir}/operator-common.sh"

usage() {
  printf 'Usage:\n'
  printf '  %s plan\n' "$0"
  printf '  %s apply <plan-file> --approve <release-name>\n' "$0"
  exit 2
}

require_clean_synced_main() {
  cd "${repo_root}"
  [[ -z "$(git status --porcelain)" ]] || fail "working tree is not clean"
  [[ "$(git branch --show-current)" == "main" ]] || fail "production releases require main"
  git fetch --prune origin main
  gitea_git fetch --prune gitea main

  local head_sha github_sha gitea_sha
  head_sha="$(git rev-parse HEAD)"
  github_sha="$(git rev-parse origin/main)"
  gitea_sha="$(git rev-parse gitea/main)"
  [[ "${head_sha}" == "${github_sha}" ]] || fail "local main is not GitHub main"
  [[ "${github_sha}" == "${gitea_sha}" ]] || fail \
    "Gitea is not synchronized; run scripts/sync-gitea.sh first"
}

hash_payload() {
  local directory="$1"
  (
    cd "${directory}"
    find 404.html favicon.ico index.html css images js -type f -exec shasum -a 256 {} + | sort
  )
}

write_plan_value() {
  printf '%s=%q\n' "$1" "$2"
}

# macOS tar stores extended attributes (com.apple.provenance survives `xattr -c`
# on macOS 26) as AppleDouble "._name" members, and then hides those same members
# again when listing the archive it just wrote. `tar -tzf` therefore cannot be
# trusted to describe an artifact built on macOS: the 20260904T105214Z and
# 20260906T023713Z releases both reached the server carrying ~160 stray "._"
# files and were refused there, after the upload. Read the archive with a
# platform-neutral reader so that failure surfaces locally instead.
verify_artifact() {
  local archive="$1" expected_files="$2"
  command -v python3 >/dev/null 2>&1 || fail \
    "python3 is required to verify the release artifact"
  python3 - "${archive}" "${expected_files}" <<'PYVERIFY' || fail \
    "artifact verification failed"
import sys, tarfile

archive, expected = sys.argv[1], int(sys.argv[2])
problems, files = [], 0

with tarfile.open(archive) as tar:
    for member in tar.getmembers():
        name = member.name
        parts = name.split("/")
        if name.startswith("/") or ".." in parts or name in (".", "./", ""):
            problems.append("unsafe path: %s" % name)
        if parts[-1].startswith("._"):
            problems.append("AppleDouble metadata: %s" % name)
        if member.isfile():
            files += 1
        elif not member.isdir():
            problems.append("not a regular file or directory: %s" % name)

if files != expected:
    problems.append("archive holds %d files, expected %d" % (files, expected))

for line in problems[:10]:
    print(line, file=sys.stderr)
if len(problems) > 10:
    print("... and %d more" % (len(problems) - 10), file=sys.stderr)

sys.exit(1 if problems else 0)
PYVERIFY
}

plan_release() {
  prepare_operator_access
  prepare_gitea_access
  require_clean_synced_main
  node --test tests/*.test.mjs

  local commit short timestamp release_name release_path artifact plan
  local artifact_sha index_sha file_count old_release remote_status remote_site
  commit="$(git rev-parse HEAD)"
  short="$(git rev-parse --short=7 HEAD)"
  timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
  release_name="${timestamp}-${short}"
  release_path="${remote_base}/releases/${release_name}"

  mkdir -p "${release_state_dir}"
  chmod 700 "${release_state_dir}"
  stage="$(mktemp -d "${release_state_dir}/stage.${release_name}.XXXXXX")"
  artifact="${release_state_dir}/${release_name}.tar.gz"
  plan="${release_state_dir}/${release_name}.plan"
  trap 'if [[ -n "${stage}" ]]; then rm -rf "${stage}"; fi' EXIT

  rsync -a 404.html favicon.ico index.html css images js "${stage}/"
  if command -v xattr >/dev/null 2>&1; then
    xattr -cr "${stage}"
  fi
  {
    printf 'project=4seas-homepage\n'
    printf 'prepared_at=%s\n' "${timestamp}"
    printf 'source=github.com/4seas-community/homepage\n'
    printf 'commit=%s\n' "${commit}"
    printf 'tests=node --test tests/*.test.mjs\n'
  } >"${stage}/RELEASE-MANIFEST.txt"

  # COPYFILE_DISABLE keeps macOS tar from emitting AppleDouble members for the
  # xattrs it cannot strip; GNU tar ignores the variable, so this stays portable.
  COPYFILE_DISABLE=1 tar -C "${stage}" -czf "${artifact}" \
    404.html favicon.ico index.html css images js RELEASE-MANIFEST.txt
  file_count="$(find "${stage}" -type f | wc -l | tr -d ' ')"
  verify_artifact "${artifact}" "${file_count}"
  artifact_sha="$(shasum -a 256 "${artifact}" | awk '{print $1}')"
  index_sha="$(shasum -a 256 "${stage}/index.html" | awk '{print $1}')"

  old_release="$(ssh_244 "readlink -f ${remote_base}/current")"
  [[ "${old_release}" == "${remote_base}/releases/"* ]] || fail \
    "current does not resolve beneath ${remote_base}/releases"
  ssh_244 "test ! -e '${release_path}'" || fail "target release already exists"
  ssh_244 "test -w '${remote_base}/releases'" || fail "release directory is not writable"
  ssh_244 "sudo -n /usr/sbin/nginx -t >/dev/null 2>&1" || fail "Nginx preflight failed"
  remote_status="$(ssh_244 "systemctl is-active nginx.service")"
  [[ "${remote_status}" == "active" ]] || fail "Nginx is not active"
  remote_site="$(ssh_244 "sudo -n /usr/local/sbin/4seas-site list | awk '\$1 == \"site\" {print}'")"
  [[ " ${remote_site} " == *" enabled "* && " ${remote_site} " == *" legacy "* ]] || fail \
    "homepage inventory changed; expected: enabled legacy"
  curl -fsS --connect-timeout 5 --max-time 15 -o /dev/null "${public_url}" || fail \
    "public homepage baseline failed"

  local local_hashes remote_hashes diff_file
  local_hashes="${release_state_dir}/${release_name}.local-sha256"
  remote_hashes="${release_state_dir}/${release_name}.remote-sha256"
  diff_file="${release_state_dir}/${release_name}.diff"
  hash_payload "${stage}" | grep -v 'RELEASE-MANIFEST.txt$' >"${local_hashes}"
  ssh_244 "cd '${old_release}' && find 404.html favicon.ico index.html css images js -type f -exec sha256sum {} + | sort" \
    >"${remote_hashes}"
  diff -u "${remote_hashes}" "${local_hashes}" >"${diff_file}" || true
  [[ -s "${diff_file}" ]] || fail "production payload is unchanged; no release is needed"

  {
    write_plan_value PLAN_COMMIT "${commit}"
    write_plan_value PLAN_RELEASE_NAME "${release_name}"
    write_plan_value PLAN_RELEASE_PATH "${release_path}"
    write_plan_value PLAN_OLD_RELEASE "${old_release}"
    write_plan_value PLAN_ARTIFACT "${artifact}"
    write_plan_value PLAN_ARTIFACT_SHA "${artifact_sha}"
    write_plan_value PLAN_INDEX_SHA "${index_sha}"
    write_plan_value PLAN_FILE_COUNT "${file_count}"
    write_plan_value PLAN_DIFF_FILE "${diff_file}"
  } >"${plan}"
  chmod 600 "${plan}" "${artifact}" "${local_hashes}" "${remote_hashes}" "${diff_file}"

  printf '\nPRODUCTION FILE DIFFERENCES\n'
  sed -n '1,240p' "${diff_file}"
  printf '\nEXECUTION CARD\n'
  printf 'Source:          GitHub main %s\n' "${commit}"
  printf 'Gitea mirror:   synchronized at the same commit\n'
  printf 'Target:          %s\n' "${release_path}"
  printf 'Rollback:        %s\n' "${old_release}"
  printf 'Artifact:        %s\n' "${artifact}"
  printf 'Artifact SHA:    %s\n' "${artifact_sha}"
  printf 'Files:           %s\n' "${file_count}"
  printf 'Actions:         upload, verify, extract, atomic current switch, nginx test/reload\n'
  printf 'Validation:      active target hash, Nginx, server HTTP, independent public HTTP/hash\n'
  printf 'Rollback trigger:any failed post-switch validation\n'
  printf 'Rollback action: atomically restore the recorded old release and reload Nginx\n'
  printf 'Unaffected:      old releases, databases, other sites, GitHub and Gitea refs\n'
  printf '\nAfter explicit human approval, run exactly:\n'
  printf '%q apply %q --approve %q\n' "$0" "${plan}" "${release_name}"
}

rollback_remote() {
  local old_release="$1"
  ssh_244 bash -s -- "${old_release}" "${remote_base}" <<'REMOTE'
set -euo pipefail
old_release="$1"
remote_base="$2"
next="${remote_base}/.current.rollback.$$"
rm -f "${next}"
ln -s "${old_release}" "${next}"
mv -Tf "${next}" "${remote_base}/current"
sudo -n /usr/sbin/nginx -t
sudo -n /usr/bin/systemctl reload nginx.service
curl -fsS --connect-timeout 5 --max-time 15 -o /dev/null https://4seas.xyz/
REMOTE
}

apply_release() {
  local plan_file="${1:-}"
  local approve_flag="${2:-}"
  local approved_name="${3:-}"
  [[ -n "${plan_file}" && "${approve_flag}" == "--approve" && -n "${approved_name}" ]] || usage

  local plan_dir
  plan_dir="$(cd "$(dirname "${plan_file}")" 2>/dev/null && pwd -P)" || fail "plan not found"
  [[ "${plan_dir}" == "${release_state_dir}" ]] || fail "plan must be inside ${release_state_dir}"
  # The plan is generated locally by this script and contains only quoted scalar values.
  # shellcheck disable=SC1090
  source "${plan_file}"

  [[ "${approved_name}" == "${PLAN_RELEASE_NAME}" ]] || fail "approval does not match release name"
  [[ "${PLAN_RELEASE_PATH}" == "${remote_base}/releases/${PLAN_RELEASE_NAME}" ]] || fail \
    "invalid release path in plan"
  [[ "${PLAN_RELEASE_NAME}" =~ ^[0-9]{8}T[0-9]{6}Z-[0-9a-f]{7}$ ]] || fail \
    "invalid release name in plan"
  [[ -r "${PLAN_ARTIFACT}" ]] || fail "artifact is missing"

  prepare_operator_access
  prepare_gitea_access
  require_clean_synced_main
  [[ "$(git rev-parse HEAD)" == "${PLAN_COMMIT}" ]] || fail "HEAD changed after planning"
  node --test tests/*.test.mjs
  [[ "$(shasum -a 256 "${PLAN_ARTIFACT}" | awk '{print $1}')" == "${PLAN_ARTIFACT_SHA}" ]] || fail \
    "artifact checksum changed after planning"
  verify_artifact "${PLAN_ARTIFACT}" "${PLAN_FILE_COUNT}"

  [[ "$(ssh_244 "readlink -f ${remote_base}/current")" == "${PLAN_OLD_RELEASE}" ]] || fail \
    "current release changed after planning; create a new plan"
  ssh_244 "test ! -e '${PLAN_RELEASE_PATH}'" || fail "target release now exists"

  local upload_path="${PLAN_RELEASE_PATH}.upload.tar.gz"
  ssh_244 "umask 027; test ! -e '${upload_path}'; cat >'${upload_path}'" <"${PLAN_ARTIFACT}"
  remote_artifact_sha="$(ssh_244 "sha256sum '${upload_path}' | awk '{print \$1}'")"
  [[ "${remote_artifact_sha}" == "${PLAN_ARTIFACT_SHA}" ]] || fail "remote artifact checksum mismatch"

  ssh_244 bash -s -- \
    "${PLAN_OLD_RELEASE}" "${PLAN_RELEASE_PATH}" "${upload_path}" \
    "${PLAN_INDEX_SHA}" "${PLAN_FILE_COUNT}" "${remote_base}" <<'REMOTE'
set -Eeuo pipefail
old_release="$1"
target="$2"
upload="$3"
expected_index_sha="$4"
expected_file_count="$5"
remote_base="$6"
switched=0

rollback() {
  next="${remote_base}/.current.rollback.$$"
  rm -f "${next}"
  ln -s "${old_release}" "${next}"
  mv -Tf "${next}" "${remote_base}/current"
  sudo -n /usr/sbin/nginx -t
  sudo -n /usr/bin/systemctl reload nginx.service
  curl -fsS --connect-timeout 5 --max-time 15 -o /dev/null https://4seas.xyz/
}

on_error() {
  rc=$?
  if [[ "${switched}" == "1" ]]; then
    printf 'Post-switch validation failed; restoring %s\n' "${old_release}" >&2
    rollback || true
  fi
  exit "${rc}"
}
trap on_error ERR

[[ "$(readlink -f "${remote_base}/current")" == "${old_release}" ]]
[[ ! -e "${target}" ]]
tar -tzf "${upload}" | awk '
  /^\// || /(^|\/)\.\.($|\/)/ || /^\.\/?$/ { bad=1 }
  END { exit bad ? 1 : 0 }
'
mkdir -m 755 "${target}"
tar -xzf "${upload}" -C "${target}"
effective_mode="$(stat -c %a "${target}" | sed 's/.*\(...\)$/\1/')"
[[ "${effective_mode}" == "755" ]]
[[ "$(find "${target}" -type f | wc -l | tr -d ' ')" == "${expected_file_count}" ]]
[[ "$(sha256sum "${target}/index.html" | awk '{print $1}')" == "${expected_index_sha}" ]]
[[ -r "${target}/RELEASE-MANIFEST.txt" ]]
rm -f "${upload}"

next="${remote_base}/.current.next.$$"
ln -s "${target}" "${next}"
mv -Tf "${next}" "${remote_base}/current"
switched=1
sudo -n /usr/sbin/nginx -t
sudo -n /usr/bin/systemctl reload nginx.service
[[ "$(readlink -f "${remote_base}/current")" == "${target}" ]]
[[ "$(sha256sum "${remote_base}/current/index.html" | awk '{print $1}')" == "${expected_index_sha}" ]]
[[ "$(systemctl is-active nginx.service)" == "active" ]]
curl -fsS --connect-timeout 5 --max-time 15 -o /dev/null https://4seas.xyz/
trap - ERR
REMOTE

  local public_copy="${release_state_dir}/${PLAN_RELEASE_NAME}.public.html"
  if ! curl -fsS --connect-timeout 5 --max-time 20 "${public_url}" >"${public_copy}" || \
     [[ "$(shasum -a 256 "${public_copy}" | awk '{print $1}')" != "${PLAN_INDEX_SHA}" ]]; then
    printf 'Independent public validation failed; rolling back.\n' >&2
    rollback_remote "${PLAN_OLD_RELEASE}"
    fail "release rolled back to ${PLAN_OLD_RELEASE}"
  fi

  printf 'Release active:  %s\n' "${PLAN_RELEASE_PATH}"
  printf 'Rollback point:  %s\n' "${PLAN_OLD_RELEASE}"
  printf 'Artifact SHA:    %s\n' "${PLAN_ARTIFACT_SHA}"
  printf 'Validation:      Nginx active; server and independent public checks passed\n'
  printf 'Rollback used:   no\n'
}

case "${1:-}" in
  plan)
    [[ "$#" == "1" ]] || usage
    plan_release
    ;;
  apply)
    shift
    apply_release "$@"
    ;;
  *)
    usage
    ;;
esac
