# GitHub Token Refresh Investigation & Recommendations

## Current Situation

Based on the Slack thread analysis, the team is experiencing API call spikes every hour on the dot from `githubAccessService`, specifically related to GitHub token refresh for background agents.

### Key Findings from Slack Thread:
- **Issue**: API calls spike every hour exactly at the same time across all pods
- **Root Cause**: GitHub token refresh happens every 50 minutes on all running pods simultaneously
- **Chart Data**: Shows clear hourly spikes in `getInstallationForRepo`, `connectGithubCallback`, and `verifyGithubRepoAccess` operations
- **Impact**: All pods refresh tokens simultaneously, likely due to starting intervals at the same time during deployment rollouts

## Problem Analysis

The synchronized token refresh occurs because:
1. All pods start their refresh intervals at the same time (during deployment)
2. GitHub tokens are refreshed every 50 minutes across all instances
3. No jitter or staggering mechanism exists to distribute the load

## Codebase Mismatch

**Important**: The current workspace contains the `pnpm/action-setup` GitHub Action codebase, which is not where the background agent token refresh logic would be located. The actual implementation needs to be found in the main application codebase that contains:
- Background agent/composer logic
- GitHub token refresh mechanisms
- `githubAccessService` implementation

## Recommended Implementation Strategy

### 1. Add Jitter to Token Refresh Timing

```typescript
// Example implementation approach
class GitHubTokenRefreshManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private readonly baseRefreshInterval = 50 * 60 * 1000; // 50 minutes in ms
  
  startTokenRefresh() {
    // Add jitter: random delay of 0-10 minutes
    const jitterMs = Math.random() * 10 * 60 * 1000;
    const refreshIntervalMs = this.baseRefreshInterval + jitterMs;
    
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    // Set initial timeout with jitter
    setTimeout(() => {
      this.refreshToken();
      // Set regular interval after first refresh
      this.refreshInterval = setInterval(() => {
        this.refreshToken();
      }, this.baseRefreshInterval);
    }, jitterMs);
  }
  
  private async refreshToken() {
    // Existing token refresh logic
  }
}
```

### 2. Persist Last Refresh Time

```typescript
// Save lastRefresh timestamp to avoid resetting intervals on restart
interface TokenRefreshState {
  lastRefresh: number;
  nextRefresh: number;
}

class GitHubTokenRefreshManager {
  async initializeFromPersistedState() {
    const state = await this.loadRefreshState();
    if (state) {
      const now = Date.now();
      const timeUntilNextRefresh = Math.max(0, state.nextRefresh - now);
      
      // Schedule next refresh based on persisted state
      setTimeout(() => {
        this.refreshToken();
        this.startRegularInterval();
      }, timeUntilNextRefresh);
    } else {
      // First run - add jitter
      this.startTokenRefresh();
    }
  }
}
```

### 3. Stagger Refresh Across Pod Lifecycle

```typescript
// Alternative: Stagger based on pod startup time or unique identifier
class GitHubTokenRefreshManager {
  constructor(private podId: string) {}
  
  startTokenRefresh() {
    // Use pod ID to create consistent but distributed delays
    const podHash = this.hashString(this.podId);
    const jitterMs = (podHash % (10 * 60 * 1000)); // 0-10 minutes based on pod ID
    
    setTimeout(() => {
      this.refreshToken();
      this.startRegularInterval();
    }, jitterMs);
  }
  
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}
```

## Implementation Steps

1. **Locate the correct codebase** containing background agent logic
2. **Find the GitHub token refresh implementation** (likely in a service class)
3. **Implement jitter mechanism** to distribute refresh times
4. **Add persistence** to maintain refresh schedule across restarts
5. **Test with deployment rollouts** to ensure staggering works
6. **Monitor API call patterns** to verify the fix

## Monitoring & Validation

After implementation:
- Monitor the `githubAccessService` API call patterns
- Verify that spikes are distributed across the hour instead of synchronized
- Check that token refresh continues to work reliably with jitter
- Ensure no authentication failures during the transition period

## Next Steps

1. **Identify the correct repository/codebase** containing the background agent logic
2. **Search for existing GitHub token refresh code** (likely containing "token", "refresh", "github", "50", "minute" keywords)
3. **Implement the jitter solution** using one of the approaches above
4. **Test in a staging environment** before production deployment