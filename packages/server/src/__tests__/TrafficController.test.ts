import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TrafficController } from '../services/TrafficController.js';

describe('TrafficController', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes tokens to maxCallsPerMinute', () => {
    const tc = new TrafficController(3);
    expect(tc.getStatus().availableTokens).toBe(3);
  });

  it('acquire() succeeds immediately when tokens available', async () => {
    const tc = new TrafficController(2);
    await tc.acquire();
    expect(tc.getStatus().availableTokens).toBe(1);
  });

  it('acquire() decrements available tokens', async () => {
    const tc = new TrafficController(3);
    await tc.acquire();
    await tc.acquire();
    expect(tc.getStatus().availableTokens).toBe(1);
  });

  it('acquire() queues when no tokens available', async () => {
    const tc = new TrafficController(1);
    await tc.acquire(); // consumes the 1 token
    tc.acquire(); // queued, don't await
    expect(tc.getStatus().queueLength).toBe(1);
  });

  it('queued request resolves after refill interval', async () => {
    const tc = new TrafficController(1); // 1 token, refill every 60s
    await tc.acquire();
    const promise = tc.acquire(); // queued
    expect(tc.getStatus().queueLength).toBe(1);

    vi.advanceTimersByTime(60_000);
    await promise;

    expect(tc.getStatus().queueLength).toBe(0);
  });

  it('getStatus() returns correct availableTokens and queueLength', async () => {
    const tc = new TrafficController(2);
    expect(tc.getStatus()).toEqual({ availableTokens: 2, queueLength: 0 });

    await tc.acquire();
    expect(tc.getStatus()).toEqual({ availableTokens: 1, queueLength: 0 });

    await tc.acquire();
    tc.acquire(); // queued
    expect(tc.getStatus()).toEqual({ availableTokens: 0, queueLength: 1 });
  });

  it('tokens do not exceed maxTokens after long time', async () => {
    const tc = new TrafficController(3);
    await tc.acquire(); // 2 left
    vi.advanceTimersByTime(600_000); // 10 minutes
    expect(tc.getStatus().availableTokens).toBe(3);
  });

  it('multiple queued requests resolve in FIFO order', async () => {
    const tc = new TrafficController(1);
    await tc.acquire();

    const order: number[] = [];
    const p1 = tc.acquire().then(() => order.push(1));
    const p2 = tc.acquire().then(() => order.push(2));
    const p3 = tc.acquire().then(() => order.push(3));

    expect(tc.getStatus().queueLength).toBe(3);

    // Advance enough time for all 3 to drain (refill interval = 60s each)
    vi.advanceTimersByTime(60_000);
    await Promise.resolve(); // flush microtasks
    vi.advanceTimersByTime(60_000);
    await Promise.resolve();
    vi.advanceTimersByTime(60_000);
    await Promise.resolve();

    await Promise.all([p1, p2, p3]);
    expect(order).toEqual([1, 2, 3]);
  });
});
