#!/bin/bash
# Validate ECDSA Outputs
if [ -z "${{ steps.solo.outputs.ecdsaAccountId }}" ]; then
    echo "❌ Error: ECDSA accountId is missing!"
    exit 1
fi
if [ -z "${{ steps.solo.outputs.ecdsaPrivateKey }}" ]; then
    echo "❌ Error: ECDSA privateKey is missing!"
    exit 1
fi
if [ -z "${{ steps.solo.outputs.ecdsaPublicKey }}" ]; then
    echo "❌ Error: ECDSA publicKey is missing!"
    exit 1
fi

# Validate ED25519 Outputs
if [ -z "${{ steps.solo.outputs.ed25519AccountId }}" ]; then
    echo "❌ Error: ED25519 accountId is missing!"
    exit 1
fi
if [ -z "${{ steps.solo.outputs.ed25519PrivateKey }}" ]; then
    echo "❌ Error: ED25519 privateKey is missing!"
    exit 1
fi
if [ -z "${{ steps.solo.outputs.ed25519PublicKey }}" ]; then
    echo "❌ Error: ED25519 publicKey is missing!"
    exit 1
fi

echo "🎉 All outputs are valid!"
