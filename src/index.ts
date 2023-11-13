import * as os from 'os'
import * as path from 'path'
import * as util from 'util'
import * as fs from 'fs'

import { simpleGit } from 'simple-git'
import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as tc from '@actions/tool-cache'

// export async function installPlugin(): Promise<void> {
//   try {
//     const helmInstalled = await isHelmInstalled()
//     if (!helmInstalled) {
//       core.setFailed('Helm is required to install the plugin')
//     }

//     const pluginInstalled = await isPluginInstalled()

//     if (pluginInstalled) {
//       // const updateCommand = 'helm plugin update schema'
//       // await util.promisify(exec)(updateCommand)
//       await exec.exec('helm', ['plugin', 'update', 'schema'])
//       core.info('Plugin successfully updated')
//     } else {
//       // const installCommand =
//       //   'helm plugin install https://github.com/losisin/helm-values-schema-json.git'
//       // await util.promisify(exec)(installCommand)
//       await exec.exec('helm', ['plugin', 'install'])
//       core.info('Plugin successfully installed')
//     }
//   } catch (error) {
//     core.setFailed('Error installing plugin')
//   }
// }

// export async function downloadPlugin(version: string): Promise<string> {
//   let cachedToolpath = tc.find(pluginName, version)
//   if (!cachedToolpath) {
//      let helmDownloadPath
//      try {
//         helmDownloadPath = await tc.downloadTool(
//            getPluginURL(version)
//         )
//      } catch (exception) {
//         throw new Error(
//            `Failed to download plugin from location ${getPluginURL(
//               version
//            )}`
//         )
//      }

//      core.info(getPluginURL(version))

//      fs.chmodSync(helmDownloadPath, '777')
//      const unTaredPath = await tc.extractTar(helmDownloadPath)
//      cachedToolpath = await tc.cacheDir(
//         unTaredPath,
//         pluginName,
//         version
//      )
//   }

  // const pluginPath = findPlugin(cachedToolpath)
  // if (!pluginPath) {
  //    throw new Error(
  //       util.format('Helm executable not found in path', cachedToolpath)
  //    )
  // }

  // fs.chmodSync(pluginPath, '777')
//   return getPluginURL(version)
// }

export function getExecutableExtension(): string {
  if (os.type().match(/^Win/)) {
     return '.exe'
  }
  return ''
}

const pluginName = 'schema'

const LINUX = 'Linux'
const MAC_OS = 'Darwin'
const WINDOWS = 'Windows_NT'
const ARM64 = 'arm64'

export function getPlugin(version: string): string {
  const arch = os.arch()
  const operatingSystem = os.type()

  switch (true) {
     case operatingSystem == LINUX && arch == ARM64:
        return util.format('https://github.com/losisin/helm-values-schema-json/releases/download/v%s/helm-values-schema-json_%s_linux_arm64.tgz', version)
     case operatingSystem == LINUX:
        return util.format('https://github.com/losisin/helm-values-schema-json/releases/download/v%s/helm-values-schema-json_%s_linux_amd64.tgz', version)
     case operatingSystem == MAC_OS && arch == ARM64:
        return util.format('https://github.com/losisin/helm-values-schema-json/releases/download/v%s/helm-values-schema-json_%s_darwin_arm64.tgz', version)
     case operatingSystem == MAC_OS:
        return util.format('https://github.com/losisin/helm-values-schema-json/releases/download/v%s/helm-values-schema-json_%s_darwin_amd64.tgz', version)

     case operatingSystem == WINDOWS:
     default:
        return util.format('https://github.com/losisin/helm-values-schema-json/releases/download/v%s/helm-values-schema-json_%s_windows_amd64.tgz', version)
  }
}

export async function installPlugin(version: string): Promise<string> {
  let cachedToolpath = tc.find(pluginName, version)
  if (!cachedToolpath) {
     let helmDownloadPath
     try {
        helmDownloadPath = await tc.downloadTool(getPlugin(version))
     } catch (exception) {
        throw new Error(`Failed to download plugin from: ${getPlugin(version)}`)
     }

     fs.chmodSync(helmDownloadPath, '777')
     const unTaredPath = await tc.extractTar(helmDownloadPath)
     cachedToolpath = await tc.cacheDir(
        unTaredPath,
        pluginName,
        version
     )
  }

  const pluginPath = findPlugin(cachedToolpath)
  if (!pluginPath) {
     throw new Error(util.format('Plugin not found in path', cachedToolpath))
  }

  fs.chmodSync(pluginPath, '777')
  console.log(getPlugin(version))
  return getPlugin(version)
}

export function findPlugin(rootFolder: string): string {
  fs.chmodSync(rootFolder, '777')
  var filelist: string[] = []
  walkSync(rootFolder, filelist, pluginName + getExecutableExtension())
  if (!filelist || filelist.length == 0) {
     throw new Error(
        util.format('Helm executable not found in path', rootFolder)
     )
  } else {
     return filelist[0]
  }
}

export var walkSync = function (dir: string, filelist: string[], fileToFind: string): string[] {
  var files = fs.readdirSync(dir)
  filelist = filelist || []
  files.forEach(function (file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist, fileToFind)
    } else {
      core.debug(file)
      if (file == fileToFind) {
        filelist.push(path.join(dir, file))
      }
    }
  })
  return filelist
}


export async function run(): Promise<void> {
  // try {
    const version = "0.2.0"
    const input = core.getInput('input')
    const draft = core.getInput('draft')
    const output = core.getInput('output')
    const gitPush = core.getInput('git-push')
    const gitPushUserName = core.getInput('git-push-user-name')
    const gitPushUserEmail = core.getInput('git-push-user-email')
    const gitCommitMessage = core.getInput('git-commit-message')
    const failOnDiff = core.getInput('fail-on-diff')

    core.startGroup(`Downloading ${version}`)
    const cachedPath = await installPlugin(version)
    core.endGroup()

    try {
       if (!process.env['PATH']?.startsWith(path.dirname(cachedPath))) {
          core.addPath(path.dirname(cachedPath))
       }
    } catch {
       //do nothing, set as output variable
    }

    core.info(`Helm tool version '${version}' has been cached at ${cachedPath}`)
    core.setOutput('helm-path', cachedPath)

    // const helmSchemaCommand = `helm schema -input ${input} -output ${output} -draft ${draft}`
    // try {
    //   await exec.exec('helm', ['schema', '-input', input, '-output', output, '-draft', draft])
    //   // await util.promisify(exec)(helmSchemaCommand)
    //   core.info(`Merged data saved to '${output}'`)
    // } catch (error) {
    //   core.setFailed('Error running helm schema command')
    // }

    // const git = simpleGit()
    // const statusSummary = await git.status()

    // const outputStatus = statusSummary.files.find(file => file.path === output)
    // if (outputStatus) {
    //   switch (true) {
    //     case failOnDiff === 'true':
    //       core.setFailed(`'${output}' has changed`)
    //       break
    //     case gitPush === 'true':
    //       await git.addConfig('user.name', gitPushUserName)
    //       await git.addConfig('user.email', gitPushUserEmail)
    //       await git.add([output])
    //       await git.commit(gitCommitMessage)
    //       await git.push()
    //       core.info(`Pushed '${output}' to the branch.`)
    //       break
    //     default:
    //       core.info(`'${output}' has unchanged, but no action was requested.`)
    //   }
    // } else {
    //   core.info(`'${output}' is up to date.`)
    // }
  // } catch (error) {
  //   if (error instanceof Error) core.setFailed(error.message)
  // }
}

run()
