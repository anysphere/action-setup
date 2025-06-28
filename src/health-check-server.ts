import { createServer, IncomingMessage, ServerResponse } from 'http'

interface HealthStatus {
  status: 'healthy' | 'unhealthy'
  eventLoopLag?: number
  uptime: number
  timestamp: string
}

class HealthCheckServer {
  private server?: ReturnType<typeof createServer>
  private port: number
  private startTime: number
  private eventLoopLag = 0
  private lagCheckInterval?: NodeJS.Timeout

  constructor(port = 3001) {
    this.port = port
    this.startTime = Date.now()
  }

  start(): void {
    this.startEventLoopMonitoring()
    
    this.server = createServer((req: IncomingMessage, res: ServerResponse) => {
      this.handleRequest(req, res)
    })

    this.server.listen(this.port, () => {
      console.log(`Health check server listening on port ${this.port}`)
    })
  }

  stop(): void {
    if (this.lagCheckInterval) {
      clearInterval(this.lagCheckInterval)
    }
    
    if (this.server) {
      this.server.close()
    }
  }

  private startEventLoopMonitoring(): void {
    // Monitor event loop lag every 5 seconds
    this.lagCheckInterval = setInterval(() => {
      const start = Date.now()
      setImmediate(() => {
        this.eventLoopLag = Date.now() - start
      })
    }, 5000)
  }

  private handleRequest(req: IncomingMessage, res: ServerResponse): void {
    const url = req.url || ''
    
    if (url === '/health' || url === '/') {
      this.handleHealthCheck(res)
    } else if (url === '/ready') {
      this.handleReadinessCheck(res)
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'Not found' }))
    }
  }

  private handleHealthCheck(res: ServerResponse): void {
    const status: HealthStatus = {
      status: this.eventLoopLag < 1000 ? 'healthy' : 'unhealthy', // 1 second threshold
      eventLoopLag: this.eventLoopLag,
      uptime: Date.now() - this.startTime,
      timestamp: new Date().toISOString()
    }

    const statusCode = status.status === 'healthy' ? 200 : 503
    
    res.writeHead(statusCode, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    })
    res.end(JSON.stringify(status, null, 2))
  }

  private handleReadinessCheck(res: ServerResponse): void {
    // For readiness, we just check if we're running
    const ready = {
      status: 'ready',
      timestamp: new Date().toISOString()
    }

    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    })
    res.end(JSON.stringify(ready, null, 2))
  }
}

// Start health check server if this module is run directly
if (require.main === module) {
  const healthServer = new HealthCheckServer()
  healthServer.start()

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully')
    healthServer.stop()
    process.exit(0)
  })

  process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully')
    healthServer.stop()
    process.exit(0)
  })
}

export { HealthCheckServer }