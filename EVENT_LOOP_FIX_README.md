# Event Loop Blocking Fix for Bugbot Worker

## Problem Summary

The bugbot worker services are experiencing high event loop delay (100+ seconds) which causes health check failures and container restarts in ECS. This is caused by synchronous operations in the pnpm worker that block the event loop.

## Root Cause Analysis

The main issues identified are:

1. **Synchronous crypto operations**: Large file integrity verification using `crypto.createHash().update().digest()` blocks the event loop
2. **Synchronous file operations**: Multiple `fs.*Sync()` calls that should be async
3. **Message processing**: Worker processes messages synchronously without yielding control
4. **No event loop monitoring**: No way to detect when the event loop is blocked

## Solution Implementation

### 1. Health Check Server

Deploy the health check server to monitor event loop health:

```typescript
// src/health-check-server.ts
import { HealthCheckServer } from './health-check-server'

const healthServer = new HealthCheckServer(3001)
healthServer.start()
```

**ECS Health Check Configuration:**
```json
{
  "healthCheck": {
    "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
    "interval": 30,
    "timeout": 5,
    "retries": 3,
    "startPeriod": 60
  }
}
```

### 2. Worker Patch Implementation

Replace blocking operations in the worker with non-blocking alternatives:

#### Before (Blocking):
```javascript
// Synchronous crypto operation
const hash = crypto.createHash(algo).update(buffer).digest('hex')

// Synchronous file operation  
const data = fs.readFileSync(filename)
```

#### After (Non-blocking):
```typescript
import { NonBlockingCrypto, NonBlockingFileOps } from './utils/worker-patch'

// Async crypto with yielding
const hash = await NonBlockingCrypto.createHash(algo, buffer)

// Async file operation
const data = await NonBlockingFileOps.readJsonFile(filename)
```

### 3. Message Handler Modification

Wrap the existing message handler to add yielding:

```typescript
import { NonBlockingMessageHandler } from './utils/worker-patch'

// Original handler
async function handleMessage(message: any) {
  return await NonBlockingMessageHandler.processMessage(message, async (msg) => {
    // Original message processing logic here
    switch (msg.type) {
      case "extract":
        return await addTarballToStoreNonBlocking(msg.buffer, msg.integrity)
      // ... other cases
    }
  })
}
```

### 4. Docker Configuration

Update the Dockerfile to include health checks:

```dockerfile
# Add health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Expose health check port
EXPOSE 3001
```

### 5. ECS Task Definition Updates

Update the ECS task definition to include the health check:

```json
{
  "containerDefinitions": [
    {
      "name": "bugbot-worker",
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3001/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      },
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ]
    }
  ]
}
```

## Configuration Options

### Health Check Thresholds

Adjust the event loop lag threshold based on your requirements:

```typescript
const healthServer = new HealthCheckServer(3001)
// Default threshold is 1000ms, adjust as needed
```

### Crypto Chunk Size

Adjust the chunk size for crypto operations:

```typescript
// In NonBlockingCrypto class
private static readonly CHUNK_SIZE = 32 * 1024 // 32KB for smaller chunks
```

### Batch Processing

Configure batch sizes for large operations:

```typescript
await NonBlockingMessageHandler.processInBatches(items, processor, 25) // Smaller batches
```

## Monitoring and Alerting

### CloudWatch Metrics

Monitor these metrics in CloudWatch:

1. **Event Loop Lag**: Custom metric from health endpoint
2. **Health Check Success Rate**: ECS built-in metric
3. **Container Restart Count**: Track stability

### Sample CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "HealthCheckSuccessRate", "ServiceName", "bugbot-worker"]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Health Check Success Rate"
      }
    }
  ]
}
```

## Testing the Fix

### 1. Local Testing

```bash
# Start the health check server
npm run build
node dist/health-check-server.js

# Test the health endpoint
curl http://localhost:3001/health
```

### 2. Load Testing

Simulate high load to verify event loop doesn't block:

```bash
# Use Apache Bench to generate load
ab -n 1000 -c 10 http://localhost:3001/health
```

### 3. Event Loop Monitoring

Monitor event loop lag during operation:

```bash
# Check health endpoint for lag metrics
watch -n 1 'curl -s http://localhost:3001/health | jq .eventLoopLag'
```

## Deployment Strategy

### 1. Gradual Rollout

1. Deploy to staging environment first
2. Monitor event loop metrics for 24 hours
3. Deploy to 25% of production instances
4. Monitor for 48 hours before full rollout

### 2. Rollback Plan

If issues occur:

1. Revert to previous ECS task definition
2. Scale down affected instances
3. Investigate logs and metrics

### 3. Success Criteria

- Event loop lag consistently < 100ms
- Health check success rate > 99%
- Zero container restarts due to health check failures
- No degradation in processing throughput

## Additional Recommendations

### 1. Worker Pool Scaling

Consider implementing worker pool scaling based on event loop health:

```typescript
// Scale down if event loop lag is consistently high
if (eventLoopLag > 5000) {
  // Signal to stop accepting new work
  // Allow existing work to complete
}
```

### 2. Circuit Breaker Pattern

Implement circuit breaker for expensive operations:

```typescript
class CircuitBreaker {
  private failures = 0
  private isOpen = false
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.isOpen) {
      throw new Error('Circuit breaker is open')
    }
    
    try {
      const result = await operation()
      this.failures = 0
      return result
    } catch (error) {
      this.failures++
      if (this.failures > 5) {
        this.isOpen = true
        setTimeout(() => { this.isOpen = false }, 60000) // Reset after 1 minute
      }
      throw error
    }
  }
}
```

### 3. Metrics Collection

Add custom metrics for better observability:

```typescript
// Custom CloudWatch metrics
import AWS from 'aws-sdk'
const cloudwatch = new AWS.CloudWatch()

async function publishEventLoopMetric(lag: number) {
  await cloudwatch.putMetricData({
    Namespace: 'BugbotWorker',
    MetricData: [{
      MetricName: 'EventLoopLag',
      Value: lag,
      Unit: 'Milliseconds',
      Timestamp: new Date()
    }]
  }).promise()
}
```

## Conclusion

This fix addresses the root cause of event loop blocking by:

1. Making crypto operations async and chunked
2. Converting sync file operations to async
3. Adding proper yielding in message processing
4. Implementing health monitoring
5. Providing ECS-compatible health checks

The implementation should significantly reduce event loop lag and eliminate health check failures, resulting in more stable container deployments.