import fs from 'fs';
import { getServerSupabase, sendJsonResponse } from './_lib/supabaseServer.js';

// In-memory rate limiting map for basic spam protection
const ipRateLimit = new Map();

function getDiscordWebhookUrl() {
  if (process.env.DISCORD_WEBHOOK_URL) return process.env.DISCORD_WEBHOOK_URL.trim();
  if (process.env.DISCORD_FEEDBACK_WEBHOOK_URL) return process.env.DISCORD_FEEDBACK_WEBHOOK_URL.trim();
  try {
    if (fs.existsSync('.env')) {
      const content = fs.readFileSync('.env', 'utf-8');
      const match = content.match(/DISCORD_WEBHOOK_URL=(.*)/);
      if (match) return match[1].trim();
    }
  } catch (e) {}
  return null;
}

function isRateLimited(ip) {
  if (!ip) return false;
  const now = Date.now();
  const history = ipRateLimit.get(ip) || [];
  const recent = history.filter(t => now - t < 60000); // 1 minute window
  if (recent.length >= 10) return true; // Max 10 submissions per minute per IP
  recent.push(now);
  ipRateLimit.set(ip, recent);
  return false;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJsonResponse(res, 405, { error: 'Method Not Allowed' });
  }

  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(clientIp)) {
    return sendJsonResponse(res, 429, { error: 'Too many requests. Please wait a minute before submitting again.' });
  }

  const { category, email, message, playerName, rating } = req.body || {};

  const cleanMsg = typeof message === 'string' ? message.trim() : '';
  if (!cleanMsg || cleanMsg.length < 2 || cleanMsg.length > 2000) {
    return sendJsonResponse(res, 400, { error: 'Message must be between 2 and 2000 characters.' });
  }

  const VALID_CATEGORIES = ['FEEDBACK', 'BUG', 'FEATURE', 'QUESTION'];
  const cleanCategory = VALID_CATEGORIES.includes(category) ? category : 'FEEDBACK';
  const cleanEmail = typeof email === 'string' ? email.trim().slice(0, 150) : null;
  const cleanPlayerName = typeof playerName === 'string' ? playerName.trim().slice(0, 50) : 'Guest Player';
  const cleanRating = typeof rating === 'number' ? Math.round(rating) : 1200;

  // 1. Secure Server-Side Discord Dispatch (Secret Key never exposed to client)
  const discordWebhookUrl = getDiscordWebhookUrl();
  let discordDispatched = false;


  if (discordWebhookUrl && discordWebhookUrl.startsWith('https://discord.com/api/webhooks/')) {
    const CATEGORY_COLORS = {
      BUG: 15548997,       // Red (#ED4245)
      FEATURE: 10181046,   // Purple (#9B59B6)
      FEEDBACK: 3447003,   // Blue (#3498DB)
      QUESTION: 15844367   // Amber (#F1C40F)
    };

    const CATEGORY_EMOJIS = {
      BUG: '🐞 BUG REPORT',
      FEATURE: '💡 FEATURE PROPOSAL',
      FEEDBACK: '💬 PLAYER FEEDBACK',
      QUESTION: '❓ SUPPORT QUESTION'
    };

    const payload = {
      username: 'games4u Arena Bot',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/808/808439.png',
      embeds: [
        {
          title: `${CATEGORY_EMOJIS[cleanCategory] || '💬 INCOMING MESSAGE'}`,
          description: `>>> ${cleanMsg}`,
          color: CATEGORY_COLORS[cleanCategory] || 3447003,
          fields: [
            {
              name: '👤 Player',
              value: `**${cleanPlayerName}** (${cleanRating} ELO)`,
              inline: true
            },
            {
              name: '✉️ Contact Email',
              value: cleanEmail ? `\`${cleanEmail}\`` : '_Not provided_',
              inline: true
            },
            {
              name: '🌐 Platform',
              value: 'games4u Strategy Arena (Web)',
              inline: true
            }
          ],
          footer: {
            text: 'Live Dispatch System • games4u.vercel.app'
          },
          timestamp: new Date().toISOString()
        }
      ]
    };

    try {
      const discordRes = await fetch(discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      discordDispatched = discordRes.ok;
    } catch (discordErr) {
      console.error('[API Feedback] Discord webhook error:', discordErr);
    }
  }

  // 2. Server-Side Supabase Storage
  try {
    const supabase = getServerSupabase();
    if (supabase) {
      await supabase.from('feedback').insert([{
        category: cleanCategory,
        email: cleanEmail,
        message: cleanMsg,
        player_name: cleanPlayerName,
        rating: cleanRating,
        created_at: new Date().toISOString()
      }]);
    }
  } catch (dbErr) {
    // Non-fatal if table not created yet
  }

  return sendJsonResponse(res, 200, {
    success: true,
    discordNotified: discordDispatched,
    message: 'Feedback received securely.'
  });
}
