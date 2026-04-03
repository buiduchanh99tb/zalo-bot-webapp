// Messages endpoint: GET /api/messages
// Frontend poll endpoint này mỗi 2 giây để lấy tin nhắn webhook mới từ Redis

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

async function redisCommand(...args) {
    const res = await fetch(KV_URL, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${KV_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(args)
    });
    return res.json();
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Lấy tất cả messages trong queue
        const data = await redisCommand('LRANGE', 'zalo_messages', '0', '-1');

        if (data.result && data.result.length > 0) {
            // Xóa những messages đã đọc
            await redisCommand('DEL', 'zalo_messages');

            // Parse JSON strings thành objects
            const messages = data.result.map(item => {
                try { return JSON.parse(item); } catch { return null; }
            }).filter(Boolean);

            return res.status(200).json({ messages });
        }

        return res.status(200).json({ messages: [] });
    } catch (e) {
        console.error('[MESSAGES] Error:', e.message);
        return res.status(200).json({ messages: [], error: e.message });
    }
}
