# 🎮 Cyber Arcade 3D — Championship Arena

An enterprise-grade, real-time board game arena engineered with **React**, **Vite**, **Pure Vanilla CSS**, and **PeerJS (WebRTC)** for zero-lag peer-to-peer multiplayer, smart heuristic AI, Elo rating systems, and responsive gameplay.

---

## 🌟 Featured Games

1. **Gomoku (15×15 Five in a Row)**:
   - Full tournament board with intersection snapping, coordinate markers (A-O, 1-15), and star points (*hoshi*).
   - Smart AI with 5-stone pattern evaluation.
   - Move number toggle overlay.

2. **Connect 4 (7×6 Four in a Row)**:
   - Gravity token-dropping physics with column hover slot indicators.
   - Smart AI with win detection, tactical blocking, and central column prioritization.

3. **Tic-Tac-Toe (3×3 Rapid Match)**:
   - Ultra-fast reflex matches with winning combo highlight lines.
   - Optimal minimax-inspired tactical robot.

---

## 🚀 Key Features

- **🌐 QR Code & Link P2P Multiplayer**: Instant zero-server WebRTC data channels via STUN servers. Share via QR code, link copy, or Web Share API.
- **🤖 Smart Local Robot (AI)**: Built-in heuristics for offline gameplay with 0ms network latency.
- **👥 2-Player Pass & Play**: Local same-device matches with turn tracking.
- **🛡️ Anti-Cheat & Security**:
  - WebRTC move-packet structural schema verification.
  - Rate limiting & flood protection.
  - Client-side move legitimacy validation against local board states.
  - Safe localStorage sandboxing with fallback hydration.
- **🏆 Competitive Elo & XP Progression**:
  - Match result dialog with Elo rating changes, XP gains, level-up bars, and rematch triggers.
  - Career stats modal with win/loss tracking, win rates, and streak counters.
- **🎨 Bespoke Enterprise UI**:
  - Slate Obsidian (`#0f172a`), Deep Oxford Navy (`#1e3a8a`), Crimson Coral (`#991b1b`), and Sand Maple (`#e4d5b7`).
  - 100% SVG Lucide icons with zero cheap emoji tropes.
  - Synchronous localStorage persistence across page reloads.
  - HTML5 History routing (`/?game=gomoku`, `/?game=connect4`, `/?game=tictactoe`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Vanilla CSS (Tailored Design System & Design Tokens)
- **Multiplayer**: PeerJS (WebRTC P2P Data Channels) & Google STUN Servers
- **Audio**: Web Audio API Procedural Synthesizer
- **Icons**: Lucide React
- **Confetti**: Canvas-Confetti

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm / yarn / pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Bharathr133/cyber-arcade-3d.git

# Navigate to project directory
cd cyber-arcade-3d

# Install dependencies
npm install

# Start development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
npm run build
npm run preview
```

---

## 👨‍💻 Developer

Developed by **[Bharath R](https://bharathr.vercel.app/)**  
Portfolio: [https://bharathr.vercel.app/](https://bharathr.vercel.app/)

---

## 📄 License

MIT License © 2026 Bharath R
