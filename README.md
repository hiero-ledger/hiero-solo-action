[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hiero-ledger/hiero-solo-action/badge)](https://scorecard.dev/viewer/?uri=github.com/hiero-ledger/hiero-solo-action)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/10697/badge)](https://bestpractices.coreinfrastructure.org/projects/10697)
[![License](https://img.shields.io/badge/license-apache2-blue.svg)](LICENSE)

# hiero-solo-action

A GitHub Action for setting up a Hiero Solo network.
An overview of the usage and idea of the action can be found [here](https://dev.to/hendrikebbers/ci-for-hedera-based-projects-2nja).

The network that is created by the action contains one consensus node that can be accessed at `localhost:50211`.
Optionally, you can deploy a second consensus node by enabling `dualMode: true`. When dual mode is enabled, the second node is accessible at `localhost:51211`.
When a mirror node is installed, the Java-based REST API can be accessed at `localhost:8084`.
The action creates an account on the network that contains 10,000,000 hbars.
All information about the account is stored as output to the github action.

A good example on how the action is used can be found at the [hiero-enterprise project action](<[https://github.com/OpenElements/hedera-enterprise/blob/main/.github/workflows/maven.yml](https://github.com/OpenElements/hiero-enterprise-java/blob/main/.github/workflows/maven.yml)>). Here the action is used to create a temporary network that is than used to execute tests against the network.

## Inputs

The GitHub action takes the following inputs:

| Input                    | Required | Default    | Description                                                                                                                                |
| ------------------------ | -------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `hbarAmount`             | false    | `10000000` | Amount of hbars to fund a created account with.                                                                                            |
| `hieroVersion`           | false    | `v0.58.10` | Hiero consenus node version to use                                                                                                         |
| `mirrorNodeVersion`      | false    | `v0.133.0` | Mirror node version to use                                                                                                                 |
| `installMirrorNode`      | false    | `false`    | If set to `true`, the action will install a mirror node in addition to the main node. The mirror node can be accessed at `localhost:5551`. |
| `mirrorNodePortRest`     | false    | `5551`     | Port for Mirror Node REST API                                                                                                              |
| `mirrorNodePortGrpc`     | false    | `5600`     | Port for Mirror Node gRPC                                                                                                                  |
| `mirrorNodePortWeb3Rest` | false    | `8545`     | Port for Web3 REST API                                                                                                                     |
| `installRelay`           | false    | `false`    | If set to `true`, the action will install the JSON-RPC-Relay as part of the setup process.                                                 |
| `relayPort`              | false    | `7546`     | Port for the JSON-RPC-Relay                                                                                                                |
| `grpcProxyPort`          | false    | `9998`     | Port for gRPC Proxy                                                                                                                        |
| `dualModeGrpcProxyPort`  | false    | `9999`     | Port for the gRPC Proxy of the second consensus node (only if dual mode is enabled)                                                        |
| `haproxyPort`            | false    | `50211`    | Port for HAProxy                                                                                                                           |
| `soloVersion`            | false    | `0.41.0`   | Version of Solo CLI to install                                                                                                             |
| `javaRestApiPort`        | false    | `8084`     | Port for Java-based REST API                                                                                                               |
| `dualMode`               | false    | `false`    | Enable dual mode to deploy two consensus nodes                                                                                             |

> [! IMPORTANT]
> The used Solo version isn't compatible with Hiero consenus node versions above v0.58.10.
> Therefore we recommend to not change `hieroVersion`.

## Outputs

| Output                                 | Description                                                |
| -------------------------------------- | ---------------------------------------------------------- |
| `steps.solo.outputs.accountId`         | The account ID of account created in ED25519 format.       |
| `steps.solo.outputs.publicKey`         | The public key of account created in ED25519 format.       |
| `steps.solo.outputs.privateKey`        | The private key of account created in ED25519 format.      |
| `steps.solo.outputs.deployment`        | The name of the Solo deployment created by the action.     |
| `steps.solo.outputs.ecdsaAccountId`    | The account ID of the account created (in ECDSA format).   |
| `steps.solo.outputs.ecdsaPublicKey`    | The public key of the account created (in ECDSA format).   |
| `steps.solo.outputs.ecdsaPrivateKey`   | The private key of the account created (in ECDSA format).  |
| `steps.solo.outputs.ed25519AccountId`  | Same as `accountId`, but with an explicit ED25519 format!  |
| `steps.solo.outputs.ed25519PublicKey`  | Same as `publicKey`, but with an explicit ED25519 format!  |
| `steps.solo.outputs.ed25519PrivateKey` | Same as `privateKey`, but with an explicit ED25519 format! |

# Simple usage

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.8
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
    echo "Private Key: ${{ steps.solo.outputs.privateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.publicKey }}"
```

# Usage with `ecdsa` account format

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.8
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.ecdsaAccountId }}"
    echo "Private Key: ${{ steps.solo.outputs.ecdsaPrivateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.ecdsaPublicKey }}"
```

# Usage with `ED25519` account format

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.8
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.ed25519AccountId }}"
    echo "Private Key: ${{ steps.solo.outputs.ed25519PrivateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.ed25519PublicKey }}"
```

# Usage with `hbarAmount`

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.8
  id: solo
  with:
    hbarAmount: 10000000

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
    # Display account information including the current amount of HBAR
    solo account get --account-id ${{ steps.solo.outputs.accountId }} --deployment "solo-deployment"
```

# Usage with Dual Mode (2 Consensus Nodes)

```yaml
- name: Setup Hiero Solo with Dual Mode
  uses: hiero-ledger/hiero-solo-action@v0.8
  id: solo
  with:
    dualMode: true

- name: Verify Nodes
  run: |
    echo "Checking services for both nodes..."
    kubectl get svc -n solo
    kubectl get pods -n solo
    echo "Node 1 is accessible at localhost:50211"
    echo "Node 2 is accessible at localhost:51211"
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
```

# Local Solo Test Network

The [README.md](./local/README.md) describes how to set up a local solo test network only with Docker.

# Tributes

This action is based on the work of [Hiero Solo](https://github.com/hiero-ledger/solo).
Without the great help of [Timo](https://github.com/timo0), [Nathan](https://github.com/nathanklick), and [Lenin](https://github.com/leninmehedy) this action would not exist.
