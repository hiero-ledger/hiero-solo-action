FROM busybox AS installer
RUN wget -O ./kind https://kind.sigs.k8s.io/dl/v0.29.0/kind-linux-amd64
RUN chmod +x ./kind

RUN wget -O ./docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-28.3.2.tgz
RUN tar xzvf ./docker.tgz

RUN wget -O ./kubectl "https://dl.k8s.io/release/v1.33.3/bin/linux/amd64/kubectl"
RUN chmod +x ./kubectl

FROM node:22-alpine
COPY --from=installer ./kind /usr/local/bin/kind
COPY --from=installer ./docker/docker /usr/local/bin/docker
COPY --from=installer ./kubectl /usr/local/bin/kubectl
RUN npm install -g @hashgraph/solo@0.39.0
COPY ./setup-solo-test-net.sh ./setup-solo-test-net.sh
RUN chmod +x ./setup-solo-test-net.sh
ENV SOLO_CLUSTER_NAME=solo-e2e
ENV SOLO_NAMESPACE=solo
ENV SOLO_CLUSTER_SETUP_NAMESPACE=solo-cluster
ENV SOLO_DEPLOYMENT=solo-deployment
ENV HIERO_VERSION=v0.63.7
ENTRYPOINT [ "./setup-solo-test-net.sh"]
