# 🏏 Cricket Auction Arena — Frontend Client

A production-grade, real-time broadcast web application for professional cricket player auctions. Built with React 18, TypeScript, Tailwind CSS, Socket.IO, and Web Audio synthesis.

🌐 **Live Application**: [https://javid8048.github.io/cricketAuction/](https://javid8048.github.io/cricketAuction/)  
⚡ **Live Backend API**: `https://cricketauctionbackend-1.onrender.com`

---

## 🛠️ Technology Stack

| Category | Technology | Purpose |
| :--- | :--- | :--- |
| **Core Framework** | [React 18](https://react.dev/) | Component architecture, concurrent rendering, and reactive UI |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) | End-to-end type safety across auction states, bids, and models |
| **Build Tooling** | [Vite 5](https://vitejs.dev/) | Lightning-fast HMR, optimized tree-shaking, and production bundling |
| **Styling & Design** | [Tailwind CSS 3](https://tailwindcss.com/) | Broadcast dark-theme UI, responsive layouts, glowing badges |
| **Icons** | [Lucide React](https://lucide.dev/) | Vector iconography for navigation, stats, and franchise badges |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Ultra-lightweight reactive stores for live auction and authentication |
| **Real-Time Client** | [Socket.IO Client 4](https://socket.io/) | Full-duplex WebSocket connection for bids, clock ticker, and notifications |
| **Procedural Audio** | [HTML5 Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) | Zero-latency synthetic sound effects (gavel strike, timer ticks, fanfares) |
| **Data Visualization** | [Recharts 2](https://recharts.org/) | Interactive franchise purse analytics, squad distributions, and charts |
| **Visual Effects** | [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti) | Celebratory particle physics explosion upon winning player bids |
| **Hosting & CI/CD** | [GitHub Pages](https://pages.github.com/) + [GitHub Actions](https://github.com/features/actions) | Continuous deployment pipeline on push to `main` branch |

---

## ✨ Key Capabilities

- **Broadcast Stage UI**: Dark television-style broadcast view, live player spotlight, current bid display, and active countdown timer.
- **Dynamic Team Count**: Real-time reactive franchise count indicators on topbar and drawer sidebar navigation.
- **Franchise Emblems & Custom Badges**: Upload team logos, camera capture, or auto-generate color-themed monogram badges.
- **Role-Based Workspaces**:
  - **Auctioneer / Admin Desk**: Lot advancement, manual sells/unsolds, custom increment overrides, timer toggle.
  - **Franchise Owner Dashboard**: Squad roster management, purse tracker, and quick bidding controls.
  - **Spectator / Fan Mode**: Live feed viewing, bid audit history, and real-time audio commentary cues.
- **Synthesized Web Audio**: Procedurally generated gavel strikes, warning ticks, and victory fanfares without external audio file loading.
- **CSV Squad Export**: Export team rosters and financial audit reports in one click.

---

## 🏁 Quickstart & Local Development

```bash
# 1. Clone the frontend repository
git clone https://github.com/Javid8048/cricketAuction.git
cd cricketAuction

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📦 Building for Production

```bash
# Run TypeScript validation and Vite build
npm run build

# Preview production build locally
npm run preview
```
Output assets are compiled into the `dist/` directory and deployed automatically to GitHub Pages.
