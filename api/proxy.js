// Proxy endpoint: POST /api/proxy?token=xxx&method=getMe
// Chuyển tiếp request tới Zalo Bot API, bypass CORS

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { token, method } = req.query;

    if (!token || !method) {
        return res.status(400).json({ error: 'Missing token or method query params' });
    }

    try {
        const targetUrl = `https://bot-api.zaloplatforms.com/bot${token}/${method}`;

        // req.body đã được Vercel tự parse JSON
        const body = req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0
            ? JSON.stringify(req.body)
            : undefined;

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        console.error('[PROXY ERROR]', error);
        return res.status(500).json({ error: error.message });
    }
}
