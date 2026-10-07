#!/usr/bin/env sh
# Create a Kubernetes cluster using kind
kind create cluster -n "$SOLO_CLUSTER_NAME" --config=./kind-config.yaml

# Create kubectl config file
kind get kubeconfig --name "$SOLO_CLUSTER_NAME" > ~/.kube/config

# Connect the Solo CLI to the kind cluster using a cluster reference name
solo cluster-ref config connect --cluster-ref kind-"$SOLO_CLUSTER_NAME" --context kind-"$SOLO_CLUSTER_NAME"

# Create deployment
solo deployment config create -n "$SOLO_NAMESPACE" --deployment "$SOLO_DEPLOYMENT"

# Add the kind cluster to the deployment with 1 consensus node
solo deployment cluster attach --deployment "$SOLO_DEPLOYMENT" --cluster-ref kind-"$SOLO_CLUSTER_NAME" --num-consensus-nodes 1

# Generate node keys
solo keys consensus generate --gossip-keys --tls-keys -i node1 --deployment "$SOLO_DEPLOYMENT"

# Setup the Solo cluster
solo cluster-ref config setup --cluster-ref kind-"$SOLO_CLUSTER_NAME"

# Deploy network
solo consensus network deploy -i node1 --deployment "$SOLO_DEPLOYMENT"

# Setup node
solo consensus node setup -i node1 --deployment "$SOLO_DEPLOYMENT" --consensus-node-version "$HIERO_VERSION" --quiet-mode

# Start node
solo consensus node start -i node1 --deployment "$SOLO_DEPLOYMENT"

# Debug: List services in the solo namespace
echo "Listing services in namespace $SOLO_NAMESPACE:"
kubectl get svc -n "$SOLO_NAMESPACE"

# Port forward HAProxy (only if service exists)
if kubectl get svc haproxy-node1-svc -n "$SOLO_NAMESPACE" >/dev/null 2>&1; then
    kubectl patch svc haproxy-node1-svc -n "$SOLO_NAMESPACE" --patch-file haproxy-svc-patch.yaml
    echo "HAProxy service haproxy-node1-svc is available under localhost:50211"
else
  echo "HAProxy service haproxy-node1-svc not found, skipping port-forward"
fi
