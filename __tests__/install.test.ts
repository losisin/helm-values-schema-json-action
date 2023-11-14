import * as os from 'os'
import * as util from 'util'
import { getPlugin } from '../src/install'

jest.mock('os')
jest.mock('util')

describe('getPlugin tests', () => {
  let pluginRepository: string
  let version: string

  beforeEach(() => {
    jest.clearAllMocks()

    pluginRepository = 'helm-values-schema-json'
    version = 'v0.2.0'
  })
  it('should return the correct url for Windows_NT and arm64 arch', () => {
    const osType = 'windows'
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
    const osType = 'linux'
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
    const osType = 'darwin'
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
