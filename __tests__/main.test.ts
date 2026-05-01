/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * To mock dependencies in ESM, fixtures export mock functions. Mocks are
 * registered with jest.unstable_mockModule before the module under test is
 * imported dynamically.
 */
import { jest } from '@jest/globals'
import type { SpiedFunction } from 'jest-mock'
import type { FileStatusResult, SimpleGit, StatusResult } from 'simple-git'
import * as core from '../__fixtures__/core.js'
import * as exec from '../__fixtures__/exec.js'
import * as fsp from '../__fixtures__/fs-promises.js'
import * as installMod from '../__fixtures__/install-plugin.js'
import * as simpleGitModule from '../__fixtures__/simple-git.js'

jest.unstable_mockModule('@actions/core', () => core)
jest.unstable_mockModule('@actions/exec', () => exec)
jest.unstable_mockModule('simple-git', () => simpleGitModule)
jest.unstable_mockModule('../src/install.js', () => installMod)
jest.unstable_mockModule('fs/promises', () => fsp)

function mockFileStatus(path: string): FileStatusResult {
  return { path, index: ' ', working_dir: 'M' }
}

function mockStatusResult(files: FileStatusResult[]): StatusResult {
  return {
    not_added: [],
    conflicted: [],
    created: [],
    deleted: [],
    modified: [],
    renamed: [],
    staged: [],
    files,
    ahead: 0,
    behind: 0,
    current: null,
    tracking: null,
    detached: false,
    isClean: () => files.length === 0
  }
}

const { run, getTargetValues } = await import('../src/main.js')

describe('run function', () => {
  let mockChdir: SpiedFunction<typeof process.chdir>

  beforeEach(() => {
    exec.exec.mockResolvedValue(0)
    mockChdir = jest.spyOn(process, 'chdir').mockImplementation(() => {})
  })

  afterEach(() => {
    jest.resetAllMocks()
    mockChdir.mockRestore()
  })

  it('should handle success scenario', async () => {
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      output: 'output',
      values: 'values',
      draft: 'draft',
      indent: 'indent',
      'working-directory': 'test/path'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([]))
    } as unknown as jest.Mocked<SimpleGit>
    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installPlugin).toHaveBeenCalledTimes(1)
    expect(core.getInput).toHaveBeenCalledWith('values')
    expect(core.getInput).toHaveBeenCalledWith('draft')
    expect(core.getInput).toHaveBeenCalledWith('output')
    expect(core.getInput).toHaveBeenCalledWith('indent')
    expect(core.getInput).toHaveBeenCalledWith('fail-on-diff')
    expect(core.getInput).toHaveBeenCalledWith('working-directory')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(core.info).toHaveBeenCalledWith(
      'Setting working directory to: test/path'
    )
    expect(core.info).toHaveBeenCalledWith(
      'No .schema.yaml found or unable to parse it'
    )
    expect(mockChdir).toHaveBeenCalledWith('test/path')
  })

  it("should handle fail-on-diff === 'true'", async () => {
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      output: 'output',
      values: 'values',
      draft: 'draft',
      indent: 'indent',
      'fail-on-diff': 'true'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('output')])),
      diff: jest
        .fn<(args?: string | string[]) => Promise<string>>()
        .mockResolvedValue('- old \n+ new ')
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(core.info).toHaveBeenNthCalledWith(
      3,
      "Diff for 'output':\n- old \n+ new "
    )
    expect(core.setFailed).toHaveBeenCalledWith("'output' has changed")
  })

  it("should handle fail-on-diff === 'true' when diff fails", async () => {
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      output: 'output',
      values: 'values',
      draft: 'draft',
      indent: 'indent',
      'fail-on-diff': 'true'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('output')])),
      diff: jest
        .fn<(args?: string | string[]) => Promise<string>>()
        .mockRejectedValue(new Error('diff failed'))
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(core.getInput).toHaveBeenCalledWith('values')
    expect(core.getInput).toHaveBeenCalledWith('output')
    expect(core.getInput).toHaveBeenCalledWith('draft')
    expect(core.getInput).toHaveBeenCalledWith('indent')
    expect(core.getInput).toHaveBeenCalledWith('fail-on-diff')
    expect(core.getInput).toHaveBeenCalledWith('working-directory')
    expect(gitMock.diff).toHaveBeenCalledWith(['--', 'output'])
    expect(core.info).toHaveBeenCalledWith("Unable to get diff for 'output'")
    expect(core.setFailed).toHaveBeenCalledWith("'output' has changed")
  })

  it("should handle git-push === 'true'", async () => {
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'true',
      'git-push-user-name': 'username',
      'git-push-user-email': 'user@email.com',
      'git-commit-message': 'message',
      output: 'output',
      values: 'values',
      draft: 'draft',
      indent: 'indent',
      id: 'id',
      title: 'title',
      description: 'description',
      additionalProperties: 'true',
      noAdditionalProperties: 'true'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('output')])),
      addConfig: jest
        .fn<(key: string, value: string) => Promise<string>>()
        .mockResolvedValue(''),
      add: jest
        .fn<(files: string | string[]) => Promise<string>>()
        .mockResolvedValue(''),
      commit: jest
        .fn<(message: string) => Promise<string>>()
        .mockResolvedValue(''),
      push: jest.fn<() => Promise<string>>().mockResolvedValue('')
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(installMod.installPlugin).toHaveBeenCalledWith('v2.3.1')
    expect(core.getInput).toHaveBeenCalledWith('values')
    expect(core.getInput).toHaveBeenCalledWith('draft')
    expect(core.getInput).toHaveBeenCalledWith('output')
    expect(core.getInput).toHaveBeenCalledWith('indent')
    expect(core.getInput).toHaveBeenCalledWith('id')
    expect(core.getInput).toHaveBeenCalledWith('title')
    expect(core.getInput).toHaveBeenCalledWith('description')
    expect(core.getInput).toHaveBeenCalledWith('additionalProperties')
    expect(core.getInput).toHaveBeenCalledWith('noAdditionalProperties')
    expect(core.getInput).toHaveBeenCalledWith('git-push')
    expect(core.getInput).toHaveBeenCalledWith('git-push-user-name')
    expect(core.getInput).toHaveBeenCalledWith('git-push-user-email')
    expect(core.getInput).toHaveBeenCalledWith('git-commit-message')
    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(
      1,
      'user.name',
      'username'
    )
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(
      2,
      'user.email',
      'user@email.com'
    )
    expect(gitMock.add).toHaveBeenCalledWith(['output'])
    expect(gitMock.commit).toHaveBeenCalledWith('message')
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(core.setOutput).toHaveBeenCalledWith('plugin-path', '/mocked/path')
    expect(core.info).toHaveBeenLastCalledWith("Pushed 'output' to the branch.")
  })

  it('sets failure if an error is thrown', async () => {
    const errorMessage = 'Something went wrong'

    installMod.installPlugin.mockResolvedValue('/mocked/path')
    core.getInput.mockImplementation(() => '')
    exec.exec.mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
  })

  it("should handle both git-push and fail-on-diff set to 'false', but schema generated", async () => {
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'false',
      'fail-on-diff': 'false',
      output: 'output',
      values: 'values',
      draft: 'draft',
      indent: 'indent'
    }

    core.getInput.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock = {
      status: jest
        .fn<() => Promise<StatusResult>>()
        .mockResolvedValue(mockStatusResult([mockFileStatus('output')]))
    } as unknown as jest.Mocked<SimpleGit>

    simpleGitModule.simpleGit.mockReturnValue(gitMock)

    await run()

    expect(core.info).toHaveBeenLastCalledWith(
      "'output' has changed, but no action was requested."
    )
  })

  it('should handle .schema.yaml configuration', async () => {
    fsp.readFile.mockResolvedValue('title: My Schema\ndescription: Test schema')
    installMod.installPlugin.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'working-directory': 'test/path'
    }
    core.getInput.mockImplementation((name: string) => inputMap[name])

    await run()

    expect(exec.exec).toHaveBeenCalledTimes(1)
    expect(fsp.readFile).toHaveBeenCalledWith('.schema.yaml', 'utf8')
  })

  it('should not add cached path to PATH when already present', async () => {
    const originalPath = process.env.PATH
    const cachedPath = '/mocked/path/schema'
    const cachedPathDir = '/mocked/path'

    process.env.PATH = `${cachedPathDir}:/usr/bin:/bin`
    installMod.installPlugin.mockResolvedValue(cachedPath)

    await run()

    expect(core.addPath).not.toHaveBeenCalled()

    process.env.PATH = originalPath
  })

  it('should handle non-Error instance without setting failed', async () => {
    const nonError = 'This is not an Error instance'

    installMod.installPlugin.mockRejectedValue(nonError)

    await run()

    expect(core.setFailed).not.toHaveBeenCalled()
  })
})

describe('getTargetValues', () => {
  it('should handle case when no values provided', () => {
    const result = getTargetValues({})

    expect(result).toEqual('values.yaml')
  })

  it('should prioritize config values', () => {
    const result = getTargetValues({
      values: ['other.yaml']
    })

    expect(result).toEqual('other.yaml')
  })
})
