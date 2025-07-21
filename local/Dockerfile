FROM busybox as kind-installer
RUN wget -O ./kind https://kind.sigs.k8s.io/dl/v0.29.0/kind-linux-amd64
RUN chmod +x ./kind

RUN wget -O ./docker.tgz https://download.docker.com/linux/static/stable/x86_64/docker-28.3.2.tgz
RUN tar xzvf ./docker.tgz

FROM alpine/k8s:1.31.11
COPY --from=kind-installer ./kind /usr/local/bin/kind
COPY --from=kind-installer ./docker/docker /usr/local/bin/docker
COPY ./setup-solo-test-net.sh ./setup-solo-test-net.sh
ENV SOLO_CLUSTER_NAME=solo-e2e
ENV SOLO_NAMESPACE=solo
ENV SOLO_CLUSTER_SETUP_NAMESPACE=solo-cluster
ENV SOLO_DEPLOYMENT=solo-deployment
ENV HIERO_VERSION=v0.63.7
CMD [ "/bin/bash", "./setup-solo-test-net.sh"]
