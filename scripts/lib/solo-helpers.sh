# shellcheck shell=bash disable=SC2034
# Settings and helpers shared by the action scripts. Source this file, do not execute it.

readonly SOLO_CLUSTER_NAME="solo-e2e"
# kind names the kubectl context "kind-<cluster>"; the action uses that name as the Solo cluster ref too.
readonly SOLO_CLUSTER_REF="kind-${SOLO_CLUSTER_NAME}"
readonly SOLO_NAMESPACE="solo"
readonly SOLO_CLUSTER_SETUP_NAMESPACE="solo-cluster"
# Also exposed as the "deployment" output in action.yml; keep both in sync.
readonly SOLO_DEPLOYMENT="solo-deployment"

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ACTION_DIR="$(cd "${SCRIPTS_DIR}/.." && pwd)"
VALUES_DIR="${ACTION_DIR}/values"
readonly SCRIPTS_DIR ACTION_DIR VALUES_DIR

fail() {
  echo "::error::$*"
  exit 1
}

set_output() {
  echo "$1=$2" >> "${GITHUB_OUTPUT:?GITHUB_OUTPUT is not set}"
}

# Exits 0 when the installed Solo CLI is the given version or newer.
solo_at_least() {
  if [[ -z "${SOLO_INSTALLED_VERSION:-}" ]]; then
    SOLO_INSTALLED_VERSION="$(solo --version | grep Version | awk '{print $3}')"
  fi
  bash "${SCRIPTS_DIR}/version-lte.sh" "$1" "${SOLO_INSTALLED_VERSION}"
}

show_services() {
  echo "::group::Services in namespace ${SOLO_NAMESPACE}"
  kubectl get svc -n "${SOLO_NAMESPACE}"
  echo "::endgroup::"
}

port_in_use() {
  (exec 3<>"/dev/tcp/127.0.0.1/$1") 2>/dev/null
}

# Usage: port_forward <service> <local-port> <service-port>
# Solo already forwards its default ports itself, so a local port that is taken is left alone.
# The tunnel's output goes to a file: it outlives this step, and must not write to the step's log stream.
port_forward() {
  local service="$1" local_port="$2" service_port="$3"

  if ! kubectl get svc "${service}" -n "${SOLO_NAMESPACE}" >/dev/null 2>&1; then
    echo "Service ${service} not found, skipping port-forward to localhost:${local_port}"
    return 0
  fi
  if port_in_use "${local_port}"; then
    echo "localhost:${local_port} is already forwarded, skipping ${service}"
    return 0
  fi

  kubectl port-forward "svc/${service}" -n "${SOLO_NAMESPACE}" "${local_port}:${service_port}" \
    > "${RUNNER_TEMP:-/tmp}/port-forward-${local_port}.log" 2>&1 &
  echo "Forwarding localhost:${local_port} to ${service}:${service_port}"
}
