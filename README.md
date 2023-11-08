# helm-values-schema-json GitHub Actions

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
    - uses: actions/checkout@v3
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
| input | Input value file. Can be single or comma-separated list of yaml files | `values.yaml` | true |
| draft | Draft version of the schema. Accepted values are 4, 6, 7, 2019 and 2020 | `2020` | false |
| output | Output filename with path to store the generated schema | `values.schema.json` | false |
| git-push | If true it will commit and push the changes (ignored if `fail-on-diff` is set) | `false` | false |
| git-push-user-name | If empty the name of the GitHub Actions bot will be used | `github-actions[bot]` | false |
| git-push-user-email | If empty the no-reply email of the GitHub Actions bot will be used | `github-actions[bot]@users.noreply.github.com` | false |
| git-commit-message | Commit message | `update values.schema.json` | false |
| fail-on-diff | Fail the job if there is any diff found between the generated output and existing file | `false` | false |

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
    - uses: actions/checkout@v3
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          fail-on-diff: true
```

### Auto commit generated schema

| NOTE: This options are ignored if `fail-on-diff: true`. |

To automatically commit the generated schema, add the following step to your workflow:

```yaml
name: Generate values schema json
on:
  - pull_request
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
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
    - uses: actions/checkout@v3
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
    - uses: actions/checkout@v3
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml,${GITHUB_WORKSPACE}/values2.yaml
          output: my.output.json
          draft: 7
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
    - uses: actions/checkout@v3
      with:
        ref: ${{ github.event.pull_request.head.ref }}
      - name: Generate values schema json
        uses: losisin/helm-values-schema-json-action@v1
        with:
          input: values.yaml
          output: ${GITHUB_WORKSPACE}/my.output.json
          draft: 7
```
