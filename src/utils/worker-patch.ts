import * as fs from 'fs'
import * as crypto from 'crypto'
import { promisify } from 'util'

// Promisified fs operations
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)
const unlink = promisify(fs.unlink)

// Helper to yield control to event loop
function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setImmediate(resolve))
}

/**
 * Non-blocking alternative to crypto operations
 */
export class NonBlockingCrypto {
  private static readonly CHUNK_SIZE = 64 * 1024 // 64KB

  static async createHash(algorithm: string, data: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash(algorithm)
        
        if (data.length <= this.CHUNK_SIZE) {
          hash.update(data)
          resolve(hash.digest('hex'))
          return
        }

        let offset = 0
        const processChunk = async (): Promise<void> => {
          try {
            const remaining = data.length - offset
            const chunkSize = Math.min(this.CHUNK_SIZE, remaining)
            const chunk = data.subarray(offset, offset + chunkSize)
            
            hash.update(chunk)
            offset += chunkSize
            
            if (offset >= data.length) {
              resolve(hash.digest('hex'))
            } else {
              await yieldToEventLoop()
              await processChunk()
            }
          } catch (error) {
            reject(error)
          }
        }
        
        processChunk()
      } catch (error) {
        reject(error)
      }
    })
  }

  static async verifyIntegrity(data: Buffer, expectedIntegrity: string): Promise<boolean> {
    try {
      const [algorithm, expectedHash] = expectedIntegrity.split('-')
      if (!algorithm || !expectedHash) {
        return false
      }
      
      const actualHash = await this.createHash(algorithm, data)
      const actualBase64 = Buffer.from(actualHash, 'hex').toString('base64')
      
      return actualBase64 === expectedHash
    } catch {
      return false
    }
  }
}

/**
 * Non-blocking file operations with integrity checking
 */
export class NonBlockingFileOps {
  static async verifyFileIntegrity(filename: string, expectedFile: any): Promise<any> {
    try {
      const data = await readFile(filename)
      const passed = await NonBlockingCrypto.verifyIntegrity(data, expectedFile.integrity)
      
      if (!passed) {
        await unlink(filename).catch(() => {}) // Ignore errors on cleanup
        return { passed: false }
      }
      
      return { passed: true }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return { passed: false }
      }
      throw error
    }
  }

  static async writeJsonFile(filePath: string, data: any): Promise<void> {
    const targetDir = require('path').dirname(filePath)
    await mkdir(targetDir, { recursive: true })
    
    const temp = `${filePath.slice(0, -11)}${process.pid}`
    await writeFile(temp, JSON.stringify(data))
    
    // Atomic rename
    await promisify(fs.rename)(temp, filePath)
  }

  static async readJsonFile(filePath: string): Promise<any> {
    const data = await readFile(filePath, 'utf8')
    return JSON.parse(data)
  }
}

/**
 * Message processor that yields control between operations
 */
export class NonBlockingMessageHandler {
  static async processMessage(message: any, originalHandler: (msg: any) => Promise<any>): Promise<any> {
    // Yield control before processing
    await yieldToEventLoop()
    
    try {
      const result = await originalHandler(message)
      
      // Yield control after processing
      await yieldToEventLoop()
      
      return result
    } catch (error) {
      // Yield control even on error
      await yieldToEventLoop()
      throw error
    }
  }

  static async processInBatches<T>(
    items: T[], 
    processor: (item: T) => Promise<void>,
    batchSize = 50
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      // Process batch
      await Promise.all(batch.map(processor))
      
      // Yield control between batches
      if (i + batchSize < items.length) {
        await yieldToEventLoop()
      }
    }
  }
}

/**
 * Enhanced tarball processing that won't block the event loop
 */
export async function addTarballToStoreNonBlocking(
  buffer: Buffer,
  integrity?: string,
  _cafsDir?: string,
  pkg?: any
): Promise<any> {
  // Verify integrity without blocking
  if (integrity) {
    const [algo, integrityHash] = integrity.match(/^([^-]+)-([A-Za-z0-9+/=]+)$/) || []
    if (algo && integrityHash) {
      const actualHash = await NonBlockingCrypto.createHash(algo, buffer)
      const expectedHash = Buffer.from(integrityHash, 'base64').toString('hex')
      
      if (actualHash !== expectedHash) {
        return {
          status: 'error',
          error: {
            type: 'integrity_validation_failed',
            algorithm: algo,
            expected: integrity,
            found: `${algo}-${Buffer.from(actualHash, 'hex').toString('base64')}`
          }
        }
      }
    }
  }

  // Yield control before expensive operations
  await yieldToEventLoop()

  // Process tarball (this would integrate with existing CAFS logic)
  // For now, return a placeholder response
  return {
    status: 'success',
    value: {
      filesIndex: {},
      manifest: pkg
    }
  }
}

export { yieldToEventLoop }