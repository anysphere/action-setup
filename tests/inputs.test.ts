import { getInputs } from '../src/inputs'

// Mock @actions/core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  getBooleanInput: jest.fn(),
}))

// Mock expand-tilde module
jest.mock('expand-tilde', () => jest.fn((path: string) => path.replace('~', '/home/user')))

// Mock the run-install module
jest.mock('../src/inputs/run-install', () => ({
  parseRunInstall: jest.fn(),
}))

const { getInput, getBooleanInput } = require('@actions/core')
const expandTilde = require('expand-tilde')
const { parseRunInstall } = require('../src/inputs/run-install')

describe('getInputs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should parse all inputs correctly with default values', () => {
    getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version': return '8.0.0'
        case 'dest': return '~/pnpm'
        case 'package_json_file': return '~/package.json'
        default: return ''
      }
    })
    getBooleanInput.mockReturnValue(false)
    parseRunInstall.mockReturnValue([{ recursive: true }])

    const result = getInputs()

    expect(result).toEqual({
      version: '8.0.0',
      dest: '/home/user/pnpm',
      runInstall: [{ recursive: true }],
      packageJsonFile: '/home/user/package.json', 
      standalone: false,
    })

    expect(getInput).toHaveBeenCalledWith('version')
    expect(getInput).toHaveBeenCalledWith('dest', { required: true })
    expect(getInput).toHaveBeenCalledWith('package_json_file', { required: true })
    expect(getBooleanInput).toHaveBeenCalledWith('standalone')
    expect(parseRunInstall).toHaveBeenCalledWith('run_install')
  })

  it('should handle undefined version', () => {
    getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version': return ''
        case 'dest': return '/custom/dest'
        case 'package_json_file': return '/custom/package.json'
        default: return ''
      }
    })
    getBooleanInput.mockReturnValue(true)
    parseRunInstall.mockReturnValue([])

    const result = getInputs()

    expect(result.version).toBe('')
    expect(result.dest).toBe('/custom/dest')
    expect(result.packageJsonFile).toBe('/custom/package.json')
    expect(result.standalone).toBe(true)
    expect(result.runInstall).toEqual([])
  })

  it('should expand tilde in paths', () => {
    getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version': return '7.0.0'
        case 'dest': return '~/custom/pnpm'
        case 'package_json_file': return '~/project/package.json'
        default: return ''
      }
    })
    getBooleanInput.mockReturnValue(false)
    parseRunInstall.mockReturnValue([{}])

    const result = getInputs()

    expect(expandTilde).toHaveBeenCalledWith('~/custom/pnpm')
    expect(expandTilde).toHaveBeenCalledWith('~/project/package.json')
    expect(result.dest).toBe('/home/user/custom/pnpm')
    expect(result.packageJsonFile).toBe('/home/user/project/package.json')
  })

  it('should handle complex run_install configuration', () => {
    getInput.mockImplementation((name: string) => {
      switch (name) {
        case 'version': return '8.5.0'
        case 'dest': return '/opt/pnpm'
        case 'package_json_file': return '/opt/package.json'
        default: return ''
      }
    })
    getBooleanInput.mockReturnValue(true)
    parseRunInstall.mockReturnValue([
      { recursive: true },
      { cwd: '/test', args: ['--dev'] }
    ])

    const result = getInputs()

    expect(result.runInstall).toEqual([
      { recursive: true },
      { cwd: '/test', args: ['--dev'] }
    ])
  })
})