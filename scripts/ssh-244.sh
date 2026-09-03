#!/usr/bin/env bash
set -euo pipefail

readonly script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=operator-common.sh
source "${script_dir}/operator-common.sh"

prepare_operator_access
ssh_244 "$@"
