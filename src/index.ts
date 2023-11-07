import * as util from 'util'
import { exec } from 'child_process'
import { simpleGit } from 'simple-git'
import * as core from '@actions/core'

export async function isHelmInstalled(): Promise<boolean> {
  try {
    // Check if Helm is in the PATH
    await util.promisify(exec)('helm version --short')
    return true
  } catch (error) {
    return false
  }
}

export async function isPluginInstalled(): Promise<boolean> {
  try {
    // Check if the plugin is already installed
    await util.promisify(exec)('helm plugin list | grep -q "schema"')
    return true
  } catch (error) {
    return false
  }
}

export async function installPlugin(): Promise<void> {
  try {
    const helmInstalled = await isHelmInstalled()
    if (!helmInstalled) {
      core.setFailed('Helm is required to install the plugin')
      return
    }

    const pluginInstalled = await isPluginInstalled()

    if (pluginInstalled) {
      // Update the helm-values-schema-json plugin if it's already installed
      const updateCommand = 'helm plugin update schema'
      await util.promisify(exec)(updateCommand)
      core.info('Plugin already installed, running update...')
    } else {
      // Install the helm-values-schema-json plugin
      const installCommand = 'helm plugin install https://github.com/losisin/helm-values-schema-json.git'
      await util.promisify(exec)(installCommand)
      core.info('Plugin successfully installed')
    }
  } catch (error) {
    core.setFailed('Error installing plugin')
  }
}

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

    // Check Helm, update/install the plugin
    await installPlugin()

    // Run the 'helm schema' command
    const helmSchemaCommand = `helm schema -input ${input} -output ${output} -draft ${draft}`
    try {
      await util.promisify(exec)(helmSchemaCommand)
      core.info('Merged data saved to ${output}')
    } catch (error) {
      core.setFailed('Error running helm schema command')
    }

    // Use simple-git diffSummary to check for changes in the 'output' file
    const git = simpleGit()
    const statusSummary = await git.status()

    // Check if the 'output' file has been added, modified, or deleted
    const outputStatus = statusSummary.files.find(file => file.path === output)
    if (outputStatus) {
      switch (true) {
        case failOnDiff === 'true':
          core.setFailed('${output} has changed')
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
          core.info(`'${output}' left unchanged.`)
      }
    } else {
      core.info(`'${output}' is up to date.`)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
