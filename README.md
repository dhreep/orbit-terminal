# 🌐 Orbit Terminal

**Orbit Terminal** is a high-performance, secure financial dashboard designed for real-time market analysis and workspace management. Built with a modern tech stack and a focus on security, it provides a premium, "terminal-style" experience for traders and analysts.

---

## ✨ Key Features

- **🔐 Secure Vault**: AES-encrypted local storage for your API keys (Alpha Vantage, Financial Modeling Prep, etc.). Keys are only decrypted in-memory during active sessions.
- **📊 Real-time Market Data**: Interactive candlestick and line charts powered by `lightweight-charts`. 
- **⚖️ Fundamental Analysis**: Access key financial ratios (P/E, PEG, Debt/Equity, etc.) with multi-provider fallbacks (FMP → Alpha Vantage → Yahoo Finance).
- **🖥️ Dynamic Workspaces**: 
  - Customizable layouts (Grid 2x2 or Spotlight mode).
  - Persistent state saved to a local SQLite database.
  - Export and Import entire workspaces as JSON.
- **🔍 Intelligent Search**: Global ticker search across multiple exchanges and asset types.
- **🕒 Real-time Status**: Live UTC clock and market session indicators (NYSE Open/Closed).

---

## 🏗️ Architecture

Orbit Terminal is architected as a **monorepo** using npm workspaces for a clean separation of concerns:

- **`packages/client`**: A high-performance React SPA built with Vite and Tailwind CSS v4.
- **`packages/server`**: A lightweight Node.js/Express API utilizing `better-sqlite3` for local persistence.
- **`packages/shared`**: Common TypeScript types, interfaces, and business logic used by both the client and server.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query (React Query)
- **Charts**: Lightweight Charts (TradingView)
- **Icons**: Material Symbols

### Backend
- **Runtime**: Node.js (ESM)
- **Framework**: Express
- **Database**: Better-SQLite3
- **Rate Limiting**: Custom token-bucket controller for Alpha Vantage.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [npm](https://www.npmjs.com/)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dhreep/orbit-terminal.git
   cd orbit-terminal
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize the database**:
   The server will automatically create `orbit.db` on its first run.

### Running in Development

Start both the client and server concurrently:
```bash
npm run dev
```
- **Client**: `http://localhost:5173`
- **Server**: `http://localhost:3001`

---

## 📁 Project Structure

```text
orbit-terminal/
├── packages/
│   ├── client/       # React frontend
│   │   ├── src/
│   │   │   ├── components/  # Vault, SecuritySlots, etc.
│   │   │   └── services/    # API integration
│   ├── server/       # Express backend
│   │   ├── src/
│   │   │   ├── db/          # SQLite schema & helpers
│   │   │   └── routes/      # Market, Vault, Workspace API
│   └── shared/       # Common TS types
├── .gitignore        # Optimized for Node/TS/Vite
├── package.json      # Workspace root
└── tsconfig.base.json
```

---

## 📄 License
This project is for educational/personal use. Please ensure you comply with the terms of service of the data providers (Alpha Vantage, FMP, Yahoo Finance) when using their APIs.
