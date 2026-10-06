# Security Testing

## Static analysis (CodeQL)

CodeQL runs through GitHub's default setup, which is configured in the repository
settings rather than in a workflow file. Results appear in the repository's code
scanning alerts.

## Fuzzing (ClusterFuzzLite)

[`fuzzing.yml`](../.github/workflows/fuzzing.yml) builds the Atheris fuzz target in
[`.clusterfuzzlite/`](../.clusterfuzzlite) and runs it against
`extractAccountAsJson.py`:

| Event             | Mode          | Duration |
|-------------------|---------------|----------|
| Pull request      | `code-change` | 10 min   |
| Weekly / manual   | `batch`       | 60 min   |

Pull requests only trigger the workflow when they change the parser, its tests,
`.clusterfuzzlite/` or the workflow itself.

The target feeds arbitrary CLI output to the parser and checks that any extracted
block is a stable substring of the input. As a regression guard for future regex
changes, it also embeds generated account blocks in arbitrary text and checks that
exactly that block is extracted. Batch runs store the corpus as workflow
artifacts, which pull request runs reuse. Crashes are uploaded to code scanning
under the `clusterfuzzlite` category.

## Running locally

Unit tests (run as a separate job in [`fuzzing.yml`](../.github/workflows/fuzzing.yml)):

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

Scorecard detects fuzzing from `.clusterfuzzlite/Dockerfile`. For SAST, it counts
how many recently merged pull requests have a successful `CodeQL` check run, which
default setup creates. The public badge only reflects changes after they reach
the default branch and Scorecard rescans it.
