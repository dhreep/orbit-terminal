import { Router, Request, Response } from 'express';
import { getApiKey } from './market.js';
import type { ApiResponse, EconomicEvent } from '@orbit/shared';

const router = Router();

// GET / — Economic events for next 7 days
router.get('/', async (_req: Request, res: Response) => {
  const key = getApiKey('finnhub');
  if (!key) {
    return res.json({ success: true, data: [] } satisfies ApiResponse<EconomicEvent[]>);
  }
  try {
    const from = new Date().toISOString().split('T')[0];
    const to = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const response = await fetch(`https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${key}`);
    const data = await response.json();
    const events: EconomicEvent[] = (data?.economicCalendar ?? []).map((e: any) => ({
      date: e.time ?? '',
      event: e.event ?? '',
      country: e.country ?? '',
      actual: e.actual ?? null,
      previous: e.prev ?? null,
      estimate: e.estimate ?? null,
      impact: e.impact === 3 ? 'high' : e.impact === 2 ? 'medium' : 'low',
    }));
    res.json({ success: true, data: events } satisfies ApiResponse<EconomicEvent[]>);
  } catch {
    res.json({ success: true, data: [] } satisfies ApiResponse<EconomicEvent[]>);
  }
});

export default router;
