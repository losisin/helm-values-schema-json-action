import { jest } from '@jest/globals'

export const installPlugin =
  jest.fn<(pluginVersion: string) => Promise<string>>()
