#!/usr/bin/env bash
# Deploys the mirror node and forwards its REST, gRPC, web3 and Java REST services.
# Environment: MIRROR_NODE_VERSION, ENABLE_INGRESS, MIRROR_NODE_PORT_REST, MIRROR_NODE_PORT_GRPC,
#              MIRROR_NODE_PORT_WEB3_REST, JAVA_REST_API_PORT
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
fi

solo mirror node add --cluster-ref "${SOLO_CLUSTER_REF}" --deployment "${SOLO_DEPLOYMENT}" "${mirror_args[@]}" --debug

show_services

if ! kubectl get svc "${MIRROR_RELEASE_NAME}-rest" -n "${SOLO_NAMESPACE}" >/dev/null 2>&1; then
  fail "Mirror node deploy reported success but no mirror REST service ${MIRROR_RELEASE_NAME}-rest was found."
fi

port_forward "${MIRROR_RELEASE_NAME}-rest" "${MIRROR_NODE_PORT_REST}" 80
port_forward "${MIRROR_RELEASE_NAME}-grpc" "${MIRROR_NODE_PORT_GRPC}" 5600
port_forward "${MIRROR_RELEASE_NAME}-web3" "${MIRROR_NODE_PORT_WEB3_REST}" 80
port_forward "${MIRROR_RELEASE_NAME}-restjava" "${JAVA_REST_API_PORT}" 80
