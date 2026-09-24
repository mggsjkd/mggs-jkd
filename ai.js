
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return res.status(503).json({
      error: 'AI backend is not configured yet. Add OPENAI_API_KEY in Vercel Environment Variables.'
    });
  }

  try {
    const body = req.body || {};
    const prompt = String(body.prompt || '').trim();
    const mode = body.mode === 'explain' ? 'explain' : 'question';
    if (!prompt) return res.status(400).json({ error: 'Question is required.' });

    const system =
      mode === 'explain'
        ? 'You are the MGGS school study assistant. Explain the requested chapter for a school student in simple, clear language. Organize the answer with headings, key concepts, examples, important terms, common mistakes, and a short revision summary. Never claim to know school-specific facts that were not supplied.'
        : 'You are the MGGS school study assistant. Answer a student question clearly and age-appropriately. Show reasoning when useful, use simple examples, and avoid inventing facts. If the question is ambiguous, say what assumption you are making.';

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      })
    });

    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'AI provider error.' });

    return res.status(200).json({
      answer: data?.choices?.[0]?.message?.content || 'No answer returned.'
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'AI request failed.' });
  }
}
