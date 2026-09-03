#!/usr/bin/env bash

# Shared identity and host-key checks for 4Seas operator scripts.
# This file is sourced; callers enable their own strict shell options.

readonly FOURSEAS_HOST="149.28.158.244"
readonly FOURSEAS_SSH_PORT="22"
readonly FOURSEAS_GITEA_PORT="222"
readonly FOURSEAS_HOST_ED25519="SHA256:0kinJ55Bv1H8BAZ8aYchE5PvyJSjV7DgVOT9NS8vO48"
readonly FOURSEAS_GITEA_ED25519="SHA256:b491ZKm25t2ocFiMigABX8pS5qzMb8y0D8h4gI4/UZg"
readonly FOURSEAS_GITEA_URL="ssh://git@${FOURSEAS_HOST}:${FOURSEAS_GITEA_PORT}/4Seas/homepage.git"

operator_user="${FOURSEAS_SSH_USER:-}"
operator_key="${FOURSEAS_SSH_KEY:-${HOME}/.ssh/id_rsa}"
operator_expected_key="${FOURSEAS_EXPECTED_USER_KEY_FINGERPRINT:-}"

fail() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

require_operator_identity() {
  [[ -n "${operator_user}" ]] || fail "set FOURSEAS_SSH_USER to your own 244 username"
  [[ -n "${operator_expected_key}" ]] || fail \
    "set FOURSEAS_EXPECTED_USER_KEY_FINGERPRINT to your public-key fingerprint"
  [[ -r "${operator_key}" && -r "${operator_key}.pub" ]] || fail \
    "SSH key or public key is not readable: ${operator_key}"
  [[ "${operator_key}" != *[[:space:]]* ]] || fail "SSH key path must not contain whitespace"

  local actual
  actual="$(ssh-keygen -lf "${operator_key}.pub" 2>/dev/null | awk '{print $2}')"
  [[ "${actual}" == "${operator_expected_key}" ]] || fail \
    "SSH key fingerprint does not match FOURSEAS_EXPECTED_USER_KEY_FINGERPRINT"
}

require_pinned_host_key() {
  local port="$1"
  local expected="$2"
  local lookup="${FOURSEAS_HOST}"
  [[ "${port}" == "22" ]] || lookup="[${FOURSEAS_HOST}]:${port}"

  local known fingerprints
  known="$(ssh-keygen -F "${lookup}" 2>/dev/null | awk '!/^#/ {print}')"
  [[ -n "${known}" ]] || fail \
    "${lookup} is absent from known_hosts; verify its host key with a 4Seas administrator"
  fingerprints="$(printf '%s\n' "${known}" | ssh-keygen -lf - 2>/dev/null | awk '{print $2}')"
  grep -Fqx "${expected}" <<<"${fingerprints}" || fail \
    "the verified ED25519 host-key fingerprint is absent for ${lookup}"
}

prepare_operator_access() {
  require_operator_identity
  require_pinned_host_key "${FOURSEAS_SSH_PORT}" "${FOURSEAS_HOST_ED25519}"
}

prepare_gitea_access() {
  require_operator_identity
  require_pinned_host_key "${FOURSEAS_GITEA_PORT}" "${FOURSEAS_GITEA_ED25519}"
}

ssh_244() {
  /usr/bin/ssh \
    -p "${FOURSEAS_SSH_PORT}" \
    -o BatchMode=yes \
    -o IdentitiesOnly=yes \
    -o IdentityFile="${operator_key}" \
    -o StrictHostKeyChecking=yes \
    -o HostKeyAlgorithms=ssh-ed25519 \
    -o ConnectTimeout=10 \
    -o ServerAliveInterval=15 \
    -o ServerAliveCountMax=2 \
    "${operator_user}@${FOURSEAS_HOST}" "$@"
}

gitea_git() {
  local ssh_command
  ssh_command="/usr/bin/ssh -p ${FOURSEAS_GITEA_PORT} -o BatchMode=yes"
  ssh_command+=" -o IdentitiesOnly=yes -o IdentityFile=${operator_key}"
  ssh_command+=" -o StrictHostKeyChecking=yes -o HostKeyAlgorithms=ssh-ed25519"
  ssh_command+=" -o ConnectTimeout=10"
  git -c "core.sshCommand=${ssh_command}" "$@"
}
