#!/usr/bin/env sh

echo "Creating ECDSA account..."
solo ledger account create --generate-ecdsa-key --deployment $SOLO_DEPLOYMENT > account_create_output_ecdsa.txt
cat account_create_output_ecdsa.txt
JSON=$(cat account_create_output_ecdsa.txt | python3 ./extractAccountAsJson.py) || {
    echo "Error: Python script extractAccountAsJson.py failed"
    exit 1
}
export ACCOUNT_ID=$(echo $JSON | jq -r '.accountId')
export ACCOUNT_PUBLIC_KEY=$(echo $JSON | jq -r '.publicKey')
export ACCOUNT_PRIVATE_KEY=$(kubectl get secret account-key-$ACCOUNT_ID -n $SOLO_NAMESPACE -o jsonpath='{.data.privateKey}' | base64 -d | xargs)
solo ledger account update --account-id $ACCOUNT_ID --hbar-amount 10000000 --deployment $SOLO_DEPLOYMENT
echo "accountId=$ACCOUNT_ID"
echo "publicKey=$ACCOUNT_PUBLIC_KEY"
echo "privateKey=$ACCOUNT_PRIVATE_KEY"
