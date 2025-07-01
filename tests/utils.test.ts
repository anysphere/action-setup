import path from 'path'
import { getBinDest, patchPnpmEnv } from '../src/utils'
import { Inputs } from '../src/inputs'

describe('Utils', () => {
  const mockInputs: Inputs = {
    dest: '/test/dest',
    runInstall: [],
    packageJsonFile: '/test/package.json',
    standalone: false,
  }

  describe('getBinDest', () => {
    it('should return correct bin destination path', () => {
      const result = getBinDest(mockInputs)
      const expected = path.join('/test/dest', 'node_modules', '.bin')
      expect(result).toBe(expected)
    })

    it('should handle different destination paths', () => {
      const inputs = { ...mockInputs, dest: '/different/path' }
      const result = getBinDest(inputs)
      const expected = path.join('/different/path', 'node_modules', '.bin')
      expect(result).toBe(expected)
    })
  })

  describe('patchPnpmEnv', () => {
    const originalEnv = process.env

    beforeEach(() => {
      process.env = { ...originalEnv, PATH: '/usr/bin:/bin' }
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('should add bin destination to PATH', () => {
      const result = patchPnpmEnv(mockInputs)
      const binDest = getBinDest(mockInputs)
      const expectedPath = binDest + path.delimiter + '/usr/bin:/bin'
      
      expect(result.PATH).toBe(expectedPath)
    })

    it('should preserve other environment variables', () => {
      process.env.TEST_VAR = 'test_value'
      const result = patchPnpmEnv(mockInputs)
      
      expect(result.TEST_VAR).toBe('test_value')
      expect(result.PATH).toContain(getBinDest(mockInputs))
    })

    it('should handle empty PATH', () => {
      process.env.PATH = ''
      const result = patchPnpmEnv(mockInputs)
      const binDest = getBinDest(mockInputs)
      
      expect(result.PATH).toBe(binDest + path.delimiter)
    })
  })
})