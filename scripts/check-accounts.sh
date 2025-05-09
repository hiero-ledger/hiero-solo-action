#!/bin/bash

set -e

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

echo "🎉 All outputs are valid!"
