#!/bin/bash

set -e

# Validate Generic Outputs (ED25519-based)
if [ -z "$ACCOUNT_ID" ]; then
    echo "❌ Error: Generic accountId (ED25519) is missing!"
    exit 1
fi
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ Error: Generic privateKey (ED25519) is missing!"
    exit 1
fi
if [ -z "$PUBLIC_KEY" ]; then
    echo "❌ Error: Generic publicKey (ED25519) is missing!"
    exit 1
fi

# Validate ECDSA Outputs
if [ -z "$ECDSA_ACCOUNT_ID" ]; then
    echo "❌ Error: ECDSA accountId is missing!"
    exit 1
fi
if [ -z "$ECDSA_PRIVATE_KEY" ]; then
    echo "❌ Error: ECDSA privateKey is missing!"
    exit 1
fi
if [ -z "$ECDSA_PUBLIC_KEY" ]; then
    echo "❌ Error: ECDSA publicKey is missing!"
    exit 1
fi

# Validate ED25519 Outputs
if [ -z "$ED25519_ACCOUNT_ID" ]; then
    echo "❌ Error: ED25519 accountId is missing!"
    exit 1
fi
if [ -z "$ED25519_PRIVATE_KEY" ]; then
    echo "❌ Error: ED25519 privateKey is missing!"
    exit 1
fi
if [ -z "$ED25519_PUBLIC_KEY" ]; then
    echo "❌ Error: ED25519 publicKey is missing!"
    exit 1
fi
if [ -z "$ED25519_PRIVATE_KEY_RAW" ]; then
    echo "❌ Error: ED25519 privateKeyRaw is missing!"
    exit 1
fi
if [ ${#ED25519_PRIVATE_KEY_RAW} -ne 64 ]; then
    echo "❌ Error: ED25519 privateKeyRaw must be 64 hex characters!"
    exit 1
fi
if [ "${ED25519_PRIVATE_KEY: -64}" != "$ED25519_PRIVATE_KEY_RAW" ]; then
    echo "❌ Error: ED25519 privateKeyRaw does not match the DER private key!"
    exit 1
fi

echo "🎉 All outputs are valid!"
