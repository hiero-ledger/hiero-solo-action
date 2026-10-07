# Maintainers

The general handling of Maintainer rights and all groups in this GitHub org is done in the <https://github.com/hiero-ledger/governance> repository.

## Maintainer Scopes, GitHub Roles and GitHub Teams

Maintainers are assigned the following scopes in this repository:

|        Scope        |            Definition             | GitHub Role |           GitHub Team            |
|---------------------|-----------------------------------|-------------|----------------------------------|
| project-maintainers | The Maintainers of the project    | Maintain    | `hiero-solo-action-maintainers`  |
| tsc                 | The Hiero TSC                     | Maintain    | `tsc`                            |
| github-maintainers  | The Maintainers of the github org | Maintain    | `github-maintainers`             |

## Active Maintainers

<!-- Please keep this sorted alphabetically by github -->

| Name           | GitHub ID     | Scope | LFID | Discord ID     | Email | Company Affiliation |
|--------------- | ------------- | ----- | ---- | -------------- | ----- | ------------------- |
| Hendrik Ebbers | hendrikebbers |       |      | hendrik.ebbers |       | Hashgraph           |
| Georgi Stoykov | gsstoykov     |       |      | glime_39042    |       | LimeChain           |

## Emeritus Maintainers

| Name | GitHub ID | Scope | LFID | Discord ID | Email | Company Affiliation |
|----- | --------- | ----- | ---- | ---------- | ----- | ------------------- |
|      |           |       |      |            |       |                     |

## Bumping the Solo Version

When `hieroVersion` or `mirrorNodeVersion` is left empty, `action.yml` resolves them from hard-coded
versions that must match what the default Solo release pins. Nothing updates them automatically, so
every Solo bump must update all of the following in the same PR:

1. Look up the pinned versions in Solo's [`version.ts`](https://github.com/hiero-ledger/solo/blob/main/version.ts)
   at the new release tag: `HEDERA_PLATFORM_VERSION` (consensus node), `MIRROR_NODE_VERSION`,
   `HELM_VERSION`, `KIND_VERSION` and `KUBECTL_VERSION`.
2. `action.yml`:
   - the `soloVersion` input default
   - `SOLO_MATCHED_HIERO_VERSION` and `SOLO_MATCHED_MIRROR_NODE_VERSION` for Solo `>= 0.44` in the
     `Resolve Component Versions` step
3. `README.md`: the `soloVersion` default in the inputs table and the `>= 0.44.0` row of the
   "Component versions per Solo release" table.
4. `local/Dockerfile`: the `@hiero-ledger/solo` version, `HIERO_VERSION`, and the `HELM_VERSION`,
   `KIND_VERSION` and `KUBECTL_VERSION` build args if Solo changed them.
5. `local/README.md`: the build args table.

## The Duties of a Maintainer

Maintainers are expected to perform duties in alignment with **[Hiero-Ledger's defined maintainer guidelines](https://github.com/hiero-ledger/.github/blob/main/CONTRIBUTING.md#about-users-and-maintainers).**
