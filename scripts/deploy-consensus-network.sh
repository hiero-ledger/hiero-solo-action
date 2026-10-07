#!/usr/bin/env bash
# Creates the kind cluster and deploys the consensus network, plus an optional block node.
# Environment: HIERO_VERSION, INSTALL_BLOCK_NODE, DUAL_MODE, HAPROXY_PORT, GRPC_PROXY_PORT,
#              DUAL_MODE_GRPC_PROXY_PORT
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

readonly NODE2_HAPROXY_PORT=36211

if [[ "${DUAL_MODE}" == "true" ]]; then
  node_count=2
  node_ids="node1,node2"
else
  node_count=1
  node_ids="node1"
fi

# An unset version is not passed at all, so Solo deploys the consensus node version it pins.
consensus_node_version_args=()
if [[ -n "${HIERO_VERSION}" ]]; then
  # --consensus-node-version replaced --release-tag in Solo 0.75.0. Solo does not reject unknown
  # flags, so passing the new name to an older release would silently drop the requested version.
  if solo_at_least "0.75.0"; then
    consensus_node_version_args=(--consensus-node-version "${HIERO_VERSION}")
  else
    consensus_node_version_args=(--release-tag "${HIERO_VERSION}")
  fi
fi

# Solo < 0.91.0 deploys the MinIO tenant from quay.io/minio/minio, which no longer serves anonymous pulls.
network_values_args=()
if ! solo_at_least "0.91.0"; then
  network_values_args=(--values-file "${VALUES_DIR}/minio-silo-values.yaml")
fi

add_hosts_entries() {
  if ! sudo -n true 2>/dev/null; then
    echo "No passwordless sudo, skipping /etc/hosts entries"
    return 0
  fi

  local node
  for node in ${node_ids//,/ }; do
    printf '127.0.0.1 %s\n' \
      "network-${node}-svc.${SOLO_NAMESPACE}.svc.cluster.local" \
      "envoy-proxy-${node}-svc.${SOLO_NAMESPACE}.svc.cluster.local" | sudo tee -a /etc/hosts
  done
}

kind create cluster -n "${SOLO_CLUSTER_NAME}"

# Solo < 0.46.0 downloads Helm into ~/.solo/bin only during "solo init"; later releases do it per command.
# With the kind context already current, init does not create a cluster of its own.
if ! solo_at_least "0.46.0"; then
  solo init --debug
fi

echo "Deploying ${node_count} consensus node(s)..."
solo cluster-ref config connect --cluster-ref "${SOLO_CLUSTER_REF}" --context "${SOLO_CLUSTER_REF}" --debug
solo deployment config create -n "${SOLO_NAMESPACE}" --deployment "${SOLO_DEPLOYMENT}" --debug
solo deployment cluster attach --deployment "${SOLO_DEPLOYMENT}" --cluster-ref "${SOLO_CLUSTER_REF}" \
  --num-consensus-nodes "${node_count}" --debug
solo keys consensus generate --gossip-keys --tls-keys -i "${node_ids}" --deployment "${SOLO_DEPLOYMENT}" --debug
solo cluster-ref config setup -s "${SOLO_CLUSTER_SETUP_NAMESPACE}" --debug

# The block node goes in before the consensus network. The consensus node version is passed so Solo
# can check it against the block node's block proof format.
if [[ "${INSTALL_BLOCK_NODE}" == "true" ]]; then
  solo block node add --cluster-ref "${SOLO_CLUSTER_REF}" --deployment "${SOLO_DEPLOYMENT}" \
    "${consensus_node_version_args[@]}" --debug
fi

solo consensus network deploy -i "${node_ids}" --deployment "${SOLO_DEPLOYMENT}" \
  "${consensus_node_version_args[@]}" "${network_values_args[@]}" --debug
solo consensus node setup -i "${node_ids}" --deployment "${SOLO_DEPLOYMENT}" \
  "${consensus_node_version_args[@]}" --quiet-mode --debug
solo consensus node start -i "${node_ids}" --deployment "${SOLO_DEPLOYMENT}" --debug

show_services
add_hosts_entries

port_forward haproxy-node1-svc "${HAPROXY_PORT}" 50211
port_forward envoy-proxy-node1-svc "${GRPC_PROXY_PORT}" 8080
if [[ "${DUAL_MODE}" == "true" ]]; then
  port_forward haproxy-node2-svc "${NODE2_HAPROXY_PORT}" 50211
  port_forward envoy-proxy-node2-svc "${DUAL_MODE_GRPC_PROXY_PORT}" 8080
fi
