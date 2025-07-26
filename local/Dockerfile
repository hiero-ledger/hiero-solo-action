FROM busybox:1.37.0 AS installer
ARG KIND_VERSION=0.29.0
RUN wget -O ./kind https://kind.sigs.k8s.io/dl/v${KIND_VERSION}/kind-linux-amd64
RUN chmod +x ./kind

ARG DOCKER_VERSION=28.3.2
RUN wget -O ./docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-${DOCKER_VERSION}.tgz
RUN tar xzvf ./docker.tgz

ARG KUBECTL_VERSION=1.33.3
RUN wget -O ./kubectl "https://dl.k8s.io/release/v${KUBECTL_VERSION}/bin/linux/amd64/kubectl"
RUN chmod +x ./kubectl

ARG HELM_VERSION=3.17.4
RUN wget -O ./helm.tgz https://get.helm.sh/helm-v${HELM_VERSION}-linux-amd64.tar.gz
RUN tar xzvf ./helm.tgz

FROM node:22-alpine
COPY --from=installer ./kind /usr/local/bin/kind
COPY --from=installer ./docker/docker /usr/local/bin/docker
COPY --from=installer ./kubectl /usr/local/bin/kubectl
COPY --from=installer ./linux-amd64 /usr/local/bin/helm

RUN npm install -g @hashgraph/solo@0.39.0
RUN apk add --update --no-cache python3 jq

COPY ./setup-solo-test-net.sh ./setup-solo-test-net.sh
COPY ./kind-config.yaml ./kind-config.yaml
COPY ./haproxy-svc-patch.yaml ./haproxy-svc-patch.yaml
RUN chmod +x ./setup-solo-test-net.sh

COPY ./create-ecdsa-account.sh ./create-ecdsa-account.sh
COPY --from=gh ./extractAccountAsJson.py ./extractAccountAsJson.py
RUN chmod +x ./create-ecdsa-account.sh

COPY ./all-in-setup.sh ./all-in-setup.sh
RUN chmod +x ./all-in-setup.sh


ENV SOLO_CLUSTER_NAME=solo-e2e
ENV SOLO_NAMESPACE=solo
ENV SOLO_CLUSTER_SETUP_NAMESPACE=solo-cluster
ENV SOLO_DEPLOYMENT=solo-deployment
ARG HIERO_VERSION=v0.63.7
ENTRYPOINT [ "./all-in-setup.sh"]