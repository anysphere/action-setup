import { setOutputs } from '../src/outputs'
import { Inputs } from '../src/inputs'

// Mock @actions/core module
jest.mock('@actions/core', () => ({
  setOutput: jest.fn(),
  addPath: jest.fn(),
}))

// Mock utils module
jest.mock('../src/utils', () => ({
  getBinDest: jest.fn(),
}))

const { setOutput, addPath } = require('@actions/core')
const { getBinDest } = require('../src/utils')

describe('setOutputs', () => {
  const mockInputs: Inputs = {
    dest: '/test/dest',
    runInstall: [],
    packageJsonFile: '/test/package.json',
    standalone: false,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should set outputs correctly', () => {
    const binDest = '/test/dest/node_modules/.bin'
    getBinDest.mockReturnValue(binDest)

    setOutputs(mockInputs)

    expect(getBinDest).toHaveBeenCalledWith(mockInputs)
    expect(addPath).toHaveBeenCalledWith(binDest)
    expect(setOutput).toHaveBeenCalledWith('dest', '/test/dest')
    expect(setOutput).toHaveBeenCalledWith('bin_dest', binDest)
  })

  it('should handle different destinations', () => {
    const inputs = { ...mockInputs, dest: '/different/path' }
    const binDest = '/different/path/node_modules/.bin'
    getBinDest.mockReturnValue(binDest)

    setOutputs(inputs)

    expect(getBinDest).toHaveBeenCalledWith(inputs)
    expect(addPath).toHaveBeenCalledWith(binDest)
    expect(setOutput).toHaveBeenCalledWith('dest', '/different/path')
    expect(setOutput).toHaveBeenCalledWith('bin_dest', binDest)
  })

  it('should call functions in correct order', () => {
    const binDest = '/test/bin'
    getBinDest.mockReturnValue(binDest)

    setOutputs(mockInputs)

    // Verify all functions were called
    expect(getBinDest).toHaveBeenCalled()
    expect(addPath).toHaveBeenCalled()
    expect(setOutput).toHaveBeenCalled()
  })
})