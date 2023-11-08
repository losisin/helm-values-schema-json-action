# helm-values-schema-json GitHub Actions

A Github action to generate values schema json file by using helm plugin [helm-values-schema-json](https://github.com/losisin/helm-values-schema-json). It always uses latetst version of the plugin.

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
