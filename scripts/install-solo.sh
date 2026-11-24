#!/usr/bin/env bash
# Installs the Solo CLI, after clearing state a self-hosted runner may keep from an earlier job.
# Solo downloads the Helm version it pins into ~/.solo/bin and runs that copy, so Helm is not installed here.
# Environment: SOLO_VERSION
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

rm -rf "${HOME}/.solo"
kind delete cluster --name "${SOLO_CLUSTER_NAME}" || true

npm install -g "@hiero-ledger/solo@${SOLO_VERSION#v}"
solo --version
