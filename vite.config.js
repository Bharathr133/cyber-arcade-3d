import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import url from 'url';

// Serverless API Middleware: Proxies all backend operations locally without exposing database keys
function apiServerMiddlewarePlugin() {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/')) {
          const parsedUrl = url.parse(req.url, true);
          const pathname = parsedUrl.pathname;

          let handler = null;
          try {
            if (pathname === '/api/auth') {
              const mod = await import('./api/auth.js');
              handler = mod.default;
            } else if (pathname === '/api/leaderboard') {
              const mod = await import('./api/leaderboard.js');
              handler = mod.default;
            } else if (pathname === '/api/sync') {
              const mod = await import('./api/sync.js');
              handler = mod.default;
            } else if (pathname === '/api/admin') {
              const mod = await import('./api/admin.js');
              handler = mod.default;
            } else if (pathname === '/api/match') {
              const mod = await import('./api/match.js');
              handler = mod.default;
            } else if (pathname === '/api/matchmaking') {
              const mod = await import('./api/matchmaking.js');
              handler = mod.default;
            } else if (pathname === '/api/feedback') {
              const mod = await import('./api/feedback.js');
              handler = mod.default;
            }
          } catch (e) {

            console.error('API middleware resolution error:', e);
          }

          if (handler) {
            let body = {};
            if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
              const buffers = [];
              for await (const chunk of req) {
                buffers.push(chunk);
              }
              const rawBody = Buffer.concat(buffers).toString();
              try {
                body = rawBody ? JSON.parse(rawBody) : {};
              } catch (e) {
                body = {};
              }
            }

            const mockReq = {
              method: req.method,
              url: req.url,
              headers: req.headers,
              query: parsedUrl.query || {},
              body
            };

            const mockRes = {
              statusCode: 200,
              headers: {},
              setHeader(key, val) {
                this.headers[key] = val;
                res.setHeader(key, val);
                return this;
              },
              status(code) {
                this.statusCode = code;
                res.statusCode = code;
                return this;
              },
              json(data) {
                if (!res.headersSent) {
                  res.setHeader('Content-Type', 'application/json');
                  res.statusCode = this.statusCode || 200;
                }
                res.end(JSON.stringify(data));
              },
              send(data) {
                res.end(data);
              }
            };

            try {
              await handler(mockReq, mockRes);
              return;
            } catch (err) {
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err.message || 'Internal API Error' }));
              }
              return;
            }
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), apiServerMiddlewarePlugin()],
  server: {
    port: 3000,
    host: true,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
    }
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-multiplayer': ['peerjs', 'qrcode.react'],
          'vendor-graphics': ['three', 'canvas-confetti'],
          'vendor-icons': ['lucide-react']
        }
      }
    }
  }
});
