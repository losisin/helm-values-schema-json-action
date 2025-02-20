/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */
import { run } from '../src/main'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit, SimpleGit } from 'simple-git'
import { installPlugin } from '../src/install'

jest.mock('@actions/core')
jest.mock('@actions/exec')
jest.mock('simple-git')
jest.mock('../src/install')

describe('run function', () => {
  let getInputMock: jest.SpyInstance
  let setFailedMock: jest.SpyInstance
  let execMock: jest.SpyInstance
  let simpleGitMock: jest.MockedFunction<typeof simpleGit>
  let installPluginMock: jest.MockedFunction<typeof installPlugin>
  let setOutputMock: jest.SpyInstance
  let infoMock: jest.SpyInstance

  beforeEach(() => {
    jest.restoreAllMocks()

    getInputMock = jest.spyOn(core, 'getInput')
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    infoMock = jest.spyOn(core, 'info').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed')
    execMock = jest.spyOn(exec, 'exec').mockImplementation()
    simpleGitMock = simpleGit as unknown as jest.MockedFunction<typeof simpleGit>
    installPluginMock = installPlugin as unknown as jest.MockedFunction<typeof installPlugin>
  })

  it('should handle success scenario', async () => {
    installPluginMock.mockResolvedValue('/mocked/path')
    getInputMock.mockImplementation((inputName: string) => {
      switch (inputName) {
        case 'input':
          return 'some-input-value'
        case 'output':
          return 'some-output-value'
      }
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({ files: [] })
    } as any
    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installPluginMock).toHaveBeenCalledTimes(1)
    expect(getInputMock).toHaveBeenCalledWith('input')
    expect(getInputMock).toHaveBeenCalledWith('draft')
    expect(getInputMock).toHaveBeenCalledWith('output')
    expect(getInputMock).toHaveBeenCalledWith('indent')
    expect(getInputMock).toHaveBeenCalledWith('fail-on-diff')
    expect(getInputMock).toHaveBeenCalledWith('working-directory')
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
  })

  it("should handle fail-on-diff === 'true'", async () => {
    installPluginMock.mockResolvedValue('/mocked/path')
    getInputMock.mockImplementation((inputName: string) => {
      switch (inputName) {
        case 'input':
          return 'input'
        case 'output':
          return 'output'
        case 'fail-on-diff':
          return 'true'
      }
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'output' }]
      }),
      diff: jest.fn().mockResolvedValue('- old \n+ new ')
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(infoMock).toHaveBeenNthCalledWith(3, "Diff for 'output':\n- old \n+ new ")
    expect(setFailedMock).toHaveBeenCalledWith("'output' has changed")
  })

  it("should handle fail-on-diff === 'true'", async () => {
    installPluginMock.mockResolvedValue('/mocked/path')
    getInputMock.mockImplementation((inputName: string) => {
      switch (inputName) {
        case 'input':
          return 'input'
        case 'output':
          return 'output'
        case 'fail-on-diff':
          return 'true'
      }
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'output' }]
      }),
      diff: jest.fn().mockRejectedValue(new Error('diff failed'))
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(gitMock.diff).toHaveBeenCalledWith(['--', 'output'])
    expect(infoMock).toHaveBeenCalledWith("Unable to get diff for 'output'")
    expect(setFailedMock).toHaveBeenCalledWith("'output' has changed")
  })

  it("should handle git-push === 'true'", async () => {
    installPluginMock.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'true',
      'git-push-user-name': 'username',
      'git-push-user-email': 'user@email.com',
      'git-commit-message': 'message',
      output: 'output',
      input: 'input',
      draft: 'draft',
      indent: 'indent',
      id: 'id',
      title: 'title',
      description: 'description',
      additionalProperties: 'true'
    }

    getInputMock.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'output' }]
      }),
      addConfig: jest.fn().mockResolvedValue(undefined),
      add: jest.fn().mockResolvedValue(undefined),
      commit: jest.fn().mockResolvedValue(undefined),
      push: jest.fn().mockResolvedValue(undefined)
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installPluginMock).toHaveBeenCalledWith('v1.6.4')
    expect(getInputMock).toHaveBeenCalledWith('input')
    expect(getInputMock).toHaveBeenCalledWith('draft')
    expect(getInputMock).toHaveBeenCalledWith('output')
    expect(getInputMock).toHaveBeenCalledWith('indent')
    expect(getInputMock).toHaveBeenCalledWith('id')
    expect(getInputMock).toHaveBeenCalledWith('title')
    expect(getInputMock).toHaveBeenCalledWith('description')
    expect(getInputMock).toHaveBeenCalledWith('additionalProperties')
    expect(getInputMock).toHaveBeenCalledWith('git-push')
    expect(getInputMock).toHaveBeenCalledWith('git-push-user-name')
    expect(getInputMock).toHaveBeenCalledWith('git-push-user-email')
    expect(getInputMock).toHaveBeenCalledWith('git-commit-message')
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(1, 'user.name', 'username')
    expect(gitMock.addConfig).toHaveBeenNthCalledWith(2, 'user.email', 'user@email.com')
    expect(gitMock.add).toHaveBeenCalledWith(['output'])
    expect(gitMock.commit).toHaveBeenCalledWith('message')
    expect(gitMock.push).toHaveBeenCalledTimes(1)
    expect(setOutputMock).toHaveBeenCalledWith('plugin-path', '/mocked/path')
    expect(infoMock).toHaveBeenLastCalledWith("Pushed 'output' to the branch.")
  })

  it('sets failure if an error is thrown', async () => {
    const errorMessage = 'Something went wrong'

    jest.spyOn(exec, 'exec').mockImplementation(() => {
      throw new Error(errorMessage)
    })

    await run()

    expect(core.setFailed).toHaveBeenCalledWith(errorMessage)
  })

  it("should handle both git-push and fail-on-diff set to 'false', but schema generated", async () => {
    installPluginMock.mockResolvedValue('/mocked/path')
    const inputMap: { [key: string]: string } = {
      'git-push': 'false',
      'fail-on-diff': 'false',
      output: 'output',
      input: 'input',
      draft: 'draft',
      indent: 'indent'
    }

    getInputMock.mockImplementation((inputName: string) => {
      return inputMap[inputName]
    })

    const gitMock: jest.Mocked<SimpleGit> = {
      status: jest.fn().mockResolvedValue({
        files: [{ path: 'output' }]
      })
    } as any

    simpleGitMock.mockReturnValue(gitMock)

    await run()

    expect(installPluginMock).toHaveBeenCalledTimes(1)
    expect(getInputMock).toHaveBeenCalledWith('input')
    expect(getInputMock).toHaveBeenCalledWith('output')
    expect(getInputMock).toHaveBeenCalledWith('draft')
    expect(getInputMock).toHaveBeenCalledWith('indent')
    expect(getInputMock).toHaveBeenCalledWith('git-push')
    expect(getInputMock).toHaveBeenCalledWith('fail-on-diff')
    expect(execMock).toHaveBeenCalledTimes(1)
    expect(gitMock.status).toHaveBeenCalledTimes(1)
    expect(infoMock).toHaveBeenLastCalledWith("'output' has changed, but no action was requested.")
  })
})
