/**
 * Unit tests for src/install.ts
 *
 * Dependencies are mocked via __fixtures__ and jest.unstable_mockModule before
 * dynamically importing the module under test.
 */
import * as path from 'path'
import type { Stats } from 'fs'
import * as util from 'util'
import { jest } from '@jest/globals'
import * as fs from '../__fixtures__/fs.js'
import * as os from '../__fixtures__/os.js'
import * as tc from '../__fixtures__/tool-cache.js'

function mockStats(isDirectory: boolean): Stats {
  return { isDirectory: () => isDirectory } as Stats
}

jest.unstable_mockModule('os', () => os)
jest.unstable_mockModule('fs', () => fs)
jest.unstable_mockModule('@actions/tool-cache', () => tc)

const { getPlugin, installPlugin, findPlugin } =
  await import('../src/install.js')

describe('getPlugin tests', () => {
  let pluginRepository: string
  let version: string

  beforeEach(() => {
    jest.clearAllMocks()

    pluginRepository = 'helm-values-schema-json'
    version = 'v2.3.1'
  })

  it('should return the correct url for Windows_NT and arm64 arch', () => {
    const osType = 'Windows_NT'
    const osArch = 'arm64'
    const expectedUrl = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      'windows',
      osArch
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue(osArch)

    const result = getPlugin(version)

    expect(result).toBe(expectedUrl)
  })

  it('should return the correct url for Linux and arm64 arch', () => {
    const osType = 'Linux'
    const osArch = 'arm64'
    const expectedUrl = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      'linux',
      osArch
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue(osArch)

    const result = getPlugin(version)

    expect(result).toBe(expectedUrl)
  })

  it('should return the correct url for Darwin and amd64 arch', () => {
    const osType = 'Darwin'
    const urlArch = 'amd64'
    const expectedUrl = util.format(
      'https://github.com/losisin/%s/releases/download/%s/%s_%s_%s_%s.tgz',
      pluginRepository,
      version,
      pluginRepository,
      version.substring(1),
      'darwin',
      urlArch
    )
    os.type.mockReturnValue(osType)
    os.arch.mockReturnValue('x64')

    const result = getPlugin(version)

    expect(result).toBe(expectedUrl)
  })
})

describe('installPlugin', () => {
  let pluginName: string
  let version: string

  beforeEach(() => {
    jest.clearAllMocks()

    pluginName = 'schema'
    version = 'v2.3.1'
  })

  it('installs schema plugin if it is not already cached', async () => {
    os.type.mockReturnValue('Linux')
    tc.find.mockReturnValue('')
    tc.downloadTool.mockResolvedValue('/downloads/tool.tgz')
    fs.chmodSync.mockReturnValue(undefined)
    tc.extractTar.mockResolvedValue('/extracts/tool')
    tc.cacheDir.mockResolvedValue('/cached/plugin')
    fs.readdirSync.mockReturnValue(['other', 'schema'])
    fs.statSync.mockReturnValue(mockStats(false))

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
    os.type.mockReturnValue('Darwin')
    tc.find.mockReturnValue('/cached/plugin')
    fs.statSync.mockReturnValue(mockStats(false))

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
    os.type.mockReturnValue('Linux')
    fs.readdirSync.mockReturnValue(['schema'])
    fs.statSync.mockReturnValue(mockStats(false))

    const result = findPlugin('/some/dir')

    expect(result).toBe('/some/dir/schema')
    expect(fs.chmodSync).toHaveBeenCalledWith('/some/dir', '777')
  })

  it('ignores subdirectories', () => {
    const directoryName = 'a_subdirectory'
    const pluginFolder = '/some/dir'

    os.type.mockReturnValue('Windows_NT')
    fs.readdirSync.mockReturnValue([directoryName])
    fs.statSync.mockReturnValue(mockStats(true))

    expect(() => findPlugin(pluginFolder)).toThrow(
      `JSON schema executable not found in path: ${pluginFolder}`
    )
    expect(fs.statSync).toHaveBeenCalledWith(
      path.join(pluginFolder, directoryName)
    )
    expect(fs.statSync).toHaveBeenCalledTimes(1)
  })

  it('throws error when plugin file is not found', () => {
    os.type.mockReturnValue('Linux')
    fs.readdirSync.mockReturnValue(['notSchema'])
    fs.statSync.mockReturnValue(mockStats(false))

    expect(() => findPlugin('/some/dir')).toThrow(
      'JSON schema executable not found in path: /some/dir'
    )
  })
})
