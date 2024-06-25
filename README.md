# helm-values-schema-json GitHub Actions

[![CI](https://github.com/losisin/helm-values-schema-json-action/actions/workflows/ci.yaml/badge.svg?branch=main)](https://github.com/losisin/helm-values-schema-json-action/actions/workflows/ci.yaml)
[![codecov](https://codecov.io/gh/losisin/helm-values-schema-json-action/graph/badge.svg?token=0QQVCFJH84)](https://codecov.io/gh/losisin/helm-values-schema-json-action)
[![Static Badge](https://img.shields.io/badge/licence%20-%20MIT-green)](https://github.com/losisin/helm-values-schema-json-action/blob/main/LICENSE)
[![GitHub release (with filter)](https://img.shields.io/github/v/release/losisin/helm-values-schema-json-action)](https://github.com/losisin/helm-values-schema-json-action/releases)

A GitHub action to generate values schema json file by using helm plugin [helm-values-schema-json](https://github.com/losisin/helm-values-schema-json). It always uses latetst version of the plugin.

## Usage

To use this action, add the following step to your workflow:

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
```

> [!NOTE]
> This will only generate json schema but no further action will be taken.

## Inputs

| Name | Description | Default | Required |
|------|-------------|---------|----------|
| `input` | Input value file. Can be single or comma-separated list of yaml files | `values.yaml` | false |
| `draft` | Draft version of the schema. Accepted values are 4, 6, 7, 2019 and 2020 | `2020` | false |
| `output` | Output filename with path to store the generated schema | `values.schema.json` | false |
| `indent` | Indentation spaces (even number) | `4` | false |
| `id` | ID of the schema | `''` | false |
| `title` | Title of the schema | `''` | false |
| `description` | Description of the schema | `''` | false |
| `additionalProperties` | Additional properties allowed in the schema (bool) | `` | false |
| `git-push` | If true it will commit and push the changes (ignored if `fail-on-diff` is set) | `false` | false |
| `git-push-user-name` | If empty the name of the GitHub Actions bot will be used | `github-actions[bot]` | false |
| `git-push-user-email` | If empty the no-reply email of the GitHub Actions bot will be used | `github-actions[bot]@users.noreply.github.com` | false |
| `git-commit-message` | Commit message | `update values.schema.json` | false |
| `fail-on-diff` | Fail the job if there is any diff found between the generated output and existing file | `false` | false |

## Outputs

| Name | Description |
|------|-------------|
| `plugin-path` | Path to the cached JSON schema binary |

## Examples

### Fail on diff

To fail the workflow if there is a diff between the generated schema and the committed one, add the following step to your workflow:

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          fail-on-diff: true
```

### Auto commit generated schema

> [!NOTE]
> This options are ignored if `fail-on-diff: true`.

To automatically commit the generated schema, add the following step to your workflow:

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          git-push: true
```

To overwrite default user and email which is set to `github-actions[bot]` and add custom commit message, add the following:

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          git-push: true
          git-push-user-name: "John Doe"
          git-push-user-email: "john.doe@example.com"
          git-commit-message: "chore: update values schema json"
```

### Generate json schema from multiple files

You can generate schema from mutiple yaml files with values by passing comma separated list to `input` parameter.

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml,${GITHUB_WORKSPACE}/values2.yaml
          output: my.output.json
          draft: 7
          indent: 2
```

### Overwrite default schema and/or output file

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          output: ${GITHUB_WORKSPACE}/my.output.json
          draft: 7
```

## Issues, Features, Feedback

Your input matters. Feel free to open [issues](https://github.com/losisin/helm-values-schema-json-action/issues) for bugs, feature requests, or any feedback you may have. Check if a similar issue exists before creating a new one, and please use clear titles and explanations to help understand your point better. Your thoughts help me improve this project!

### How to Contribute

🌟 Thank you for considering contributing to my project! Your efforts are incredibly valuable. To get started:

1. Fork the repository.
2. Create your feature branch: `git checkout -b feature/YourFeature`
3. Commit your changes: `git commit -am 'Add: YourFeature'`
4. Push to the branch: `git push origin feature/YourFeature`
5. Submit a pull request! 🚀
