# Hiero Solo Action

[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/hiero-ledger/hiero-solo-action/badge)](https://scorecard.dev/viewer/?uri=github.com/hiero-ledger/hiero-solo-action)
[![CII Best Practices](https://bestpractices.coreinfrastructure.org/projects/10697/badge)](https://bestpractices.coreinfrastructure.org/projects/10697)
[![License](https://img.shields.io/badge/license-apache2-blue.svg)](LICENSE)

A GitHub Action for setting up a Hiero Solo network.
An overview of the usage and idea of the action can be found in the [CI for Hedera based projects](https://dev.to/hendrikebbers/ci-for-hedera-based-projects-2nja) guide.

> [!WARNING]
> Default localhost ports were changed to align with Solo 0.63+ defaults.
> If you relied on previous defaults, update your configuration or explicitly set action inputs.
>
> Changed defaults:
>
> - `haproxyPort`: `50211` -> `35211`
> - `mirrorNodePortRest`: `5551` -> `38081`
> - `relayPort`: `7546` -> `37546`
> - Dual mode node 2 HAProxy: `51211` -> `36211`

The network that is created by the action contains one consensus node that can be accessed at `localhost:35211` (Solo 0.63+ default local port).
Optionally, you can deploy a second consensus node by enabling `dualMode: true`. When dual mode is enabled, the second node is accessible at `localhost:36211`.
You can optionally provision a block node by enabling `installBlockNode: true`. The block node version is the one the selected Solo release ships with.
When a mirror node is installed, the Java-based REST API can be accessed at `localhost:8084`.
The action creates an ED25519 and an ECDSA account on the network, each funded with 10,000,000 hbars (see `hbarAmount`).
All information about the accounts is stored as output to the github action.

A good example on how the action is used can be found at the [hiero-enterprise project action](https://github.com/OpenElements/hiero-enterprise-java/blob/main/.github/workflows/maven.yml). Here the action is used to create a temporary network that is then used to execute tests against the network.

## Inputs

The GitHub action takes the following inputs:

| Input                    | Required | Default    | Description                                                                                                                                          |
| ------------------------ | -------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `hbarAmount`             | false    | `10000000` | Amount of hbars to fund a created account with.                                                                                                      |
| `hieroVersion`           | false    | _(auto)_   | Hiero consensus node version to use. Left empty, the version pinned by the selected `soloVersion` is used. When `installBlockNode` is enabled, Solo checks this version against the block node's block proof format. |
| `installBlockNode`       | false    | `false`    | If set to `true`, the action provisions a block node before consensus node deployment. The block node version is the one pinned by `soloVersion`.    |
| `mirrorNodeVersion`      | false    | _(auto)_   | Mirror node version to use. Left empty, the version pinned by the selected `soloVersion` is used.                                                     |
| `installMirrorNode`      | false    | `false`    | If set to `true`, the action will install a mirror node in addition to the main node. The mirror node REST API can be accessed at `localhost:38081`. |
| `mirrorNodePortRest`     | false    | `38081`    | Port for Mirror Node REST API                                                                                                                        |
| `mirrorNodePortGrpc`     | false    | `5600`     | Port for Mirror Node gRPC                                                                                                                            |
| `mirrorNodePortWeb3Rest` | false    | `8545`     | Port for Web3 REST API                                                                                                                               |
| `installRelay`           | false    | `false`    | If set to `true`, the action will install the JSON-RPC-Relay as part of the setup process.                                                           |
| `relayPort`              | false    | `37546`    | Port for the JSON-RPC-Relay                                                                                                                          |
| `grpcProxyPort`          | false    | `9998`     | Port for gRPC Proxy                                                                                                                                  |
| `dualModeGrpcProxyPort`  | false    | `9999`     | Port for the gRPC Proxy of the second consensus node (only if dual mode is enabled)                                                                  |
| `haproxyPort`            | false    | `35211`    | Port for HAProxy (consensus node gRPC)                                                                                                               |
| `soloVersion`            | false    | `0.92.0`   | Version of Solo CLI to install. Must be 0.44.0 or higher; see [Running Solo older than 0.44](#running-solo-older-than-044).                          |
| `javaRestApiPort`        | false    | `8084`     | Port for Java-based REST API                                                                                                                         |
| `nodeVersion`            | false    | `24`       | Node.js version to use for Solo CLI installation. Must be 22 or higher.                                                                              |
| `dualMode`               | false    | `false`    | Enable dual mode to deploy two consensus nodes                                                                                                       |

> [!IMPORTANT]
> When you leave `hieroVersion` and `mirrorNodeVersion` unset, the action does not pass a version to Solo,
> so the selected `soloVersion` deploys the component versions it was built and tested against. Override them
> only if you need a specific component version, and check the compatibility notes below first.

### Component versions per Solo release

Each Solo release pins the component versions it was built and tested against, together with the
`solo-deployment` Helm chart it bundles. Some examples:

| `soloVersion` | Consensus node | Mirror node | Block node |
| ------------- | -------------- | ----------- | ---------- |
| `0.92.0`      | `v0.77.2`      | `v0.163.0`  | `0.43.0`   |
| `0.91.0`      | `v0.76.4`      | `v0.161.0`  | `0.40.1`   |
| `0.88.1`      | `v0.75.1`      | `v0.161.0`  | `0.40.1`   |

When `installBlockNode` is enabled together with an explicit `hieroVersion`, both must use the same block
proof format: block node `0.41.0` and newer require consensus node `v0.77.0` or newer, and older block nodes
require an older consensus node. Solo rejects mismatched combinations before deploying.

### Running Solo older than 0.44

Solo 0.44.0 renamed most of its commands, and this action no longer supports the releases before it. To
deploy Solo 0.43.x or older, pin the action to `v0.25.0` or an earlier release:

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  with:
    soloVersion: 0.43.2
```

### Running Solo older than 0.91

Solo releases before 0.91.0 deploy the MinIO tenant from `quay.io/minio/minio`, which no longer allows
anonymous pulls. For those releases the action overrides the tenant image with the same
[Silo](https://github.com/pgsty/silo) image that Solo 0.91.0 uses (see `values/minio-silo-values.yaml`).

The `hieroVersion` input is passed as `--consensus-node-version` on Solo 0.75.0 and newer, and as the
older `--release-tag` flag before that.

## Outputs

| Output                                    | Description                                                                        |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| `steps.solo.outputs.accountId`            | The account ID of account created in ED25519 format.                               |
| `steps.solo.outputs.publicKey`            | The public key of account created in ED25519 format.                               |
| `steps.solo.outputs.privateKey`           | The private key of account created in ED25519 format (DER-encoded hex, `302e...`). |
| `steps.solo.outputs.deployment`           | The name of the Solo deployment created by the action.                             |
| `steps.solo.outputs.ecdsaAccountId`       | The account ID of the account created (in ECDSA format).                           |
| `steps.solo.outputs.ecdsaPublicKey`       | The public key of the account created (in ECDSA format).                           |
| `steps.solo.outputs.ecdsaPrivateKey`      | The private key of the account created (in ECDSA format).                          |
| `steps.solo.outputs.ed25519AccountId`     | Same as `accountId`, but with an explicit ED25519 format!                          |
| `steps.solo.outputs.ed25519PublicKey`     | Same as `publicKey`, but with an explicit ED25519 format!                          |
| `steps.solo.outputs.ed25519PrivateKey`    | Same as `privateKey`, but with an explicit ED25519 format!                         |
| `steps.solo.outputs.ed25519PrivateKeyRaw` | Raw 32-byte ED25519 private key as hex (64 characters).                            |

## Simple usage

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
    echo "Private Key: ${{ steps.solo.outputs.privateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.publicKey }}"
```

## Usage with `ecdsa` account format

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.ecdsaAccountId }}"
    echo "Private Key: ${{ steps.solo.outputs.ecdsaPrivateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.ecdsaPublicKey }}"
```

## Usage with `ED25519` account format

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.ed25519AccountId }}"
    echo "Private Key: ${{ steps.solo.outputs.ed25519PrivateKey }}"
    echo "Private Key (raw): ${{ steps.solo.outputs.ed25519PrivateKeyRaw }}"
    echo "Public Key: ${{ steps.solo.outputs.ed25519PublicKey }}"
```

## Usage with `hbarAmount`

```yaml
- name: Setup Hiero Solo
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo
  with:
    hbarAmount: 10000000

- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
    # Display account information including the current amount of HBAR
    solo ledger account info --account-id ${{ steps.solo.outputs.accountId }} --deployment "${{ steps.solo.outputs.deployment }}"
```

## Usage with Block Node

Use `installBlockNode: true` to provision a block node. The block node and consensus node versions pinned by
`soloVersion` are compatible with each other, so no additional version input is needed.

```yaml
- name: Setup Hiero Solo with Block Node
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo
  with:
    installBlockNode: true
```

## Usage with Dual Mode (2 Consensus Nodes)

```yaml
- name: Setup Hiero Solo with Dual Mode
  uses: hiero-ledger/hiero-solo-action@v0.25.0
  id: solo
  with:
    dualMode: true

- name: Verify Nodes
  run: |
    echo "Checking services for both nodes..."
    kubectl get svc -n solo
    kubectl get pods -n solo
    echo "Node 1 is accessible at localhost:35211"
    echo "Node 2 is accessible at localhost:36211"
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
```

## Security Testing

The action is continuously checked with CodeQL and ClusterFuzzLite. See [docs/security-testing.md](./docs/security-testing.md) for details and how to run the tests locally.

## Tributes

This action is based on the work of [Hiero Solo](https://github.com/hiero-ledger/solo).
Without the great help of [Timo](https://github.com/timo0), [Nathan](https://github.com/nathanklick), and [Lenin](https://github.com/leninmehedy) this action would not exist.
