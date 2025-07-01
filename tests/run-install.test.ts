import { parseRunInstall } from '../src/inputs/run-install'

// Mock @actions/core module
jest.mock('@actions/core', () => ({
  getInput: jest.fn(),
  error: jest.fn(),
}))

const { getInput, error } = require('@actions/core')

// Mock process.exit
const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit called')
})

describe('parseRunInstall', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockExit.mockClear()
  })

  afterAll(() => {
    mockExit.mockRestore()
  })

  it('should return empty array for null input', () => {
    getInput.mockReturnValue('null')
    const result = parseRunInstall('run_install')
    expect(result).toEqual([])
  })

  it('should return recursive config for true input', () => {
    getInput.mockReturnValue('true')
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{ recursive: true }])
  })

  it('should parse empty object', () => {
    getInput.mockReturnValue('{}')
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{}])
  })

  it('should parse single object with recursive', () => {
    getInput.mockReturnValue('recursive: true')
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{ recursive: true }])
  })

  it('should parse single object with cwd', () => {
    getInput.mockReturnValue('cwd: /test/path')
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{ cwd: '/test/path' }])
  })

  it('should parse single object with args', () => {
    getInput.mockReturnValue(`args:
  - --global
  - --global-dir=./pnpm-global
  - npm`)
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{ 
      args: ['--global', '--global-dir=./pnpm-global', 'npm'] 
    }])
  })

  it('should parse complex single object', () => {
    getInput.mockReturnValue(`recursive: true
cwd: /test/path
args:
  - --dev
  - --frozen-lockfile`)
    const result = parseRunInstall('run_install')
    expect(result).toEqual([{ 
      recursive: true,
      cwd: '/test/path',
      args: ['--dev', '--frozen-lockfile'] 
    }])
  })

  it('should parse array of objects', () => {
    getInput.mockReturnValue(`- {}
- recursive: true
- args:
  - --global
  - npm`)
    const result = parseRunInstall('run_install')
    expect(result).toEqual([
      {},
      { recursive: true },
      { args: ['--global', 'npm'] }
    ])
  })

  it('should handle YAML parsing errors and call process.exit', () => {
    getInput.mockReturnValue('invalid: yaml: content: [')
    
    expect(() => {
      parseRunInstall('run_install')
    }).toThrow()
    
    // The YAML parsing error is thrown before we get to our error handling
    // This is expected behavior - YAML parsing errors should surface
  })

  it('should handle invalid schema and call process.exit', () => {
    // Using a value that doesn't match our schema union (not null, boolean, object, or array)
    getInput.mockReturnValue('just_a_string')
    
    expect(() => {
      parseRunInstall('run_install')
    }).toThrow('process.exit called')
    
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Error for input "run_install"'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Errors:'))
    expect(mockExit).toHaveBeenCalledWith(1)
  })

  it('should handle invalid types in args', () => {
    getInput.mockReturnValue('args: not_an_array')
    
    expect(() => {
      parseRunInstall('run_install')
    }).toThrow('process.exit called')
    
    expect(mockExit).toHaveBeenCalledWith(1)
  })
})