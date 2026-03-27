# 🤖 AI Agent Transparency

This document describes how AI coding agents were used to build Orbit Terminal.

---

## Overview

Orbit Terminal was built collaboratively between a human developer and AI coding agents via **Kiro CLI** (Amazon's AI-assisted development tool). The human directed all architecture decisions, feature selection, API provider choices, and design aesthetic. The agents executed implementation, wrote tests, performed audits, and authored documentation.

The entire project — from initial scaffold to 24 features, 69 tests, and a unified design system — was built in a **single Kiro CLI session** using parallel subagent execution.

---

## Agent Roles

Kiro CLI delegates work to specialized subagents, each with a focused responsibility:

| Agent | Role | What It Did |
|-------|------|-------------|
| **explorer** | Codebase analysis | Mapped existing code structure, identified patterns, cataloged dependencies |
| **librarian** | Research | Evaluated libraries (shadcn/ui, cmdk, trading-signals), looked up API docs for providers |
| **oracle** | Architecture | Advised on monorepo structure, data flow patterns, security model design |
| **momus** | Critical audit | Performed security/performance/accessibility audit — found **22 issues** |
| **reviewer** | Code review | Post-implementation review of each phase for correctness and consistency |
| **general** | Backend dev | Built Express routes, middleware, SQLite schema, rate limiting, auth |
| **frontend-specialist** | Frontend dev | Built React components, integrated shadcn/ui, implemented design system |
| **document-writer** | Documentation | Wrote README.md, this file, inline code comments |
| **planner** | Task planning | Broke features into phases, created work breakdown for parallel execution |
| **metis** | Request analysis | Analyzed incoming requests to determine optimal agent routing |

---

## Build Timeline

Everything below happened in a single continuous session.

### Phase 0 — Exploration
- Mapped the existing codebase (vault, charts, fundamentals)
- Identified the tech stack, file structure, and extension points
- Cataloged what existed vs. what needed to be built

### Security Audit
- **momus** agent performed a full audit of the codebase
- **22 issues** identified and fixed:
  - Missing auth middleware on routes
  - SQL injection vectors in query construction
  - Input validation gaps (ticker symbols, numeric params)
  - Rate limiting added (token-bucket for Alpha Vantage)
  - Brute-force protection on vault unlock
  - Missing error handling in async routes
  - XSS prevention in user-supplied content

### Unit Tests
- **69 tests** added using Vitest
- Coverage across both client and server packages
- Vault crypto, route handlers, rate limiting, utilities, component rendering

### Phase 1 — Navigation & Watchlist
- Command palette (`cmdk`) with ticker search
- Keyboard shortcuts (⌘K, ⌘W, ⌘A, ⌘I, ⌘Z, ⌘1-4)
- Watchlist panel with live prices and sparklines

### Phase 2 — Indicators & Alerts
- Technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands
- Price alerts with SQLite persistence
- News feed with Finnhub/Alpha Vantage fallback

### Phase 3 — Portfolio & Journal
- Portfolio tracker with live P&L and weighted avg cost
- Earnings calendar with timing badges
- Trade journal with open/closed tracking and auto P&L

### Phase 4 — Data Explorer
- Crypto tab (CoinGecko)
- Forex tab (Frankfurter)
- Insider trading tab (Finnhub)
- Economic calendar tab (Finnhub)
- Social sentiment tab (ApeWisdom)

### Phase 5 — AI & Analysis
- BYOK AI chat supporting Groq and Ollama
- Stock screener with dynamic filter builder
- Correlation matrix with color-coded output

### Phase 6 — Polish & Demo
- CSV/PDF export (jsPDF)
- Zen mode (full-screen chart)
- Demo mode with pre-populated realistic data
- Dark/light theme toggle

### Design System Overhaul
- Integrated shadcn/ui across all components (17 primitives)
- Unified dark terminal aesthetic
- Consistent spacing, typography, and color tokens

### Iterative Bug-Fixing Phase

After the initial build, the user tested the running application in real time and reported issues. All of the following were diagnosed and fixed in the same continuous session, with the user providing immediate feedback after each fix:

**Data provider fixes:**
- Fixed Yahoo Finance crumb authentication for fundamentals (crumb/cookie flow wasn't working)
- Fixed crypto explorer crash (wrong CoinGecko API path)
- Fixed forex (Frankfurter URL `.dev` → `.app`)
- Fixed sentiment and economic API path mismatches on the server

**Chart & rendering fixes:**
- Fixed duplicate timestamp crash in candlestick charts
- Fixed grid layouts (resizable 2×2 dividers, spotlight sizing)
- Fixed markdown formatting (Tailwind base layer reset was overriding prose styles)

**UX fixes & additions:**
- Fixed theme toggle (light/dark class management on `<html>`)
- Fixed international stock support (ticker symbol length limit was too short for suffixed symbols like `RELIANCE.NS`)
- Added drag-and-drop reordering for watchlist items
- Added drag-and-drop slot rearrangement in the workspace grid
- Added ticker autocomplete across all input fields (watchlist, alerts, portfolio, journal, screener, correlation)
- Added demo mode with server-side data seeding (portfolio, trades, alerts, watchlist, notes)
- Added bookmark button in slots to quickly add ticker to watchlist
- Added clear all button for watchlist
- Added search bar callout in nav for ⌘K
- Added keyboard shortcuts dialog accessible via command palette
- Added markdown help link in trade thesis editor

This phase involved multiple rounds of user-directed refinements — a tight feedback loop where the user would test, report, and the agent would fix, often within minutes per cycle.

---

## Parallel Execution

A key advantage of the Kiro CLI agent system is **parallel subagent execution**. Multiple agents worked simultaneously on independent tasks:

- **Server routes** and **client components** for the same feature were built in parallel by different agents, then integrated
- **Security fixes** were applied to existing code while **new features** were being built
- **Tests** were written concurrently with implementation

This parallelism is what made it possible to ship 24 features in a single session.

---

## Human Decisions

The human developer made all high-level decisions:

- **Architecture**: Monorepo with npm workspaces, client/server/shared split
- **Feature set**: Which 24 features to build and in what order
- **API providers**: Selected all 9 providers, chose free-tier-only constraint
- **Security model**: Zero-knowledge vault, PBKDF2 iterations, bearer auth
- **Design**: Dark terminal aesthetic, shadcn/ui component library
- **UX**: Keyboard-first navigation, 4-slot workspace concept, demo mode
- **Quality bar**: TypeScript strict mode, 69 tests, security audit before features

Agents did not autonomously decide what to build. Every feature was explicitly requested and reviewed.

---

## Verification

Every phase was verified before moving to the next:

1. **TypeScript compilation** — zero errors across all three packages
2. **Test suite** — 69/69 passing after each phase
3. **Manual review** — human reviewed agent output for correctness
4. **Security audit** — dedicated audit phase before feature work began

---

## Tools & Environment

- **Kiro CLI** — AI-assisted development tool with subagent orchestration
- **Node.js 20** — runtime (pinned via mise)
- **Vitest** — test runner
- **TypeScript 5** — type checking
- **Vite** — dev server and build tool
