// Unified API Client: Proxied Serverless Endpoints with Graceful Client Fallback

export async function fetchFromApi(endpoint, options = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    // If endpoint exists and returns JSON
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await response.json();
      return { ok: response.ok, status: response.status, data };
    }

    return { ok: false, status: response.status, error: 'Non-JSON response' };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
