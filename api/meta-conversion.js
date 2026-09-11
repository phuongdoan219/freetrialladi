const crypto = require('crypto');

function hash(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function normalizeText(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z]/g, '');
}

function normalizeVietnamesePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('84')) return digits;
  if (digits.startsWith('0')) return `84${digits.slice(1)}`;
  return digits;
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false });
  }

  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CONVERSIONS_API_TOKEN;
  if (!pixelId || !accessToken) {
    return response.status(503).json({ ok: false, error: 'Meta tracking is not configured.' });
  }

  const { eventId, parentName, phone, eventSourceUrl } = request.body || {};
  const normalizedPhone = normalizeVietnamesePhone(phone);
  const normalizedNameParts = String(parentName || '').trim().split(/\s+/).filter(Boolean);
  const firstName = normalizeText(normalizedNameParts.at(-1));
  const lastName = normalizeText(normalizedNameParts.slice(0, -1).join(''));

  if (!eventId || !normalizedPhone || !eventSourceUrl) {
    return response.status(400).json({ ok: false, error: 'Invalid event data.' });
  }

  const userData = {
    ph: [hash(normalizedPhone)],
    client_ip_address: request.headers['x-forwarded-for']?.split(',')[0]?.trim() || undefined,
    client_user_agent: request.headers['user-agent'] || undefined,
  };

  if (firstName) userData.fn = [hash(firstName)];
  if (lastName) userData.ln = [hash(lastName)];

  const metaResponse = await fetch(`https://graph.facebook.com/v23.0/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: 'website',
          event_source_url: eventSourceUrl,
          user_data: userData,
        },
      ],
    }),
  });

  const result = await metaResponse.json();
  if (!metaResponse.ok) {
    console.error('Meta Conversions API error', result);
    return response.status(502).json({ ok: false });
  }

  return response.status(200).json({ ok: true, eventsReceived: result.events_received });
};
