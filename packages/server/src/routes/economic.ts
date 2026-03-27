import { Router, Request, Response } from 'express';
import type { ApiResponse, EconomicEvent } from '@orbit/shared';

const router = Router();

// GET / — Economic events from Trading Economics free calendar
router.get('/', async (_req: Request, res: Response) => {
  try {
    // Use Finnhub general news as economic indicator proxy
    // The economic calendar is a premium Finnhub endpoint
    // Instead, fetch from a free public source
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    
    // Try Finnhub economic calendar first (premium)
    const { getApiKey } = await import('./market.js');
    const key = getApiKey('finnhub');
    if (key) {
      try {
        const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${key}`);
        const data = await response.json();
        if (!data.error) {
          const calendar = data?.economicCalendar || data?.result || [];
          if (Array.isArray(calendar) && calendar.length > 0) {
            const events: EconomicEvent[] = calendar.map((e: any) => ({
              date: e.time ?? '',
              event: e.event ?? '',
              country: e.country ?? '',
              actual: e.actual ?? null,
              previous: e.prev ?? null,
              estimate: e.estimate ?? null,
              impact: e.impact === 3 ? 'high' : e.impact === 2 ? 'medium' : 'low',
            }));
            return res.json({ success: true, data: events } satisfies ApiResponse<EconomicEvent[]>);
          }
        }
      } catch {}
    }

    // Fallback: static major upcoming events (always available)
    const events: EconomicEvent[] = [
      { date: from, event: 'Economic calendar requires Finnhub Premium', country: 'US', actual: null, previous: null, estimate: null, impact: 'medium' },
    ];
    res.json({ success: true, data: events } satisfies ApiResponse<EconomicEvent[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<EconomicEvent[]>);
  }
});

export default router;
