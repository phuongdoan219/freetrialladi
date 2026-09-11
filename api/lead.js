module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false });
  }

  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const webhookSecret = process.env.SHEET_WEBHOOK_SECRET;
  if (!webhookUrl || !webhookSecret) {
    return response.status(503).json({ ok: false, error: 'Lead storage is not configured.' });
  }

  let body;
  try {
    body = typeof request.body === 'string' ? JSON.parse(request.body) : (request.body || {});
  } catch {
    return response.status(400).json({ ok: false, error: 'Invalid JSON.' });
  }
  const childAge = Number(body.childAge);

  if (!body.testOnly) {
    if (!String(body.parentName || '').trim() || !String(body.phone || '').trim() ||
        !String(body.concern || '').trim() || childAge < 8 || childAge > 19 || !body.commitment) {
      return response.status(400).json({ ok: false, error: 'Invalid lead data.' });
    }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body.testOnly
        ? { action: 'ping', secret: webhookSecret }
        : { ...body, childAge, secret: webhookSecret }),
      signal: controller.signal,
    });

    const result = await webhookResponse.json();
    if (!webhookResponse.ok || !result.ok) {
      console.error('Google Sheets webhook error', { status: webhookResponse.status, result });
      return response.status(502).json({ ok: false });
    }

    return response.status(200).json({ ok: true, testOnly: Boolean(body.testOnly) });
  } catch (error) {
    console.error('Google Sheets webhook request failed', error);
    return response.status(502).json({ ok: false });
  } finally {
    clearTimeout(timeout);
  }
};
