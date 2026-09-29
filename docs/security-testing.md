# Security Testing

## Static analysis (CodeQL)

[`codeql.yml`](../.github/workflows/codeql.yml) analyzes Python and GitHub Actions
(the workflows and the composite `action.yml`) on pull requests to `main`, pushes to
`main`, and weekly. Results appear in the repository's code scanning alerts.
Standalone shell scripts in `scripts/` are not analyzed.

If CodeQL default setup is enabled in the repository settings, disable it; GitHub
rejects results from this advanced workflow while default setup is active.

## Fuzzing (ClusterFuzzLite)

[`fuzzing.yml`](../.github/workflows/fuzzing.yml) builds the Atheris fuzz target in
[`.clusterfuzzlite/`](../.clusterfuzzlite) and runs it against
`extractAccountAsJson.py`:

| Event             | Mode          | Duration |
|-------------------|---------------|----------|
| Pull request      | `code-change` | 10 min   |
| Weekly / manual   | `batch`       | 60 min   |

The target feeds arbitrary CLI output to the parser and checks that any extracted
block is a stable substring of the input. It also embeds generated account blocks
in log noise and checks that exactly that block is extracted. Batch runs store
the corpus as workflow artifacts, which pull request runs reuse. Crashes are
uploaded to code scanning under the `clusterfuzzlite` category.

## Running locally

Unit tests (also run by [`fuzzing.yml`](../.github/workflows/fuzzing.yml) before fuzzing):

```sh
python3 -m unittest discover -s tests -v
```

Fuzz target, with `atheris` installed in a virtual environment:

```sh
PYTHONPATH=. python3 .clusterfuzzlite/fuzz_account_parser.py -max_total_time=120
```

## Maintenance

Actions are pinned to commit SHAs and the fuzz build image is pinned by digest.
Dependabot ([`dependabot.yml`](../.github/dependabot.yml)) proposes updates for
both weekly. When pinning manually, use the commit SHA a tag points to, not the
SHA of an annotated tag object.

## OpenSSF Scorecard

Scorecard detects fuzzing from `.clusterfuzzlite/Dockerfile` and SAST from the
CodeQL workflow. The SAST score also depends on how many recently merged pull
requests were checked by CodeQL, so it only reaches its maximum once enough pull
requests have been merged after this workflow was added. The public badge only
reflects changes after they reach the default branch and Scorecard rescans it.
