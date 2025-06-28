import * as crypto from 'crypto'

// Async crypto operations that yield control periodically to prevent event loop blocking
export class AsyncCrypto {
  private static readonly CHUNK_SIZE = 64 * 1024 // 64KB chunks

  static async hashData(data: Buffer, algorithm = 'sha1'): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const hash = crypto.createHash(algorithm)
        
        if (data.length <= this.CHUNK_SIZE) {
          // Small data, process immediately
          hash.update(data)
          resolve(hash.digest('hex'))
          return
        }

        // Large data, process in chunks
        let offset = 0
        
        const processChunk = () => {
          try {
            const remaining = data.length - offset
            const chunkSize = Math.min(this.CHUNK_SIZE, remaining)
            const chunk = data.subarray(offset, offset + chunkSize)
            
            hash.update(chunk)
            offset += chunkSize
            
            if (offset >= data.length) {
              resolve(hash.digest('hex'))
            } else {
              // Yield control to event loop before processing next chunk
              setImmediate(processChunk)
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

  static async hashString(data: string, algorithm = 'sha1'): Promise<string> {
    const buffer = Buffer.from(data, 'utf8')
    return this.hashData(buffer, algorithm)
  }

  static async verifyIntegrity(data: Buffer, expectedHash: string): Promise<boolean> {
    try {
      // Extract algorithm from hash format (e.g., "sha1-abc123")
      const dashIndex = expectedHash.indexOf('-')
      if (dashIndex === -1) {
        throw new Error('Invalid integrity hash format')
      }
      
      const algorithm = expectedHash.substring(0, dashIndex)
      const expectedDigest = expectedHash.substring(dashIndex + 1)
      
      const actualHash = await this.hashData(data, algorithm)
      const actualDigest = Buffer.from(actualHash, 'hex').toString('base64')
      
      return actualDigest === expectedDigest
    } catch (error) {
      return false
    }
  }
}

// Utility function for yielding control (compatible version)
export function yieldControl(): Promise<void> {
  return new Promise(resolve => {
    // Use different methods based on what's available
    if (typeof setImmediate !== 'undefined') {
      setImmediate(resolve)
    } else if (typeof process !== 'undefined' && process.nextTick) {
      process.nextTick(resolve)
    } else {
      setTimeout(resolve, 0)
    }
  })
}