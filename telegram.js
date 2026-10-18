export async function notifyAdmin(message) {
  const { TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID } = process.env;
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) return;
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_ADMIN_CHAT_ID, text: message, disable_web_page_preview: true })
    });
  } catch (err) {
    // Notification failures should not undo a committed wallet/database operation.
    console.error('Telegram notification failed:', err.message);
  }
}
