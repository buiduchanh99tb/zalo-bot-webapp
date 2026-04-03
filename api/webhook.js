// Webhook endpoint: POST /api/webhook
// Zalo Server sẽ gọi POST vào đây khi có tin nhắn mới
// Xác thực X-Bot-Api-Secret-Token → Lưu vào Upstash Redis (Vercel KV)

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'my-zalo-webhook-secret';

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
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 1. Xác thực Secret Token (theo tài liệu Zalo)
    const incomingSecret = req.headers['x-bot-api-secret-token'];
    console.log('[WEBHOOK] Secret:', incomingSecret ? 'có' : 'không có');

    if (incomingSecret && incomingSecret !== WEBHOOK_SECRET) {
        console.warn('[WEBHOOK] Secret không khớp!');
        return res.status(403).json({ message: 'Unauthorized' });
    }

    // 2. Trả lời Zalo ngay (tránh timeout)
    const payload = req.body;
    console.log('[WEBHOOK] Payload:', JSON.stringify(payload).substring(0, 300));

    // 3. Lưu message vào Redis queue (TTL 5 phút)
    try {
        await redisCommand('LPUSH', 'zalo_messages', JSON.stringify(payload));
        // Giữ tối đa 100 messages trong queue
        await redisCommand('LTRIM', 'zalo_messages', '0', '99');
    } catch (e) {
        console.error('[WEBHOOK] Redis error:', e.message);
    }

    return res.status(200).json({ message: 'Success' });
}
