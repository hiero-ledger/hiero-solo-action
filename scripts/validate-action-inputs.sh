#!/usr/bin/env bash
# Rejects unsupported inputs before anything is installed.
# Environment: NODE_VERSION, SOLO_VERSION, HIERO_VERSION, SHARD, REALM
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

node_major="$(grep -oE '^[0-9]+' <<< "${NODE_VERSION}" || true)"
if [[ -z "${node_major}" || "${node_major}" -lt 22 ]]; then
  fail "Node.js version must be 22 or higher. Solo does not support Node.js < 22. Got: ${NODE_VERSION}"
fi

if ! bash "${SCRIPTS_DIR}/version-lte.sh" "0.44.0" "${SOLO_VERSION}"; then
  fail "Solo ${SOLO_VERSION} is not supported. The action requires Solo 0.44.0 or newer."
fi

# Solo documents non-zero shard and realm numbers as requiring consensus node v0.61.0 or newer.
readonly MIN_SHARD_REALM_CONSENSUS_VERSION="0.61.0"
shard="${SHARD:-0}"
realm="${REALM:-0}"
[[ "${shard}" =~ ^[0-9]+$ ]] || fail "shard must be a non-negative integer. Got: ${shard}"
[[ "${realm}" =~ ^[0-9]+$ ]] || fail "realm must be a non-negative integer. Got: ${realm}"
if (( 10#${shard} != 0 || 10#${realm} != 0 )) && [[ -n "${HIERO_VERSION:-}" ]] \
  && ! bash "${SCRIPTS_DIR}/version-lte.sh" "${MIN_SHARD_REALM_CONSENSUS_VERSION}" "${HIERO_VERSION}"; then
  fail "A non-zero shard or realm requires consensus node v${MIN_SHARD_REALM_CONSENSUS_VERSION} or newer. Got hieroVersion: ${HIERO_VERSION}"
fi
