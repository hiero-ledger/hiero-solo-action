#!/usr/bin/env bash
# Creates a funded account and writes its id and keys as step outputs.
# Usage: create-funded-account.sh <ecdsa|ed25519>
# Environment: HBAR_AMOUNT
set -euo pipefail
# shellcheck source=lib/solo-helpers.sh
source "$(dirname "${BASH_SOURCE[0]}")/lib/solo-helpers.sh"

readonly ED25519_DER_PREFIX="302e020100300506032b657004220420"

key_type="${1:-}"
case "${key_type}" in
  ecdsa) create_args=(--generate-ecdsa-key) ;;
  ed25519) create_args=() ;;
  *) fail "Usage: $(basename "$0") <ecdsa|ed25519>" ;;
esac

echo "Creating ${key_type} account..."
solo_output="${RUNNER_TEMP:-/tmp}/account-create-${key_type}.txt"
solo ledger account create "${create_args[@]}" --hbar-amount "${HBAR_AMOUNT}" \
  --deployment "${SOLO_DEPLOYMENT}" --debug | tee "${solo_output}"

account_json="$(python3 "${ACTION_DIR}/extractAccountAsJson.py" < "${solo_output}")"
[[ -n "${account_json}" ]] || fail "Could not find the created account in the Solo output"
account_id="$(jq -r '.accountId' <<< "${account_json}")"
public_key="$(jq -r '.publicKey' <<< "${account_json}")"
private_key="$(kubectl get secret "account-key-${account_id}" -n "${SOLO_NAMESPACE}" \
  -o jsonpath='{.data.privateKey}' | base64 -d | tr -d '[:space:]')"

echo "accountId=${account_id}"
echo "publicKey=${public_key}"
echo "privateKey=${private_key}"
set_output accountId "${account_id}"
set_output publicKey "${public_key}"
set_output privateKey "${private_key}"

if [[ "${key_type}" == "ed25519" ]]; then
  private_key_raw="${private_key#"${ED25519_DER_PREFIX}"}"
  if [[ ${#private_key_raw} -ne 64 ]]; then
    fail "Failed to derive raw ED25519 private key from DER format"
  fi
  echo "privateKeyRaw=${private_key_raw}"
  set_output privateKeyRaw "${private_key_raw}"
fi
