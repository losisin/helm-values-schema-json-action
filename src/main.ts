import * as path from 'path'
import { installPlugin } from './install'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit } from 'simple-git'
import { parse } from 'yaml'
import * as fs from 'fs/promises'

const version = 'v1.9.2'

interface SchemaConfig {
  input?: string[]
  draft?: number
  indent?: number
  output?: string
  schemaRoot?: {
    id?: string
    ref?: string
    title?: string
    description?: string
    additionalProperties?: boolean
  }
  noAdditionalProperties?: boolean
  bundle?: boolean
  bundleRoot?: string
  bundleWithoutID?: boolean
  k8sSchemaVersion?: string
  k8sSchemaURL?: string
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const workingDirectory = core.getInput('working-directory')
    if (workingDirectory) {
      core.info(`Setting working directory to: ${workingDirectory}`)
      process.chdir(workingDirectory)
    }

    let configFile: SchemaConfig = {}
    try {
      const fileContents = await fs.readFile('.schema.yaml', 'utf8')
      configFile = parse(fileContents) as SchemaConfig
    } catch {
      core.info('No .schema.yaml found or unable to parse it')
    }

    const input = core.getInput('input') || (configFile.input || []).join(',')
    const draft = core.getInput('draft') || configFile.draft?.toString() || '2020'
    const output = core.getInput('output') || configFile.output || 'values.schema.json'
    const indent = core.getInput('indent') || configFile.indent?.toString() || '4'
    const id = core.getInput('id') || configFile.schemaRoot?.id
    const title = core.getInput('title') || configFile.schemaRoot?.title
    const description = core.getInput('description') || configFile.schemaRoot?.description
    const additionalProperties = core.getInput('additionalProperties') || configFile.schemaRoot?.additionalProperties?.toString()
    const noAdditionalProperties = core.getInput('noAdditionalProperties') || configFile.noAdditionalProperties?.toString()
    const gitPush = core.getInput('git-push')
    const gitPushUserName = core.getInput('git-push-user-name')
    const gitPushUserEmail = core.getInput('git-push-user-email')
    const gitCommitMessage = core.getInput('git-commit-message')
    const failOnDiff = core.getInput('fail-on-diff')
    const bundle = core.getInput('bundle') || configFile.bundle?.toString()
    const bundleRoot = core.getInput('bundle-root') || configFile.bundleRoot
    const bundleWithoutID = core.getInput('bundle-without-id') || configFile.bundleWithoutID?.toString()
    const k8sSchemaVersion = core.getInput('k8s-schema-version') || configFile.k8sSchemaVersion
    const k8sSchemaURL = core.getInput('k8s-schema-url') || configFile.k8sSchemaURL

    core.startGroup(`Downloading JSON schema ${version}`)
    const cachedPath = await installPlugin(version)
    core.endGroup()

    if (!process.env['PATH']?.startsWith(path.dirname(cachedPath))) {
      core.addPath(path.dirname(cachedPath))
    }

    core.info(`JSON schema binary '${version}' has been cached at ${cachedPath}`)
    core.setOutput('plugin-path', cachedPath)

    const args: string[] = []

    const options = {
      '-input': input,
      '-output': output,
      '-draft': draft,
      '-indent': indent,
      '-schemaRoot.id': id,
      '-schemaRoot.title': title,
      '-schemaRoot.description': description,
      '-schemaRoot.additionalProperties': additionalProperties,
      '-noAdditionalProperties': noAdditionalProperties,
      '-bundle': bundle,
      '-bundleRoot': bundleRoot,
      '-bundleWithoutID': bundleWithoutID,
      '-k8sSchemaVersion': k8sSchemaVersion,
      '-k8sSchemaURL': k8sSchemaURL
    }

    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined) {
        args.push(key, value)
      }
    }

    await exec.exec('schema', args)

    const git = simpleGit()
    const statusSummary = await git.status()

    const outputStatus = statusSummary.files.find(file => file.path.endsWith(output))
    if (outputStatus) {
      switch (true) {
        case failOnDiff === 'true':
          try {
            const diff = await git.diff(['--', output])
            core.info(`Diff for '${output}':\n${diff}`)
          } catch {
            core.info(`Unable to get diff for '${output}'`)
          }
          core.setFailed(`'${output}' has changed`)
          break
        case gitPush === 'true':
          await git.addConfig('user.name', gitPushUserName)
          await git.addConfig('user.email', gitPushUserEmail)
          await git.add([output])
          await git.commit(gitCommitMessage)
          await git.push()
          core.info(`Pushed '${output}' to the branch.`)
          break
        default:
          core.info(`'${output}' has changed, but no action was requested.`)
      }
    } else {
      core.info(`'${output}' is up to date.`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
