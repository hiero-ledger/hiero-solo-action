# Local Solo Test Network

## How to set up a local Solo Test Network
This folder contains a `Dockerfile` for a Docker container that prepares a K8s cluster with a solo test network without installing additional tools except of Docker.

This Docker image contains tools like:

- helm
- kind
- solo
- kubectl

You have two options to run a local solo test network:

2. With plain Docker or
1. with Docker Compose


### Plain Docker

First at all, you have to build the Docker image:

```shell
docker build -t hiero/solo-runner . --build-context gh=..
```

The flag `--build-context` is important to copy files from the GH action

The versions and some settings of the contained tools can be overriden during the build:

```shell
docker build --build-args HELM_VERSION ... -t hiero/solo-runner .
```

An overview of all args variable:

| Variable Name  |  Default |Description |
|----------------|---------|-------------------------------|
| DOCKER_VERSION | 28.3.2  | Version of the used `docker` |
| HELM_VERSION   | 3.17.4  | Version of the used `helm` |
| HIERO_VERSION  | v0.63.7 | Version of the used Hiero consensus node |
| KIND_VERSION   | 0.29.0  | Version of the used `kind` (Note: It is not the version of the KIND node ) |
| KUBECTL_VERSION |1.33.3 | Version of the used `kubectl` |

After building the Docker image, we can run it to set up a local Solo Test Network:

```shell
 docker run -v /var/run/docker.sock:/var/run/docker.sock --network host -it hiero/solo-runner
```

Both flags (`-v /var/run/docker.sock:/var/run/docker.sock --network host`) are important to start the solo test network in a K8s cluster directly on your host machine.


### Docker Compose
If you don't want to care about building a Docker image, we prepare a `compose.yaml` that automatically build and run the container, that is defined in `Dockerfile`.

```shell
docker compose up --build
```

The flag `--build` is optional.
It forces to build the Docker image at every run.


## Interaction with the Local Solo Test Network

### Access to HAProxy
You can interact with the internal HAProxy via `localhost:50211`from your host machine.
