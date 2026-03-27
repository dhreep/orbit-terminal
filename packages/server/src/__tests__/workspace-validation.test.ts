import { describe, it, expect } from 'vitest';

/**
 * Tests the workspace import validation logic as implemented in
 * the POST /import route handler in workspace.ts.
 * Extracted as pure functions to avoid needing DB or HTTP mocks.
 */
function validateImport(body: unknown): string | null {
  const data = body as Record<string, unknown> | null;
  if (!data || data.version !== 1 || !data.workspace || !Array.isArray(data.notes)) {
    return 'Invalid import format';
  }
  const ws = data.workspace as Record<string, unknown>;
  if (!Array.isArray(ws.slots) || !ws.layout) {
    return 'Invalid workspace data';
  }
  return null;
}

describe('workspace import validation', () => {
  const validPayload = {
    version: 1,
    workspace: {
      layout: 'grid',
      slots: [{ id: 0, ticker: null, chartMode: 'candle', thesis: '' }],
    },
    notes: [],
  };

  it('accepts a valid import payload', () => {
    expect(validateImport(validPayload)).toBeNull();
  });

  it('rejects null body', () => {
    expect(validateImport(null)).toBe('Invalid import format');
  });

  it('rejects undefined body', () => {
    expect(validateImport(undefined)).toBe('Invalid import format');
  });

  it('rejects wrong version', () => {
    expect(validateImport({ ...validPayload, version: 2 })).toBe('Invalid import format');
  });

  it('rejects missing version', () => {
    const { version, ...rest } = validPayload;
    expect(validateImport(rest)).toBe('Invalid import format');
  });

  it('rejects missing workspace', () => {
    const { workspace, ...rest } = validPayload;
    expect(validateImport(rest)).toBe('Invalid import format');
  });

  it('rejects non-array notes', () => {
    expect(validateImport({ ...validPayload, notes: 'bad' })).toBe('Invalid import format');
  });

  it('rejects missing notes', () => {
    const { notes, ...rest } = validPayload;
    expect(validateImport(rest)).toBe('Invalid import format');
  });

  it('rejects missing slots array', () => {
    expect(
      validateImport({
        ...validPayload,
        workspace: { layout: 'grid' },
      })
    ).toBe('Invalid workspace data');
  });

  it('rejects non-array slots', () => {
    expect(
      validateImport({
        ...validPayload,
        workspace: { layout: 'grid', slots: 'bad' },
      })
    ).toBe('Invalid workspace data');
  });

  it('rejects missing layout', () => {
    expect(
      validateImport({
        ...validPayload,
        workspace: { slots: [] },
      })
    ).toBe('Invalid workspace data');
  });

  it('rejects empty string layout', () => {
    expect(
      validateImport({
        ...validPayload,
        workspace: { slots: [], layout: '' },
      })
    ).toBe('Invalid workspace data');
  });

  it('accepts payload with settings', () => {
    expect(
      validateImport({ ...validPayload, settings: { theme: 'dark' } })
    ).toBeNull();
  });
});
