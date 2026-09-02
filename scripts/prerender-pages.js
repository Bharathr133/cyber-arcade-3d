import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEO_CONFIG } from '../src/utils/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');

if (!fs.existsSync(distDir)) {
  console.error('[SEO Prerender Error]: dist directory does not exist. Run "vite build" first.');
  process.exit(1);
}

const baseIndexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');

const ROUTE_CONTENT = {
  connect4: {
    h1: 'Play Connect 4 Online Free — 2-Player Strategy Board Game',
    tagline: 'Instant 7×6 gravity grid multiplayer in your browser. Play against friends with 6-letter private room codes or challenge smart AI computer bots.',
    bullets: [
      '7×6 Vertical Gravity Grid with real-time drop animations',
      'Instant 2-player matchmaking or private 6-letter room codes with QR invite',
      'Smart AI Bots: Practice solo across Easy, Medium, and Grandmaster difficulties',
      'Server-authoritative move validation with live ELO rating calculations',
      'Interactive emoji reactions & live turn timers',
      'Zero app downloads required — 100% free in all mobile and desktop web browsers'
    ]
  },
  tictactoe: {
    h1: 'Play Tic-Tac-Toe Online Free — 2-Player XO Board Game',
    tagline: 'Fast 3×3 classic arena battle. Test corner fork strategies, play against unbeatable AI bots, or invite friends to live online duels.',
    bullets: [
      'Fast-paced 3×3 XO blitz matches (1–2 min average match duration)',
      'Cross-platform 2-player online matchmaking with sub-50ms WebSocket sync',
      'Smart heuristic AI bot engine with minimax difficulty tiers',
      'Private 6-letter room codes & direct invite links for WhatsApp and Discord',
      'Global ELO rating progression and Top 50 leaderboard standings',
      '100% free browser gameplay with zero ads or app installs'
    ]
  },
  gomoku: {
    h1: 'Play Gomoku Online Free — 15×15 Five in a Row Tournament Grid',
    tagline: 'Master open-four chain combinations on the official 15×15 tournament grid. Play online vs friends or battle Master AI bots.',
    bullets: [
      'Official 15×15 tournament Gomoku grid with stone placement zoom',
      'Continuous chain detection & double-three defensive alerts',
      'Real-time online multiplayer with private room creation and QR pairing',
      'Tactical AI bot opponents with multi-step foresight evaluation',
      'Server-authoritative win verification & certified ELO ratings',
      'No download or login required — instant play in your web browser'
    ]
  },
  memory: {
    h1: 'Play Memory Match Online Free — 5-Level Visual Recall Brain Campaign',
    tagline: 'Stimulate active working memory and pattern recall through progressive difficulty tiers, solo campaigns, and 2-player battles.',
    bullets: [
      '5 Progressive Campaign Levels: from 2×3 to 6×6 complex visual card grids',
      'Solo campaign scoring with streak multipliers and time trial bonuses',
      'Versus AI Bot mode with progressive recall accuracy simulation',
      '2-Player local Pass & Play on the same tablet or computer screen',
      'Cognitive visual recall exercise designed for all ages',
      'Instant browser execution with zero app store downloads'
    ]
  },
  ludo: {
    h1: 'Play Ludo Online Free — 2 to 4 Player Championship Board Game',
    tagline: 'Classic 4-color cross-and-circle strategy board game. Roll the dice, station tokens in safe star zones, and race home with friends or AI bots.',
    bullets: [
      '2, 3, and 4 Player Battle Arena supporting online and local pass & play',
      'Private 6-letter room lobby with instant multi-friend invitations',
      'Play solo vs 1, 2, or 3 smart AI bot players simultaneously',
      'Safe zone star checkpoints and strategic capture mechanics',
      'Smooth dice rolling animations and interactive board sound synthesis',
      'Completely free in your browser with zero paywalls or app installs'
    ]
  },
  rules: {
    h1: 'How to Play & Game Rules — games4u Strategy Arena Guide',
    tagline: 'Comprehensive guide, official rules, and master-level winning tactics for Connect 4, Tic-Tac-Toe, Gomoku 15×15, Memory Match, and Ludo Championship.',
    bullets: [
      'Connect 4 Guide: Center column dominance, odd-even parity, and vertical trap setups',
      'Tic-Tac-Toe Guide: Corner openings, edge traps, and fork defense formulas',
      'Gomoku 15×15 Guide: Open-three creation, continuous four attacks, and branching forks',
      'Memory Match Guide: Quadrant recall techniques and streak multiplier tactics',
      'Ludo Guide: Token pacing, star safe zone positioning, and risk calculation'
    ]
  },
  leaderboard: {
    h1: 'Global Grandmaster Leaderboard & Top 50 Rankings — games4u',
    tagline: 'Official competitive rankings, ELO leaderboards, and Grandmaster standings for certified strategy board game players.',
    bullets: [
      'Live Top 50 Grandmaster player rankings updated in real time',
      'Competitive ELO tier progression: Bronze (1200) to Grandmaster (2000+)',
      'Server-authoritative match verification and anti-cheat win logging',
      'Detailed match stats: Win rates, winning streaks, and total discipline points',
      'Free open registration to claim your unique verified GamerTag'
    ]
  },
  about: {
    h1: 'About games4u — Free Multiplayer Strategy Board Games Platform',
    tagline: 'Our mission: bringing back the timeless joy of classic multiplayer board games with instant browser access, zero app downloads, and zero paywalls.',
    bullets: [
      'Zero App Downloads: Runs instantly in under 1 second on mobile and desktop',
      'Sub-50ms Real-Time WebSocket state synchronization powered by Supabase',
      'Modern, distraction-free board interfaces with luxury typography and audio synthesis',
      'Universal Accessibility: Play effortlessly with friends across town or overseas'
    ]
  },
  contact: {
    h1: 'Contact & Player Feedback — games4u Support',
    tagline: 'Have a feature request, game recommendation, or bug report? Reach out directly to the games4u development team.',
    bullets: [
      'Feature requests for new classic board game additions',
      'Tournament organizer inquiries and private room integrations',
      'Real-time matchmaking bug reports and client optimization feedback'
    ]
  },
  fairplay: {
    h1: 'Fair Play & Anti-Cheat Policy — games4u Competitive Arena',
    tagline: 'Learn how games4u enforces strict server-authoritative move validation and tamper-proof ELO rating calculations.',
    bullets: [
      'Server-authoritative game state validation preventing client-side move injection',
      'Dynamic ELO calculation formula protecting against rating manipulation',
      'Session token encryption and rate-limited WebSocket event broadcasting',
      'Clean, fair, competitive strategy environment for all players'
    ]
  },
  privacy: {
    h1: 'Privacy Policy & Terms of Service — games4u',
    tagline: 'Transparent data privacy standards, cookie policies, and terms of service for games4u free online multiplayer strategy platform.',
    bullets: [
      'Zero intrusive tracking or invasive data collection',
      'Anonymous guest profile support without mandatory email registration',
      'Encrypted profile credentials and PIN protection',
      'Full compliance with modern web data protection standards'
    ]
  }
};

const ROUTES = [
  { slug: 'connect4', key: 'connect4' },
  { slug: 'tictactoe', key: 'tictactoe' },
  { slug: 'gomoku', key: 'gomoku' },
  { slug: 'memory', key: 'memory' },
  { slug: 'ludo', key: 'ludo' },
  { slug: 'rules', key: 'rules' },
  { slug: 'leaderboard', key: 'leaderboard' },
  { slug: 'about', key: 'about' },
  { slug: 'contact', key: 'contact' },
  { slug: 'fair-play', key: 'fairplay' },
  { slug: 'privacy', key: 'privacy' }
];

console.log('⚡ Starting static SEO prerendering for all 11 routes...');

ROUTES.forEach(({ slug, key }) => {
  const seo = SEO_CONFIG[key] || SEO_CONFIG.home;
  const content = ROUTE_CONTENT[key] || {
    h1: seo.title,
    tagline: seo.description,
    bullets: []
  };

  let html = baseIndexHtml;

  // 1. Replace Title Tag
  html = html.replace(/<title>.*?<\/title>/i, `<title>${seo.title}</title>`);
  html = html.replace(/<meta name="title" content=".*?" \/>/i, `<meta name="title" content="${seo.title}" />`);

  // 2. Replace Description Tag
  html = html.replace(/<meta name="description" content=".*?" \/>/i, `<meta name="description" content="${seo.description}" />`);

  // 3. Replace Canonical Link (CRITICAL: self-referencing canonical for Googlebot)
  html = html.replace(/<link rel="canonical" href=".*?" \/>/i, `<link rel="canonical" href="${seo.canonical}" />`);
  html = html.replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/i, `<link rel="alternate" hreflang="x-default" href="${seo.canonical}" />`);
  html = html.replace(/<link rel="alternate" hreflang="en" href=".*?" \/>/i, `<link rel="alternate" hreflang="en" href="${seo.canonical}" />`);

  // 4. Replace OpenGraph & Twitter Meta Tags
  html = html.replace(/<meta property="og:url" content=".*?" \/>/i, `<meta property="og:url" content="${seo.canonical}" />`);
  html = html.replace(/<meta property="og:title" content=".*?" \/>/i, `<meta property="og:title" content="${seo.title}" />`);
  html = html.replace(/<meta property="og:description" content=".*?" \/>/i, `<meta property="og:description" content="${seo.description}" />`);
  html = html.replace(/<meta name="twitter:url" content=".*?" \/>/i, `<meta name="twitter:url" content="${seo.canonical}" />`);
  html = html.replace(/<meta name="twitter:title" content=".*?" \/>/i, `<meta name="twitter:title" content="${seo.title}" />`);
  html = html.replace(/<meta name="twitter:description" content=".*?" \/>/i, `<meta name="twitter:description" content="${seo.description}" />`);

  // 5. Inject Semantic SEO Pre-Rendered Fallback Content inside #root for Search Engine Crawlers
  const semanticFallback = `
    <div id="seo-prerender-content" style="max-width: 900px; margin: 0 auto; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0f172a;">
      <header style="border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 24px;">
        <nav style="font-size: 13px; font-weight: 700; color: #2563eb; margin-bottom: 12px;">
          <a href="/" style="color: #2563eb; text-decoration: none;">games4u Home</a> &rsaquo; <span>${seo.title}</span>
        </nav>
        <h1 style="font-size: 28px; font-weight: 900; line-height: 1.2; margin: 0 0 10px; color: #0f172a;">${content.h1}</h1>
        <p style="font-size: 15px; color: #475569; line-height: 1.6; margin: 0;">${content.tagline}</p>
      </header>

      <section style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; margin-bottom: 30px;">
        <h2 style="font-size: 18px; font-weight: 800; margin: 0 0 16px; color: #0f172a;">Key Platform Features & Disciplines</h2>
        <ul style="font-size: 14px; color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
          ${content.bullets.map(b => `<li style="margin-bottom: 8px;">${b}</li>`).join('\n          ')}
        </ul>
      </section>

      <footer style="border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 13px; color: #64748b;">
        <p style="margin: 0 0 10px;"><strong>Play Other Free Strategy Games on games4u:</strong></p>
        <nav style="display: flex; flex-wrap: wrap; gap: 12px;">
          <a href="/connect4" style="color: #2563eb; font-weight: 700; text-decoration: none;">Connect 4 Online</a>
          <a href="/tictactoe" style="color: #2563eb; font-weight: 700; text-decoration: none;">Tic-Tac-Toe Online</a>
          <a href="/gomoku" style="color: #2563eb; font-weight: 700; text-decoration: none;">15×15 Gomoku Online</a>
          <a href="/memory" style="color: #2563eb; font-weight: 700; text-decoration: none;">Memory Match Campaign</a>
          <a href="/ludo" style="color: #2563eb; font-weight: 700; text-decoration: none;">Ludo Championship</a>
          <a href="/rules" style="color: #64748b; text-decoration: none;">Game Rules</a>
          <a href="/leaderboard" style="color: #64748b; text-decoration: none;">Top 50 Rankings</a>
          <a href="/about" style="color: #64748b; text-decoration: none;">About</a>
        </nav>
      </footer>
    </div>
  `;

  // Inject semantic fallback inside <div id="root">
  html = html.replace('<div id="root"></div>', `<div id="root">${semanticFallback}</div>`);

  // Target directory
  const targetDir = path.join(distDir, slug);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Write static directory index.html for this route (e.g., /connect4/index.html)
  const targetFile = path.join(targetDir, 'index.html');
  fs.writeFileSync(targetFile, html, 'utf-8');

  // Also write flat html file (e.g., /connect4.html) for cleanUrls matching
  const flatFile = path.join(distDir, `${slug}.html`);
  fs.writeFileSync(flatFile, html, 'utf-8');

  console.log(`✓ Generated SEO prerender for: /${slug} -> ${targetFile} & ${flatFile}`);
});

console.log('🎉 All 11 route pages prerendered successfully with self-referencing canonical tags!');

