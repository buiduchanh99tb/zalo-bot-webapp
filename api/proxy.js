// Proxy endpoint: /api/proxy
// Frontend gọi: POST /api/proxy?token=xxx&method=getMe
// Server chuyển tiếp: POST https://bot-api.zaloplatforms.com/bot{token}/{method}

module.exports = async (req, res) => {
    // Cho phép CORS
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

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: req.body && Object.keys(req.body).length > 0
                ? JSON.stringify(req.body)
                : undefined
        });

        const data = await response.json();
        res.status(response.status).json(data);
    } catch (error) {
        console.error('[PROXY ERROR]', error.message);
        res.status(500).json({ error: error.message });
    }
};
