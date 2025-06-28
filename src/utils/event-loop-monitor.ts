export interface EventLoopMetrics {
  lagMs: number
  maxLagMs: number
  isHealthy: boolean
}

class EventLoopMonitor {
  private lagMs = 0
  private maxLagMs = 0
  private readonly threshold: number
  private intervalId?: any
  private isRunning = false

  constructor(thresholdMs = 100) {
    this.threshold = thresholdMs
  }

  start(intervalMs = 1000): void {
    if (this.isRunning) return
    
    this.isRunning = true
    // Use setTimeout in a loop instead of setInterval to avoid timing drift
    const scheduleNext = () => {
      this.measureLag()
      if (this.isRunning) {
        this.intervalId = setTimeout(scheduleNext, intervalMs)
      }
    }
    this.intervalId = setTimeout(scheduleNext, intervalMs)
  }

  stop(): void {
    this.isRunning = false
    if (this.intervalId) {
      this.intervalId = undefined
    }
  }

  private measureLag(): void {
    const start = Date.now()
    
    // Use Promise.resolve().then() as a setImmediate alternative
    Promise.resolve().then(() => {
      const lag = Date.now() - start
      this.lagMs = lag
      this.maxLagMs = Math.max(this.maxLagMs, lag)
      
      if (lag > this.threshold * 10) {
        // eslint-disable-next-line no-console
        console.warn(`High event loop lag detected: ${lag.toFixed(2)}ms`)
      }
    })
  }

  getMetrics(): EventLoopMetrics {
    return {
      lagMs: this.lagMs,
      maxLagMs: this.maxLagMs,
      isHealthy: this.lagMs < this.threshold
    }
  }

  reset(): void {
    this.lagMs = 0
    this.maxLagMs = 0
  }
}

// Utility to yield control back to event loop
export function yieldToEventLoop(): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, 0))
}

// Process large operations in chunks to prevent blocking
export async function processInChunks<T>(
  items: T[],
  processor: (item: T) => Promise<void> | void,
  chunkSize = 100
): Promise<void> {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize)
    
    for (const item of chunk) {
      await processor(item)
    }
    
    // Yield control after each chunk
    if (i + chunkSize < items.length) {
      await yieldToEventLoop()
    }
  }
}

export const eventLoopMonitor = new EventLoopMonitor()