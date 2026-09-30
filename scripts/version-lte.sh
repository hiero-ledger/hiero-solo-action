#!/usr/bin/env bash
# Exits 0 when <version> is lower than or equal to <other-version>, comparing both as semver.
# A leading "v" on either argument is ignored, so "v0.44.0" and "0.44.0" compare as equal.
#
# Usage:
#   bash scripts/version-lte.sh 0.44.0 "${soloVersion}"   # true when solo is >= 0.44.0
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $(basename "$0") <version> <other-version>" >&2
  exit 2
fi

lowerVersion="${1#v}"
upperVersion="${2#v}"

[[ "$(printf '%s\n' "${lowerVersion}" "${upperVersion}" | sort -V | head -n1)" == "${lowerVersion}" ]]
