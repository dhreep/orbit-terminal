/**
 * Traffic Controller: Token-bucket rate limiter for Alpha Vantage.
 * Enforces 5 calls per minute with queuing for excess requests.
 */
export class TrafficController {
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;
  private tokens: number;
  private lastRefillTime: number;
  private readonly queue: Array<{
    resolve: (value: void) => void;
    reject: (reason: Error) => void;
  }>;
  private drainTimer: ReturnType<typeof setInterval> | null = null;

  constructor(maxCallsPerMinute = 5) {
    this.maxTokens = maxCallsPerMinute;
    this.refillIntervalMs = 60_000 / maxCallsPerMinute; // ms between each token
    this.tokens = maxCallsPerMinute;
    this.lastRefillTime = Date.now();
    this.queue = [];
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefillTime;
    const tokensToAdd = Math.floor(elapsed / this.refillIntervalMs);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefillTime = now;
    }
  }

  async acquire(): Promise<void> {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return;
    }

    // Queue and wait for a token
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.startDrainTimer();
    });
  }

  private startDrainTimer(): void {
    if (this.drainTimer) return;

    this.drainTimer = setInterval(() => {
      this.refillTokens();

      while (this.tokens > 0 && this.queue.length > 0) {
        this.tokens--;
        const next = this.queue.shift()!;
        next.resolve();
      }

      if (this.queue.length === 0) {
        clearInterval(this.drainTimer!);
        this.drainTimer = null;
      }
    }, this.refillIntervalMs);
  }

  getStatus(): { availableTokens: number; queueLength: number } {
    this.refillTokens();
    return {
      availableTokens: this.tokens,
      queueLength: this.queue.length,
    };
  }
}

// Singleton instance for Alpha Vantage
export const alphaVantageController = new TrafficController(5);
