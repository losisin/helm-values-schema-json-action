import * as os from 'os'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'
import * as tc from '@actions/tool-cache'

const pluginName = 'schema'
const pluginRepository = 'helm-values-schema-json'
const version = 'v1.2.1'

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
    const pluginDownloadPath = await tc.downloadTool(getPlugin(version))
    fs.chmodSync(pluginDownloadPath, '777')
    const unTaredPath = await tc.extractTar(pluginDownloadPath)
    cachedPluginpath = await tc.cacheDir(unTaredPath, pluginName, pluginVersion)
  }

  const pluginPath = findPlugin(cachedPluginpath)

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
    throw new Error(`JSON schema executable not found in path: ${pluginFolder}`)
  }

  return path.join(pluginFolder, foundFiles[0])
}
