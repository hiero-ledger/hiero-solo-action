# hiero-solo-action

A GitHub Action for setting up a Hiero Solo network.
An overview of the usage and idea of the action can be found [here](https://dev.to/hendrikebbers/ci-for-hedera-based-projects-2nja).

The network that is created by the action contains one hiero consensus node that can be accessed at `localhost:50211`.
The action creates an account on the network that contains 10,000,000 hbars.
All information about the account is stored as output to the github action.

A good example on how the action is used can be found at the [hiero-enterprise project action](https://github.com/OpenElements/hedera-enterprise/blob/main/.github/workflows/maven.yml). Here the action is used to create a temporary network that is than used to execute tests against the network.

## Inputs

The GitHub action takes the following inputs:

| Input          |  Required | Default |Description |
|----------------|-----------|---------|-------------------------------|
| `installMirrorNode` |  false    | `false`   | If set to `true`, the action will install a mirror node in addition to the main node. The mirror node can be accessed at `localhost:8080`. |
| `installRelay` |  false    | `false`   | If set to `true`, the action will install the JSON-RPC-Relay as part of the setup process. |
| `hieroVersion`|  false    | `v0.52.2` | Hiero network version to use |
| `mirrorNodePort`|  false    | `8080` | Port for Mirror Node |


## Outputs

The GitHub action outputs the following information:

- `accountId`: The account ID of the account created.
- `privateKey`: The private key of the account created.
- `publicKey`: The public key of the account created.

# Usage

```yaml
- name: Setup Hiero Solo
  uses: OpenElements/heiro-solo-action@v0.1
  id: solo
  
- name: Use Hiero Solo
  run: |
    echo "Account ID: ${{ steps.solo.outputs.accountId }}"
    echo "Private Key: ${{ steps.solo.outputs.privateKey }}"
    echo "Public Key: ${{ steps.solo.outputs.publicKey }}"
```
# Tributes

This action is based on the work of [Hiero Hashgraph](https://github.com/hashgraph/hedera-services) and [Hiero Solo](https://github.com/hashgraph/solo).
Without the great help of [Timo](https://github.com/timo0), [Nathan](https://github.com/nathanklick), and [Lenin](https://github.com/leninmehedy) this action would not exist.
