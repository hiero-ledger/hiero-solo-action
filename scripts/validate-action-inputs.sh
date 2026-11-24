#!/usr/bin/env bash
# Rejects unsupported inputs before anything is installed.
# Environment: NODE_VERSION, SOLO_VERSION
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
