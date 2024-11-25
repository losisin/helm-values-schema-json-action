import * as path from 'path'
import * as fs from 'fs'
import { installPlugin } from './install'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit } from 'simple-git'

const version = 'v1.6.3'

/**
 * Recursively searches for directories containing Chart.yaml files.
 * @param {string} dir - The directory to start the search from.
 * @returns {string[]} An array of directory paths containing Chart.yaml.
 */
async function findChartDirectories(dir: string): Promise<string[]> {
  const results: string[] = []

  const entries = await fs.promises.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (fs.existsSync(path.join(fullPath, 'Chart.yaml'))) {
        results.push(fullPath)
      } else {
        const subDirResults = await findChartDirectories(fullPath)
        results.push(...subDirResults)
      }
    }
  }

  core.info(`FOUND: ${results}`)

  return results
}

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const input = core.getInput('input') || 'testdata/chart1/values.yaml'
    const draft = core.getInput('draft') || 2019
    const output = core.getInput('output') || 'testdata/chart1/values.schema.json'
    const indent = core.getInput('indent') || 4
    const id = core.getInput('id') || 'https://raw.githubusercontent.com/pcmk-inc/helm-charts/main/charts/ignite/values.schema.json'
    const title = core.getInput('title') || 'Ignite Helm Chart Values'
    const description = core.getInput('description') || 'Values for the Ignite Helm Chart'
    const additionalProperties = core.getInput('additional-properties') || false
    const gitPush = core.getInput('git-push') || 'true'
    const gitPushUserName = core.getInput('git-push-user-name') || 'GitHub Action'
    const gitPushUserEmail = core.getInput('git-push-user-email') || 'action@github.com'
    const gitCommitMessage = core.getInput('git-commit-message') || 'Update values schema json'
    const failOnDiff = core.getInput('fail-on-diff') || false
    const workingDirectory = path.resolve(core.getInput('working-directory'))
    const recursive = core.getInput('recursive') || false

    // Set the root of the repository to GITHUB_WORKSPACE
    const repoRoot = process.env.GITHUB_WORKSPACE || process.cwd()

    core.startGroup(`Downloading JSON schema ${version}`)
    const cachedPath = await installPlugin(version)
    core.endGroup()

    if (!process.env['PATH']?.startsWith(path.dirname(cachedPath))) {
      core.addPath(path.dirname(cachedPath))
    }

    core.info(`JSON schema binary '${version}' has been cached at ${cachedPath}`)
    core.setOutput('plugin-path', cachedPath)

    let directories = [workingDirectory]
    if (recursive) {
      directories = await findChartDirectories(workingDirectory)
    }

    const git = simpleGit()
    const changedFiles: string[] = []

    for (const dir of directories) {
      const dirInput = path.join(dir, input)
      const dirOutput = path.join(dir, output)

      const args: string[] = [
        '-input', dirInput,
        '-output', dirOutput,
        '-draft', String(draft),
        '-indent', String(indent)
      ]

      if (id) {
        args.push('-schemaRoot.id', id)
      }

      if (title) {
        args.push('-schemaRoot.title', title)
      }

      if (description) {
        args.push('-schemaRoot.description', description)
      }

      if (additionalProperties) {
        args.push('-schemaRoot.additionalProperties', additionalProperties)
      }

      await exec.exec('schema', args)

      // Make sure output path is relative to the GITHUB_WORKSPACE (repository root)
      const relativeOutputPath = path.relative(repoRoot, dirOutput)

      const statusSummary = await git.status()
      const outputStatus = statusSummary.files.find(file => file.path === relativeOutputPath)

      if (outputStatus) {
        changedFiles.push(relativeOutputPath)
      }
    }

    if (changedFiles.length > 0) {
      core.info(`Detected changes in the following files: ${changedFiles.join(', ')}`)
      switch (true) {
        case failOnDiff === 'true':
          core.setFailed(`Some JSON schemas have changed: ${changedFiles.join(', ')}`)
          break
        case gitPush === 'true':
          await git.addConfig('user.name', gitPushUserName)
          await git.addConfig('user.email', gitPushUserEmail)
          await git.add(['testdata/chart1/values.schema.json'])
          // await git.commit(gitCommitMessage)
          await git.push()
          core.info(`Pushed changes for the following JSON schemas: ${changedFiles.join(', ')}`)
          break
        default:
          core.info(`JSON schemas changed: ${changedFiles.join(', ')}, but no action was requested.`)
      }
    } else {
      core.info(`All JSON schemas are up to date.`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}
