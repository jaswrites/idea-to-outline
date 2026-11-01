Feedback · JS
// Receives feedback from the tool and emails it to the project inbox via Resend.
// Only the rating and the optional comment are handled. Nothing is stored or logged.
 
const ALLOWED_RATINGS = ['yes', 'somewhat', 'no'];
const MAX_COMMENT_LENGTH = 1000;
 
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
 
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ ok: false, error: 'Invalid request' });
    }
  }
  body = body || {};
 
  // Hidden spam trap: real visitors never fill this field, bots often do.
  if (body.website) {
    return res.status(200).json({ ok: true });
  }
 
  const rating = String(body.rating || '').toLowerCase();
  if (!ALLOWED_RATINGS.includes(rating)) {
    return res.status(400).json({ ok: false, error: 'Please choose a rating' });
  }
 
  const comment = String(body.comment || '').trim().slice(0, MAX_COMMENT_LENGTH);
 
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.FEEDBACK_TO;
  if (!apiKey || !to) {
    return res.status(500).json({ ok: false, error: 'Feedback is not set up yet' });
  }
 
  const text = [
    'New feedback for Idea to Outline',
    '',
    'Did it help? ' + rating,
    '',
    'Comment:',
    comment || '(no comment)'
  ].join('\n');
 
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Idea to Outline <onboarding@resend.dev>',
        to: [to],
        subject: 'Feedback: ' + rating,
        text: text
      })
    });
 
    if (!response.ok) {
      return res.status(502).json({ ok: false, error: 'Could not send feedback' });
    }
 
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Could not send feedback' });
  }
};
 
