// Unified API Client: Proxied Serverless Endpoints with Graceful Client Fallback

const DEFAULT_TIMEOUT = 15_000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1_000;

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchFromApi(endpoint, options = {}) {
  const { timeout = DEFAULT_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...(fetchOptions.headers || {})
        }
      });

      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await response.json();

        if (response.status === 429) {
          if (attempt < retries) {
            await delay(RETRY_DELAY * (attempt + 1));
            continue;
          }
          return { ok: false, status: 429, error: data.error || 'Rate limited. Please try again later.' };
        }

        if (!response.ok && response.status >= 500 && attempt < retries) {
          await delay(RETRY_DELAY * (attempt + 1));
          continue;
        }

        return { ok: response.ok, status: response.status, data };
      }

      return { ok: false, status: response.status, error: 'Non-JSON response' };
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        if (attempt < retries) {
          await delay(RETRY_DELAY * (attempt + 1));
          continue;
        }
        return { ok: false, error: 'Request timed out. Please check your connection.' };
      }

      if (attempt < retries) {
        await delay(RETRY_DELAY * (attempt + 1));
        continue;
      }

      return { ok: false, error: err.message || 'Network error' };
    }
  }
}
