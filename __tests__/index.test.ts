import * as util from 'util'
import * as core from '@actions/core'
import {
  run,
  installPlugin,
  isHelmInstalled,
  isPluginInstalled
} from '../src/index'
import * as indexModule from '../src/index'
import { expect } from '@jest/globals'

jest.mock('@actions/core')
jest.mock('util')
jest.mock('simple-git')
jest.mock('child_process')

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

    // expect(core.setFailed).not.toHaveBeenCalled()
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

    // expect(core.setFailed).not.toHaveBeenCalled()
    expect(core.info).toHaveBeenCalledTimes(1)
  })
})

// describe('run', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   it('should run successfully when everything is set up correctly', async () => {
//     // Mock core.getInput to return the expected values
//     jest.spyOn(core, 'getInput').mockImplementation((name) => {
//       switch (name) {
//         case 'input':
//           return '__tests__/values.yaml';
//         case 'draft':
//           return '2020';
//         case 'output':
//           return 'values-schema.json';
//         case 'git-push':
//           return 'false';
//         case 'git-push-user-name':
//           return 'github-actions[bot]';
//         case 'git-push-user-email':
//           return 'github-actions[bot]@users.noreply.github.com';
//         case 'git-commit-message':
//           return 'update values.schema.json';
//         case 'fail-on-diff':
//           return 'true';
//         default:
//           return '';
//       }
//     });

//     // Mock any other necessary dependencies (e.g., simple-git) with jest.fn() as needed

//     // Mock util.promisify to resolve without errors
//     jest.spyOn(util, 'promisify').mockImplementation((fn) => {
//       return (...args: any[]) => {
//         return Promise.resolve('Command output');
//       };
//     });

//     await run();

//     // Add your assertions here to check the expected behavior

//     expect(core.info).toHaveBeenCalledTimes(2); // Check info messages
//     expect(core.info).toHaveBeenCalledWith('Merged data saved to ${output}');
//     // ... add more assertions based on the expected behavior
//   });

//   it('should set a failure message if an error occurs during helm schema command execution', async () => {
//     // Mock core.getInput to return the expected values

//     // Mock util.promisify to reject with an error
//     jest.spyOn(util, 'promisify').mockImplementation((fn) => {
//       return (...args: any[]) => {
//         return Promise.reject(new Error('Command failed'));
//       };
//     });

//     await run();

//     // Add your assertions here to check the expected behavior
//     expect(core.setFailed).toHaveBeenCalledWith('Error running helm schema command');
//     expect(core.info).not.toHaveBeenCalled();
//     // ... add more assertions based on the expected behavior
//   });

//   // Add more test cases as needed to cover different scenarios
// });
