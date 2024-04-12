import * as path from 'path'
import { installPlugin } from './install'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit } from 'simple-git'

const version = 'v1.2.4'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const input = core.getInput('input')
    const draft = core.getInput('draft')
    const output = core.getInput('output')
    const gitPush = core.getInput('git-push')
    const gitPushUserName = core.getInput('git-push-user-name')
    const gitPushUserEmail = core.getInput('git-push-user-email')
    const gitCommitMessage = core.getInput('git-commit-message')
    const failOnDiff = core.getInput('fail-on-diff')

    core.startGroup(`Downloading JSON schema ${version}`)
    const cachedPath = await installPlugin(version)
    core.endGroup()

    process.env['PATH']?.startsWith(path.dirname(cachedPath)) ||
      core.addPath(path.dirname(cachedPath))

    core.info(
      `JSON schema binary '${version}' has been cached at ${cachedPath}`
    )
    core.setOutput('plugin-path', cachedPath)

    await exec.exec('schema', [
      '-input',
      input,
      '-output',
      output,
      '-draft',
      draft
    ])

    const git = simpleGit()
    const statusSummary = await git.status()

    const outputStatus = statusSummary.files.find(file => file.path === output)
    if (outputStatus) {
      switch (true) {
        case failOnDiff === 'true':
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
