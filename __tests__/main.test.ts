/**
 * Unit tests for the action's main functionality, src/main.ts
 *
 * These should be run as if the action was called from a workflow.
 * Specifically, the inputs listed in `action.yml` should be set as environment
 * variables following the pattern `INPUT_<INPUT_NAME>`.
 */
import * as path from 'path'
import * as main from '../src/main'

import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { simpleGit } from 'simple-git'

// Mock the action's main function
const runMock = jest.spyOn(main, 'run')

// Mock the GitHub Actions core library
let getInputMock: jest.SpyInstance
let infoMock: jest.SpyInstance
let setFailedMock: jest.SpyInstance
let setOutputMock: jest.SpyInstance
let addPathMock: jest.SpyInstance
let startGroupMock: jest.SpyInstance
let endGroupMock: jest.SpyInstance

describe('action', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    getInputMock = jest.spyOn(core, 'getInput').mockImplementation()
    infoMock = jest.spyOn(core, 'info').mockImplementation()
    setFailedMock = jest.spyOn(core, 'setFailed').mockImplementation()
    setOutputMock = jest.spyOn(core, 'setOutput').mockImplementation()
    addPathMock = jest.spyOn(core, 'addPath').mockImplementation()
    startGroupMock = jest.spyOn(core, 'startGroup').mockImplementation()
    endGroupMock = jest.spyOn(core, 'endGroup').mockImplementation()
  })

  it('sets the time output', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.mockImplementation((name: string): string => {
      switch (name) {
        case 'input':
          return '__tests__/fixtures/values.yaml'
        case 'output':
          return 'values.schema.json'
        case 'draft':
          return '2020'
        default:
          return ''
      }
    })

    await main.run()
    expect(runMock).toHaveReturned()

    // Verify that all of the core library functions were called correctly
    // expect(debugMock).toHaveBeenNthCalledWith(1, 'Waiting 500 milliseconds ...')
    // expect(debugMock).toHaveBeenNthCalledWith(
    //   2,
    //   expect.stringMatching(timeRegex)
    // )
    // expect(debugMock).toHaveBeenNthCalledWith(
    //   3,
    //   expect.stringMatching(timeRegex)
    // )
    // expect(setOutputMock).toHaveBeenNthCalledWith(
    //   1,
    //   'time',
    //   expect.stringMatching(timeRegex)
    // )
    // expect(setFailedMock).not.toHaveBeenCalled()
  })

  // it('sets a failed status', async () => {
  //   // Set the action's inputs as return values from core.getInput()
  //   getInputMock.mockImplementation((name: string): string => {
  //     switch (name) {
  //       case 'input':
  //         return ''
  //       default:
  //         return ''
  //     }
  //   })

  //   await main.run()
  //   // expect(runMock).toHaveReturned()

  //   // Verify that all of the core library functions were called correctly
  //   // expect(setFailedMock).toHaveBeenNthCalledWith(
  //   //   1,
  //   //   'milliseconds not a number'
  //   // )
  //   expect(setFailedMock).not.toHaveBeenCalled()
  // })
})
