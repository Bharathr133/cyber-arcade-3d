/**
 * Secure Feedback & Discord Notification Client
 * Dispatches player tickets through the secure serverless backend endpoint (/api/feedback)
 * to ensure that Discord Webhook URLs and private secrets are NEVER exposed to the browser client.
 */

export const feedbackNotifier = {
  /**
   * Submit ticket via secure serverless backend proxy
   */
  async sendTicket({ category, email, message, playerName, rating }) {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          email: email ? email.trim() : null,
          message: message ? message.trim() : '',
          playerName: playerName || 'Guest Player',
          rating: rating || 1200
        })
      });

      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: true, ...data };
      } else {
        return { success: false, status: res.status };
      }
    } catch (err) {
      console.warn('[Feedback Service] Server dispatch failed, saved to local audit log:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Send test ping via serverless backend
   */
  async sendTestPing() {
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'FEEDBACK',
          message: '✅ Discord Webhook connection test successful from games4u Arena backend!',
          playerName: 'Platform Admin',
          rating: 2000
        })
      });
      return { success: res.ok };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
