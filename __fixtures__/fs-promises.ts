import type * as fsp from 'fs/promises'
import { jest } from '@jest/globals'

export const readFile = jest.fn<typeof fsp.readFile>()
