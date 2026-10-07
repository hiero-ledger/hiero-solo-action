#!/usr/bin/env bash
# Deploys the JSON-RPC relay for node1 and forwards it.
# Environment: RELAY_PORT
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

solo relay node add -i node1 --deployment "${SOLO_DEPLOYMENT}" \
  --values-file "${VALUES_DIR}/relay-low-resources.yaml" --debug

show_services

# Same label Solo uses to find the relay; it also keeps the separate "-ws" websocket Service out.
relay_service="$(kubectl get svc -n "${SOLO_NAMESPACE}" -l app.kubernetes.io/name=relay \
  -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || true)"
if [[ -z "${relay_service}" ]]; then
  fail "JSON-RPC relay deploy reported success but no relay Service was found (label app.kubernetes.io/name=relay)."
fi

port_forward "${relay_service}" "${RELAY_PORT}" 7546
