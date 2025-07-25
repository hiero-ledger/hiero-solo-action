#!/usr/bin/env sh
# Create a Kubernetes cluster using kind
kind create cluster -n $SOLO_CLUSTER_NAME --config=./kind-config.yaml

# Create kubectl config file
kind get kubeconfig --name solo-e2e > ~/.kube/config

# Initialize the Solo CLI configuration
solo init

# Connect the Solo CLI to the kind cluster using a cluster reference name
solo cluster-ref connect --cluster-ref kind-$SOLO_CLUSTER_NAME --context kind-$SOLO_CLUSTER_NAME

# Create deployment
solo deployment create -n $SOLO_NAMESPACE --deployment $SOLO_DEPLOYMENT

# Add the kind cluster to the deployment with 1 consensus node
solo deployment add-cluster --deployment $SOLO_DEPLOYMENT --cluster-ref kind-$SOLO_CLUSTER_NAME --num-consensus-nodes 1

# Generate node keys
solo node keys --gossip-keys --tls-keys -i node1 --deployment $SOLO_DEPLOYMENT

# Setup the Solo cluster
solo cluster-ref setup -s $SOLO_CLUSTER_NAME

# Deploy network
solo network deploy -i node1 --deployment $SOLO_DEPLOYMENT

# Setup node
solo node setup -i node1 --deployment $SOLO_DEPLOYMENT -t $HIERO_VERSION --quiet-mode

# Start node
solo node start -i node1 --deployment $SOLO_DEPLOYMENT

# Debug: List services in the solo namespace
echo "Listing services in namespace $SOLO_NAMESPACE:"
kubectl get svc -n $SOLO_NAMESPACE

# Port forward HAProxy (only if service exists)
if kubectl get svc haproxy-node1-svc -n $SOLO_NAMESPACE >/dev/null 2>&1; then
    kubectl patch svc haproxy-node1-svc -n $SOLO_NAMESPACE --patch-file haproxy-svc-patch.yaml
    echo "HAProxy service haproxy-node1-svc is available under localhost:50211"
else
  echo "HAProxy service haproxy-node1-svc not found, skipping port-forward"
fi
