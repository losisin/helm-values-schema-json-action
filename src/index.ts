import * as os from 'os'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'

import { simpleGit } from 'simple-git'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'

const pluginName = 'schema'
const pluginRepository = 'helm-values-schema-json'
const pluginVersion = 'v0.2.0'

export function getPlugin(pluginVersion: string): string {
  const osArch = os.arch()
  const osType = os.type()

  const platformKey = osType === 'Windows_NT' ? 'windows' : osType.toLowerCase()
  const archKey = osArch === 'arm64' ? 'arm64' : 'amd64'

  return util.format(
    'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
    pluginRepository,
    pluginVersion,
    pluginRepository,
    pluginVersion.substring(1),
    platformKey,
    archKey
  )
}

export async function installPlugin(pluginVersion: string): Promise<string> {
  let cachedPluginpath = tc.find(pluginName, pluginVersion)
  if (!cachedPluginpath) {
    const pluginDownloadPath = await tc.downloadTool(getPlugin(pluginVersion))
    fs.chmodSync(pluginDownloadPath, '777')
    const unTaredPath = await tc.extractTar(pluginDownloadPath)
    cachedPluginpath = await tc.cacheDir(unTaredPath, pluginName, pluginVersion)
  }

  const pluginPath = findPlugin(cachedPluginpath)
  if (!pluginPath) {
    throw new Error(
      util.format('JSON schema binary not found in path', cachedPluginpath)
    )
  }

  fs.chmodSync(pluginPath, '777')
  return pluginPath
}

export function findPlugin(pluginFolder: string): string {
  fs.chmodSync(pluginFolder, '777')
  const files = fs.readdirSync(pluginFolder)
  const executableExtension = os.type().startsWith('Win') ? '.exe' : ''
  const targetFileName = pluginName + executableExtension

  const foundFiles = files.filter(file => {
    const filePath = path.join(pluginFolder, file)
    if (fs.statSync(filePath).isDirectory()) {
      return false
    }
    return file === targetFileName
  })

  if (foundFiles.length === 0) {
    throw new Error(
      util.format('JSON schema executable not found in path', pluginFolder)
    )
  }

  return path.join(pluginFolder, foundFiles[0])
}

export async function run(): Promise<void> {
  const input = core.getInput('input')
  const draft = core.getInput('draft')
  const output = core.getInput('output')
  const gitPush = core.getInput('git-push')
  const gitPushUserName = core.getInput('git-push-user-name')
  const gitPushUserEmail = core.getInput('git-push-user-email')
  const gitCommitMessage = core.getInput('git-commit-message')
  const failOnDiff = core.getInput('fail-on-diff')

  core.startGroup(`Downloading JSON schema ${pluginVersion}`)
  const cachedPath = await installPlugin(pluginVersion)
  core.endGroup()

  process.env['PATH']?.startsWith(path.dirname(cachedPath)) ||
    core.addPath(path.dirname(cachedPath))

  core.info(
    `JSON schema binary '${pluginVersion}' has been cached at ${cachedPath}`
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
        // await git.push()
        core.info(`Pushed '${output}' to the branch.`)
        break
      default:
        core.info(`'${output}' has changed, but no action was requested.`)
    }
  } else {
    core.info(`'${output}' is up to date.`)
  }
}

run().catch(core.setFailed)
