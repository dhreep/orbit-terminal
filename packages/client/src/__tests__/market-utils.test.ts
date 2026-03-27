import { describe, it, expect, vi, afterEach } from 'vitest';
import { getNYSEStatus } from '../utils/market';

// March 2026 is EDT (UTC-4), DST starts March 8 2026
// 9:30 AM ET = 13:30 UTC, 4:00 PM ET = 20:00 UTC

describe('getNYSEStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns OPEN during market hours on a weekday', () => {
    vi.useFakeTimers();
    // Wednesday March 25 2026, 10:00 AM ET = 14:00 UTC
    vi.setSystemTime(new Date('2026-03-25T14:00:00Z'));
    const status = getNYSEStatus();
    expect(status.isOpen).toBe(true);
    expect(status.label).toBe('OPEN');
  });

  it('returns CLOSED before market opens on a weekday', () => {
    vi.useFakeTimers();
    // Wednesday 8:00 AM ET = 12:00 UTC
    vi.setSystemTime(new Date('2026-03-25T12:00:00Z'));
    expect(getNYSEStatus().isOpen).toBe(false);
    expect(getNYSEStatus().label).toBe('CLOSED');
  });

  it('returns CLOSED after market closes on a weekday', () => {
    vi.useFakeTimers();
    // Wednesday 5:00 PM ET = 21:00 UTC
    vi.setSystemTime(new Date('2026-03-25T21:00:00Z'));
    expect(getNYSEStatus().isOpen).toBe(false);
  });

  it('returns CLOSED on Saturday', () => {
    vi.useFakeTimers();
    // Saturday March 28 2026, 10:00 AM ET = 14:00 UTC
    vi.setSystemTime(new Date('2026-03-28T14:00:00Z'));
    expect(getNYSEStatus().isOpen).toBe(false);
    expect(getNYSEStatus().label).toBe('CLOSED');
  });

  it('returns CLOSED on Sunday', () => {
    vi.useFakeTimers();
    // Sunday March 29 2026
    vi.setSystemTime(new Date('2026-03-29T14:00:00Z'));
    expect(getNYSEStatus().isOpen).toBe(false);
  });

  it('returns OPEN at exactly 9:30 AM ET', () => {
    vi.useFakeTimers();
    // Wednesday 9:30 AM ET = 13:30 UTC
    vi.setSystemTime(new Date('2026-03-25T13:30:00Z'));
    expect(getNYSEStatus().isOpen).toBe(true);
  });

  it('returns CLOSED at exactly 4:00 PM ET', () => {
    vi.useFakeTimers();
    // Wednesday 4:00 PM ET = 20:00 UTC
    vi.setSystemTime(new Date('2026-03-25T20:00:00Z'));
    expect(getNYSEStatus().isOpen).toBe(false);
  });
});
