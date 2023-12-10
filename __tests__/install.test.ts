import * as os from 'os'
import * as fs from 'fs'
import * as path from 'path'
import * as util from 'util'
import { getPlugin, installPlugin, findPlugin } from '../src/install'
import * as tc from '@actions/tool-cache'

jest.mock('os')
jest.mock('fs')
jest.mock('util')
jest.mock('@actions/tool-cache', () => ({
  downloadTool: jest.fn().mockResolvedValue('/mocked/path/tool.tgz'),
  find: jest.fn().mockReturnValue('/mocked/path/cachedTool'),
  extractTar: jest.fn().mockResolvedValue('/mocked/path/untarredTool'),
  cacheDir: jest.fn().mockResolvedValue('/mocked/path/cachedDir')
}))

describe('getPlugin tests', () => {
  let pluginRepository: string
  let version: string

  beforeEach(() => {
    jest.clearAllMocks()

    pluginRepository = 'helm-values-schema-json'
    version = 'v1.0.0'
  })

  it('should return the correct url for Windows_NT and arm64 arch', () => {
    const osType = 'Windows_NT'
    const osArch = 'arm64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getPlugin(version)

    expect(result).toBe(windowsURL)
  })

  it('should return the correct url for Linux and arm64 arch', () => {
    const osType = 'Linux'
    const osArch = 'arm64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getPlugin(version)

    expect(result).toBe(windowsURL)
  })

  it('should return the correct url for MAC_OS and amd64 arch', () => {
    const osType = 'Darwin'
    const osArch = 'amd64'
    const windowsURL = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      osType,
      osArch
    )
    ;(os.type as jest.Mock).mockReturnValue(osType)
    ;(os.arch as jest.Mock).mockReturnValue(osArch)

    const result = getPlugin(version)

    expect(result).toBe(windowsURL)
  })
})

describe('installPlugin', () => {
  let pluginName: string
  let version: string

  beforeEach(() => {
    jest.clearAllMocks()

    pluginName = 'schema'
    version = 'v1.0.0'
  })

  it('installs schema plugin if it is not already cached', async () => {
    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(tc.find as jest.Mock).mockReturnValue('')
    ;(tc.downloadTool as jest.Mock).mockResolvedValue('/downloads/tool.tgz')
    ;(fs.chmodSync as jest.Mock).mockReturnValue(null)
    ;(tc.extractTar as jest.Mock).mockResolvedValue('/extracts/tool')
    ;(tc.cacheDir as jest.Mock).mockResolvedValue('/cached/plugin')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['other', 'schema'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = await installPlugin(version)

    expect(result).toBe('/cached/plugin/schema')
    expect(tc.find).toHaveBeenCalledWith(pluginName, version)
    expect(tc.downloadTool).toHaveBeenCalledWith(getPlugin(version))
    expect(fs.chmodSync).toHaveBeenCalledWith('/downloads/tool.tgz', '777')
    expect(tc.extractTar).toHaveBeenCalledWith('/downloads/tool.tgz')
    expect(tc.cacheDir).toHaveBeenCalledWith(
      '/extracts/tool',
      pluginName,
      version
    )
  })

  it('finds schema plugin from the cache if it is already cached', async () => {
    ;(os.type as jest.Mock).mockReturnValue('Darwin')
    ;(tc.find as jest.Mock).mockReturnValue('/cached/plugin')
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = await installPlugin(version)

    expect(result).toBe('/cached/plugin/schema')
    expect(tc.find).toHaveBeenCalledWith(pluginName, version)
    expect(tc.downloadTool).not.toHaveBeenCalled()
    expect(tc.extractTar).not.toHaveBeenCalled()
    expect(tc.cacheDir).not.toHaveBeenCalled()
  })
})
describe('findPlugin', () => {
  it('finds the correct file in the directory', () => {
    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['schema'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    const result = findPlugin('/some/dir')

    expect(result).toBe('/some/dir/schema')
    expect(fs.chmodSync).toHaveBeenCalledWith('/some/dir', '777')
  })

  it('ignores subdirectories', () => {
    const directoryName = 'a_subdirectory'
    const pluginFolder = '/some/dir'

    ;(os.type as jest.Mock).mockReturnValue('Windows_NT')
    ;(fs.readdirSync as jest.Mock).mockReturnValue([directoryName])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true })

    expect(() => findPlugin(pluginFolder)).toThrow(
      `JSON schema executable not found in path: ${pluginFolder}`
    )
    expect(fs.statSync).toHaveBeenCalledWith(
      path.join(pluginFolder, directoryName)
    )
    expect(fs.statSync).toHaveBeenCalledTimes(1)
  })

  it('throws error when plugin file is not found', () => {
    ;(os.type as jest.Mock).mockReturnValue('Linux')
    ;(fs.readdirSync as jest.Mock).mockReturnValue(['notSchema'])
    ;(fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => false })

    expect(() => findPlugin('/some/dir')).toThrow(
      'JSON schema executable not found in path: /some/dir'
    )
  })
})
