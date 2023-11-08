import * as util from 'util'
import {
  run,
  installPlugin,
  isHelmInstalled,
  isPluginInstalled
} from '../src/index'
import * as indexModule from '../src/index'
import * as core from '@actions/core'
import { simpleGit } from 'simple-git'
import { jest } from '@jest/globals'

jest.mock('@actions/core')
jest.mock('util')
jest.mock('child_process')
jest.mock('simple-git')

describe('isHelmInstalled', () => {
  it('should return true when Helm is installed', async () => {
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.resolve('v3.9.0+g7ceeda6')
      }
    })

    const result = await isHelmInstalled()

    expect(result).toBe(true)
  })

  it('should return false when Helm is not installed', async () => {
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.reject(new Error('Command failed'))
      }
    })

    const result = await isHelmInstalled()

    expect(result).toBe(false)
  })
})

describe('isPluginInstalled', () => {
  it('should return true when the plugin is installed', async () => {
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.resolve('schema')
      }
    })

    const result = await isPluginInstalled()

    expect(result).toBe(true)
  })

  it('should return false when the plugin is not installed', async () => {
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.reject(new Error('Command failed'))
      }
    })

    const result = await isPluginInstalled()

    expect(result).toBe(false)
  })
})

describe('installPlugin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should install plugin if missing', async () => {
    jest.spyOn(indexModule, 'isPluginInstalled').mockResolvedValue(false)
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.resolve('Plugin successfully installed')
      }
    })

    await installPlugin()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledTimes(1)
  })

  it('should update plugin if installed', async () => {
    jest.spyOn(indexModule, 'isPluginInstalled').mockResolvedValue(true)
    jest.spyOn(util, 'promisify').mockImplementation(() => {
      return (...args: any[]) => {
        return Promise.resolve('Plugin successfully updated')
      }
    })

    await installPlugin()

    expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledTimes(1)
  })
})
