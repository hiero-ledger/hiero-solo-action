#!/usr/bin/env bash
# Deploys the mirror node and forwards its REST, gRPC, web3 and Java REST services, and with ENABLE_INGRESS its
# ingress, which serves all of them on one port.
# Environment: MIRROR_NODE_VERSION, ENABLE_INGRESS, MIRROR_NODE_PORT_INGRESS, MIRROR_NODE_PORT_REST,
#              MIRROR_NODE_PORT_GRPC, MIRROR_NODE_PORT_WEB3_REST, JAVA_REST_API_PORT
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

# Solo names the mirror node Helm release "mirror-<id>", and this is the deployment's first mirror node.
readonly MIRROR_RELEASE_NAME="mirror-1"

mirror_args=(--pinger)
if [[ -n "${MIRROR_NODE_VERSION}" ]]; then
  mirror_args+=(--mirror-node-version "${MIRROR_NODE_VERSION}")
fi
if [[ "${ENABLE_INGRESS}" == "true" ]]; then
  mirror_args+=(--enable-ingress)
  # With --enable-ingress, Solo forwards the ingress controller to localhost:${MIRROR_NODE_PORT} itself. Older Solo
  # releases default that to 8081 and newer ones to 38081, so set it instead of relying on the default.
  export MIRROR_NODE_PORT="${MIRROR_NODE_PORT_INGRESS}"
fi

solo mirror node add --cluster-ref "${SOLO_CLUSTER_REF}" --deployment "${SOLO_DEPLOYMENT}" "${mirror_args[@]}" --debug

show_services

if ! kubectl get svc "${MIRROR_RELEASE_NAME}-rest" -n "${SOLO_NAMESPACE}" >/dev/null 2>&1; then
  fail "Mirror node deploy reported success but no mirror REST service ${MIRROR_RELEASE_NAME}-rest was found."
fi

if [[ "${ENABLE_INGRESS}" == "true" ]]; then
  if ! port_in_use "${MIRROR_NODE_PORT_INGRESS}"; then
    fail "Mirror node deploy reported success but the ingress was not forwarded to localhost:${MIRROR_NODE_PORT_INGRESS}."
  fi
  echo "Mirror node ingress (REST, Java REST, web3) is at http://localhost:${MIRROR_NODE_PORT_INGRESS}"
fi

# With the default ports the ingress already holds localhost:38081, so the JS REST forward below is skipped; the
# ingress serves the JS REST API too.
port_forward "${MIRROR_RELEASE_NAME}-rest" "${MIRROR_NODE_PORT_REST}" 80
port_forward "${MIRROR_RELEASE_NAME}-grpc" "${MIRROR_NODE_PORT_GRPC}" 5600
port_forward "${MIRROR_RELEASE_NAME}-web3" "${MIRROR_NODE_PORT_WEB3_REST}" 80
port_forward "${MIRROR_RELEASE_NAME}-restjava" "${JAVA_REST_API_PORT}" 80
