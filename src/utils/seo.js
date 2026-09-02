/**
 * Enterprise SEO & Google Indexing Configuration for games4u
 * Manages per-route metadata, self-referencing canonical tags, and OpenGraph tags.
 */

export const SEO_CONFIG = {
  home: {
    title: 'Play Free Online Games — 2-Player Board Games with Friends (No Download)',
    description: 'Play free 2-player & 4-player online games with friends in your browser: Connect 4 (Four in a Row), Tic-Tac-Toe (XO), 15×15 Gomoku (Five in a Row), Memory Match, and Ludo. Real-time multiplayer, private room codes, smart AI bots, and live Grandmaster leaderboards with zero downloads.',
    canonical: 'https://onlinefreegames.vercel.app/',
    keywords: 'free online games, 2 player games online, play games with friends online, connect 4 online, play connect 4 online free, four in a row online, tic tac toe online, tic tac toe 2 player, xo game online, noughts and crosses online, gomoku online, five in a row online, 15x15 gomoku, ludo online, play ludo with friends, ludo 2 player 4 player, memory match online, browser games no download, 2 player board games online, online games unblocked, multiplayer web games, games4u'
  },
  connect4: {
    title: 'Play Connect 4 Online Free — 2-Player Strategy Board Game (No Download)',
    description: 'Play Connect 4 (Four in a Row) online free against friends with 6-letter private room codes or challenge smart AI bots. Real-time gravity grid multiplayer in your browser.',
    canonical: 'https://onlinefreegames.vercel.app/connect4',
    keywords: 'connect 4 online, play connect 4 online free, four in a row online, connect 4 multiplayer, 2 player connect 4, connect four browser game, play connect 4 with friends'
  },
  tictactoe: {
    title: 'Play Tic-Tac-Toe Online Free — 2-Player XO Board Game (No Download)',
    description: 'Play Tic-Tac-Toe (Noughts & Crosses / XO) online with friends or test your tactics against unbeatable AI bots. Fast 3x3 blitz matches with live ELO rankings.',
    canonical: 'https://onlinefreegames.vercel.app/tictactoe',
    keywords: 'tic tac toe online, play tic tac toe free, 2 player xo game, noughts and crosses online, tic tac toe with friends, tic tac toe unblocked, xo game 2 player'
  },
  gomoku: {
    title: 'Play Gomoku Online Free — 15x15 Five in a Row Tournament Grid',
    description: 'Play 15x15 Gomoku (Five in a Row) online free. Battle friends in private rooms or play against Master AI bots. Server-authoritative tournament moves in your browser.',
    canonical: 'https://onlinefreegames.vercel.app/gomoku',
    keywords: 'gomoku online, five in a row online, 15x15 gomoku, play gomoku with friends, gomoku multiplayer, gobang online free, gomoku tournament grid'
  },
  memory: {
    title: 'Play Memory Match Online Free — 5-Level Visual Recall Brain Campaign',
    description: 'Challenge your active working memory in Memory Match Blitz. Play solo 5-level cognitive campaign, battle AI bots, or play 2-player local pass & play.',
    canonical: 'https://onlinefreegames.vercel.app/memory',
    keywords: 'memory match online, memory card game online, brain training game, visual recall game, memory game for adults, cognitive games free, memory flip card game'
  },
  ludo: {
    title: 'Play Ludo Online Free — 2 to 4 Player Championship Board Game',
    description: 'Play classic Ludo Championship online free with 2 to 4 players. Invite friends with private room codes or compete against 3 smart AI bots.',
    canonical: 'https://onlinefreegames.vercel.app/ludo',
    keywords: 'ludo online, play ludo with friends, ludo 2 player 4 player, ludo championship online, free ludo multiplayer browser game, ludo board game online'
  },
  rules: {
    title: 'How to Play & Game Rules — games4u Strategy Arena Guide',
    description: 'Complete tactical rulebooks and winning strategies for Connect 4, Tic-Tac-Toe, Gomoku 15x15, Memory Match, and 4-Player Ludo Championship.',
    canonical: 'https://onlinefreegames.vercel.app/rules',
    keywords: 'connect 4 rules, how to play gomoku, tic tac toe strategy, ludo rules guide, board game winning tactics, games4u rules'
  },
  leaderboard: {
    title: 'Global Grandmaster Leaderboard & Top 50 Rankings — games4u',
    description: 'Live real-time ELO rankings and Grandmaster tier leaderboards for Connect 4, Tic-Tac-Toe, Gomoku, and Ludo strategy masters.',
    canonical: 'https://onlinefreegames.vercel.app/leaderboard',
    keywords: 'online games leaderboard, global ELO rankings, grandmaster board games, top player standings, games4u leaderboard'
  },
  about: {
    title: 'About games4u — Free Multiplayer Strategy Board Games Platform',
    description: 'Learn about games4u: zero-install, instant multiplayer classic strategy games built for seamless real-time fun with friends across all devices.',
    canonical: 'https://onlinefreegames.vercel.app/about',
    keywords: 'about games4u, free online board games story, multiplayer web games platform, zero download games'
  },
  contact: {
    title: 'Contact & Player Feedback — games4u Support',
    description: 'Get in touch with the games4u developer team for feature requests, bug reports, and multiplayer tournament inquiries.',
    canonical: 'https://onlinefreegames.vercel.app/contact',
    keywords: 'contact games4u, games4u feedback, bug report online games, developer contact'
  },
  fairplay: {
    title: 'Fair Play & Anti-Cheat Policy — games4u Competitive Arena',
    description: 'Learn how games4u protects competitive match integrity with server-authoritative move validation and anti-cheat ELO calculation algorithms.',
    canonical: 'https://onlinefreegames.vercel.app/fair-play',
    keywords: 'fair play policy, anti cheat online games, server authoritative ELO, competitive integrity, games4u fair play'
  },
  privacy: {
    title: 'Privacy Policy & Terms of Service — games4u',
    description: 'Read the privacy policy, data protection standards, and terms of service for games4u free online multiplayer strategy gaming platform.',
    canonical: 'https://onlinefreegames.vercel.app/privacy',
    keywords: 'privacy policy games4u, terms of service, user data protection, gdpr games'
  }
};

/**
 * Dynamically updates document title, canonical link, and OpenGraph/Twitter meta tags
 * whenever the client-side route changes in React.
 */
export function updateSEO({ gameId, page }) {
  if (typeof document === 'undefined') return;

  let key = 'home';
  if (page && (SEO_CONFIG[page] || page === 'fair-play')) {
    key = page === 'fair-play' ? 'fairplay' : page;
  } else if (gameId && gameId !== 'home' && SEO_CONFIG[gameId]) {
    key = gameId;
  }

  const config = SEO_CONFIG[key] || SEO_CONFIG.home;

  // 1. Update Document Title
  document.title = config.title;

  // 2. Update Meta Title
  const metaTitle = document.querySelector('meta[name="title"]');
  if (metaTitle) metaTitle.setAttribute('content', config.title);

  // 3. Update Meta Description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', config.description);

  // 4. Update Meta Keywords
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords && config.keywords) metaKeywords.setAttribute('content', config.keywords);

  // 5. Update Canonical Tag (Self-referencing for each route)
  let canonicalTag = document.querySelector('link[rel="canonical"]');
  if (canonicalTag) {
    canonicalTag.setAttribute('href', config.canonical);
  } else {
    canonicalTag = document.createElement('link');
    canonicalTag.setAttribute('rel', 'canonical');
    canonicalTag.setAttribute('href', config.canonical);
    document.head.appendChild(canonicalTag);
  }

  // 6. Update OpenGraph Tags
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', config.canonical);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', config.title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', config.description);

  // 7. Update Twitter Card Tags
  const twUrl = document.querySelector('meta[name="twitter:url"]');
  if (twUrl) twUrl.setAttribute('content', config.canonical);

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.setAttribute('content', config.title);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', config.description);
}
