// Proxy a la API de Google Gemini.
// La key vive solo en process.env.GEMINI_API_KEY (Vercel env vars).
// El cliente envía POST /api/gemini?model=<nombre> con el body que Gemini espera.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { message: 'Method not allowed' } });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return res.status(500).json({ error: { message: 'GEMINI_API_KEY no configurada en el servidor' } });
  }

  const model = String(req.query.model || 'gemini-2.5-flash');
  if (!/^gemini-[\w.\-]+$/.test(model)) {
    return res.status(400).json({ error: { message: 'Modelo inválido' } });
  }

  const upstream = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;

  try {
    const r = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    return res.status(502).json({ error: { message: 'Proxy error: ' + e.message } });
  }
}
