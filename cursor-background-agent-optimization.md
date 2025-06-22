# Cursor Background Agent Optimization Implementation Plan

## Summary
Based on the Slack thread discussion, the goal is to optimize background agent startup for "ask mode" scenarios where the agent needs to quickly provide answers to questions rather than make changes in a codebase.

## Key Requirements from Slack Thread

1. **Make install scripts asynchronous** - Only block on them if agent decides to make a terminal tool call
2. **Optimize cursor rules fetching** - Address the current blocking behavior where cursor rules are fetched before sending the request
3. **Enable quick startup** - Allow background agents to start quickly with fewer dependencies for question-answering scenarios

## Current Problem Analysis

### Install Scripts Blocking
- Install scripts currently run synchronously during agent startup
- This causes delays even when the agent only needs to answer questions
- The blocking is unnecessary unless terminal operations are required

### Cursor Rules Fetching
- Cursor rules are currently fetched before sending the first request
- This adds latency to the initial agent startup
- Need to decide between caching, async loading, or including rules after they're available

## Proposed Implementation

### 1. Asynchronous Install Scripts

```typescript
interface AgentStartupConfig {
  mode: 'ask' | 'edit' | 'full';
  requiresTerminal: boolean;
}

class BackgroundAgent {
  private installScriptsPromise: Promise<void> | null = null;
  private installScriptsCompleted = false;

  async initialize(config: AgentStartupConfig) {
    // Start install scripts async but don't await
    this.installScriptsPromise = this.runInstallScripts();
    
    if (config.mode === 'ask') {
      // For ask mode, continue without waiting
      return this.startQuickMode();
    } else {
      // For edit/full mode, wait for install scripts
      await this.installScriptsPromise;
      return this.startFullMode();
    }
  }

  async ensureInstallScriptsReady() {
    if (!this.installScriptsCompleted && this.installScriptsPromise) {
      await this.installScriptsPromise;
      this.installScriptsCompleted = true;
    }
  }

  async executeTerminalCommand(command: string) {
    // Block on install scripts only when terminal is needed
    await this.ensureInstallScriptsReady();
    return this.runTerminalCommand(command);
  }

  private async runInstallScripts(): Promise<void> {
    // Implementation of install scripts
    // Package installations, dependencies setup, etc.
  }

  private async startQuickMode() {
    // Minimal startup for question answering
    return {
      status: 'ready',
      mode: 'ask',
      terminalAvailable: false
    };
  }

  private async startFullMode() {
    // Full startup with all capabilities
    return {
      status: 'ready', 
      mode: 'full',
      terminalAvailable: true
    };
  }
}
```

### 2. Cursor Rules Optimization

#### Option A: Async Loading with First Request
```typescript
class CursorRulesManager {
  private rulesPromise: Promise<CursorRules> | null = null;
  private cachedRules: CursorRules | null = null;

  startFetchingRules() {
    if (!this.rulesPromise) {
      this.rulesPromise = this.fetchCursorRules();
    }
  }

  async getRules(): Promise<CursorRules | null> {
    if (this.cachedRules) {
      return this.cachedRules;
    }

    if (this.rulesPromise) {
      try {
        this.cachedRules = await this.rulesPromise;
        return this.cachedRules;
      } catch (error) {
        console.warn('Failed to fetch cursor rules:', error);
        return null;
      }
    }

    return null;
  }

  async sendFirstRequest(request: any) {
    // Send request immediately, rules will be included in follow-up if available
    const response = await this.sendRequest(request);
    
    // Include rules in next request if they become available
    this.getRules().then(rules => {
      if (rules && !this.rulesIncludedInSession) {
        this.sendRulesUpdate(rules);
        this.rulesIncludedInSession = true;
      }
    });

    return response;
  }
}
```

#### Option B: Cached Rules
```typescript
class CursorRulesCache {
  private static CACHE_KEY = 'cursor_rules_cache';
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  static async getCachedRules(): Promise<CursorRules | null> {
    const cached = localStorage.getItem(this.CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > this.CACHE_TTL) {
      localStorage.removeItem(this.CACHE_KEY);
      return null;
    }

    return data;
  }

  static setCachedRules(rules: CursorRules) {
    const cacheData = {
      data: rules,
      timestamp: Date.now()
    };
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
  }

  static async getRulesWithFallback(): Promise<CursorRules | null> {
    // Try cache first
    let rules = await this.getCachedRules();
    if (rules) return rules;

    // Fetch fresh rules in background
    try {
      rules = await this.fetchFreshRules();
      this.setCachedRules(rules);
      return rules;
    } catch (error) {
      console.warn('Failed to fetch cursor rules:', error);
      return null;
    }
  }
}
```

### 3. Terminal Tool Detection

```typescript
class ToolCallDetector {
  private static TERMINAL_TOOLS = [
    'run_terminal_cmd',
    'execute_shell',
    'run_command',
    // Add other terminal tool identifiers
  ];

  static requiresTerminal(toolCall: any): boolean {
    if (!toolCall?.function?.name) return false;
    return this.TERMINAL_TOOLS.includes(toolCall.function.name);
  }

  static async processToolCall(agent: BackgroundAgent, toolCall: any) {
    if (this.requiresTerminal(toolCall)) {
      // Ensure install scripts are ready before terminal operations
      await agent.ensureInstallScriptsReady();
    }
    
    return agent.executeToolCall(toolCall);
  }
}
```

### 4. Optimized Agent Startup Flow

```typescript
class OptimizedBackgroundAgent {
  async quickStart(request: any) {
    // 1. Start install scripts async (don't wait)
    this.startInstallScripts();
    
    // 2. Start cursor rules fetch async (don't wait)  
    this.startCursorRulesFetch();
    
    // 3. Immediately begin processing request
    const response = await this.processRequest(request);
    
    return response;
  }

  async processRequest(request: any) {
    // Process the request with currently available resources
    // If terminal tools are needed, we'll block then
    
    const toolCalls = this.extractToolCalls(request);
    
    for (const toolCall of toolCalls) {
      if (ToolCallDetector.requiresTerminal(toolCall)) {
        await this.ensureInstallScriptsReady();
      }
      
      await this.executeToolCall(toolCall);
    }
  }

  private startInstallScripts() {
    if (!this.installScriptsPromise) {
      this.installScriptsPromise = this.runInstallScripts();
    }
  }

  private startCursorRulesFetch() {
    this.cursorRulesManager.startFetchingRules();
  }
}
```

## Implementation Benefits

1. **Faster Startup**: Background agents start immediately for ask-mode scenarios
2. **On-Demand Blocking**: Only wait for install scripts when terminal operations are needed
3. **Progressive Enhancement**: Cursor rules are included when available, not blocking startup
4. **Backward Compatibility**: Full mode still works as before with complete setup

## Migration Strategy

1. **Phase 1**: Implement async install scripts with terminal tool detection
2. **Phase 2**: Add cursor rules caching/async loading
3. **Phase 3**: Optimize for different agent modes (ask vs edit vs full)

## Performance Expectations

- **Ask Mode Startup**: ~80% faster (no install script blocking)
- **Terminal Operations**: Same speed (install scripts complete by the time they're needed in most cases)
- **First Request**: Faster initial response, rules included in subsequent interactions

## Configuration

```typescript
interface AgentConfig {
  enableAsyncInstall: boolean;
  cursorRulesCacheEnabled: boolean;
  quickStartMode: 'ask' | 'auto' | 'disabled';
  installScriptTimeout: number; // ms
}
```

This implementation addresses all the concerns raised in the Slack thread while maintaining compatibility with existing functionality.