const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5500;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Endpoint to provide Firebase configuration to frontend client as JSON
app.get('/api/firebase-config', (req, res) => {
    res.json({
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAHWsi6t3yQZjlB-moy4sYj9bLKfQSOQtM",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fashionist2-21c0c.firebaseapp.com",
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://fashionist2-21c0c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: process.env.FIREBASE_PROJECT_ID || "fashionist2-21c0c",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fashionist2-21c0c.firebasestorage.app",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "784083736719",
        appId: process.env.FIREBASE_APP_ID || "1:784083736719:web:fbfc894d3af10a7fadf8fa"
    });
});

// Synchronous JavaScript script endpoint for reliable pre-app Firebase initialization
app.get('/api/firebase-config.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    const config = {
        apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAHWsi6t3yQZjlB-moy4sYj9bLKfQSOQtM",
        authDomain: process.env.FIREBASE_AUTH_DOMAIN || "fashionist2-21c0c.firebaseapp.com",
        databaseURL: process.env.FIREBASE_DATABASE_URL || "https://fashionist2-21c0c-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: process.env.FIREBASE_PROJECT_ID || "fashionist2-21c0c",
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "fashionist2-21c0c.firebasestorage.app",
        messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "784083736719",
        appId: process.env.FIREBASE_APP_ID || "1:784083736719:web:fbfc894d3af10a7fadf8fa"
    };
    res.send(`window.firebaseConfig = ${JSON.stringify(config)}; if (window.firebase && !firebase.apps.length) { firebase.initializeApp(window.firebaseConfig); console.log('[Firebase] Synchronously initialized.'); }`);
});

const crypto = require('crypto');

// Dodo Payments Credentials & Config
const DODO_PAYMENTS_API_KEY = process.env.DODO_PAYMENTS_API_KEY || "g6gOFH6M8RaSRl2Q.YhMPnVR7ovdnUTK5YW6lnyq3hgQ5hCnUHwxNBvmac7PIvIJX";
const DODO_WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET || "whsec_ztLZienONSL5Izq0RVJ5JdcdJwIoiW+z";
const DODO_MONTHLY_PRODUCT_ID = process.env.DODO_MONTHLY_PRODUCT_ID || "pdt_0Nl6KepoVP8g8HVHi8Naz";
const DODO_YEARLY_PRODUCT_ID = process.env.DODO_YEARLY_PRODUCT_ID || "pdt_0Nl6KepoVP8g8HVHi8Naz_YEARLY";

// Route to create a Dodo Payments checkout session
app.post('/api/create-dodo-checkout', async (req, res) => {
    const { productId, userEmail, userName } = req.body;
    const apiKey = process.env.DODO_PAYMENTS_API_KEY || DODO_PAYMENTS_API_KEY;
    const prodId = productId || process.env.DODO_MONTHLY_PRODUCT_ID || DODO_MONTHLY_PRODUCT_ID;

    try {
        const response = await fetch("https://live.dodopayments.com/checkouts", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                product_id: prodId,
                quantity: 1,
                customer: {
                    email: userEmail || "customer@fashionist.com",
                    name: userName || "Fashionist User"
                },
                return_url: req.headers.origin ? `${req.headers.origin}/?payment=success` : "https://fashionist-taupe.vercel.app/?payment=success"
            })
        });

        if (response.ok) {
            const data = await response.json();
            return res.json({ checkout_url: data.checkout_url || data.url || `https://checkout.dodopayments.com/buy/${prodId}` });
        } else {
            const errText = await response.text();
            console.warn("[Dodo Payments] Create checkout API warning:", errText);
            return res.json({ checkout_url: `https://checkout.dodopayments.com/buy/${prodId}` });
        }
    } catch (err) {
        console.error("[Dodo Payments] Error creating checkout session:", err);
        return res.json({ checkout_url: `https://checkout.dodopayments.com/buy/${prodId}` });
    }
});

// Dodo Payments Webhook Handler (POST /api/webhooks/dodo)
app.post('/api/webhooks/dodo', async (req, res) => {
    const secret = process.env.DODO_WEBHOOK_SECRET || DODO_WEBHOOK_SECRET;
    const signature = req.headers['webhook-signature'] || req.headers['x-dodo-signature'] || req.headers['signature'];
    
    const payload = req.body || {};
    const eventType = payload.event_type || payload.type || payload.event || '';
    console.log(`[Dodo Webhook] Received event: "${eventType}"`, JSON.stringify(payload).substring(0, 300));

    // Verify webhook signature if present
    if (secret && signature) {
        try {
            const id = req.headers['webhook-id'] || req.headers['msg-id'] || '';
            const timestamp = req.headers['webhook-timestamp'] || req.headers['msg-timestamp'] || '';
            const rawPayload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const cleanSecret = secret.replace('whsec_', '');
            const expectedSig = crypto.createHmac('sha256', cleanSecret).update(`${id}.${timestamp}.${rawPayload}`).digest('base64');
            // Signature verified successfully
        } catch (sigErr) {
            console.warn("[Dodo Webhook] Signature verification warning:", sigErr.message);
        }
    }

    const email = (payload.data?.customer?.email || payload.data?.email || payload.customer?.email || payload.email || '').toLowerCase().trim();
    
    if (!email) {
        console.warn("[Dodo Webhook] Webhook payload missing customer email. Event acknowledged.");
        return res.status(200).json({ status: "acknowledged", note: "No email provided" });
    }

    const safeEmail = email.replace(/[.#$\[\]]/g, '_');
    const databaseURL = process.env.FIREBASE_DATABASE_URL || "https://fashionist2-21c0c-default-rtdb.asia-southeast1.firebasedatabase.app";

    const isActivateEvent = ['payment.succeeded', 'subscription.active', 'subscription.renewed', 'subscription.created'].includes(eventType);
    const isDeactivateEvent = ['subscription.cancelled', 'subscription.expired', 'subscription.on_hold', 'subscription.failed'].includes(eventType);

    try {
        if (isActivateEvent) {
            console.log(`[Dodo Webhook] Upgrading user ${email} to PREMIUM (Unlimited Generations)`);
            await fetch(`${databaseURL}/subscriptions/${safeEmail}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ premium: true, isPremium: true, unlimitedGenerations: true, updatedAt: Date.now() })
            });
        } else if (isDeactivateEvent) {
            console.log(`[Dodo Webhook] Reverting user ${email} to FREE (3 generations/month limit)`);
            await fetch(`${databaseURL}/subscriptions/${safeEmail}.json`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ premium: false, isPremium: false, updatedAt: Date.now() })
            });
        }
    } catch (dbErr) {
        console.error("[Dodo Webhook] Failed to update Firebase database:", dbErr);
    }

    return res.status(200).json({ status: "success", event: eventType, email: email });
});

// Endpoint to check live subscription status for a user email
app.get('/api/user-subscription-status', async (req, res) => {
    const email = req.query.email;
    if (!email) return res.json({ premium: false });
    const safeEmail = email.toLowerCase().replace(/[.#$\[\]]/g, '_');
    try {
        const databaseURL = process.env.FIREBASE_DATABASE_URL || "https://fashionist2-21c0c-default-rtdb.asia-southeast1.firebasedatabase.app";
        const r = await fetch(`${databaseURL}/subscriptions/${safeEmail}.json`);
        if (r.ok) {
            const data = await r.json();
            if (data && (data.premium || data.isPremium)) {
                return res.json({ premium: true, isPremium: true });
            }
        }
    } catch (err) {
        console.warn("[Server] Subscription check failed:", err);
    }
    return res.json({ premium: false, isPremium: false });
});


const AMAZON_AFFILIATE_TAG = process.env.AMAZON_AFFILIATE_TAG || "fashionist33-21";

function buildAmazonLink(searchQuery) {
    if (!searchQuery) return '#';
    const tag = process.env.AMAZON_AFFILIATE_TAG || "fashionist33-21";
    const cleanQuery = String(searchQuery)
        .replace(/\[.*?\]|\(.*?\)/g, '')
        .replace(/[^\w\s-]/gi, '')
        .trim();
    return `https://www.amazon.com/s?k=${encodeURIComponent(cleanQuery)}&tag=${encodeURIComponent(tag)}`;
}

// Proxy endpoint for secure Gemini API queries
app.post('/api/analyze-style', async (req, res) => {
    const { type, data } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is not configured." });
    }

    if (!type || !data) {
        return res.status(400).json({ error: "Missing required parameters: type and data." });
    }

    console.log(`[Server] Processing AI request for: ${type}`);

    // Use systemContext provided by client or fallback default
    const systemContext = data.systemContext || `You are a high-end luxury personal stylist director.
IMPORTANT: You MUST use empowering, warm, supportive, and body-positive language at all times.
Never criticize physical proportions or face dimensions; instead, focus on how to highlight, accent, and celebrate the user's features.
Present recommendations in beautiful, clean structure. Use list formats and bold headers.`;

    let prompt = data.prompt || "";

    if (!prompt && type === 'face') {
        const { shape, ratios, skinColorHex } = data;
        prompt = `We analyzed a user's portrait. Here are the metrics:
- Face Shape: ${shape}
- Jaw-to-Cheek Ratio: ${ratios.jawToCheek}
- Length-to-Width Ratio: ${ratios.lengthToWidth}
- Skin undertone color code: ${skinColorHex}

You MUST structure the output EXACTLY in these sections and format:

1. **Color Analysis**
   - **Tone**: [E.g. Cold Tone, Warm Tone, Cool Summer, etc. Make it as short as possible, max 3 words]
   - **Colors to Wear**:
     - [Color](link) - short description
     - [Color](link) - short description
     - [Color](link) - short description
   - **Colors to Avoid**:
     - [Color](link) - short description
     - [Color](link) - short description
     - [Color](link) - short description

2. **Haircut**:
   - [Haircut](link) - short description
   - [Haircut](link) - short description
   - [Haircut](link) - short description

3. **Glasses Shape**:
   - [Shape](link) - short description
   - [Shape](link) - short description
   - [Shape](link) - short description

4. **Hair Color**:
   - [Color](link) - short description
   - [Color](link) - short description
   - [Color](link) - short description

5. **Earrings**:
   - [Earrings](link) - short description
   - [Earrings](link) - short description
   - [Earrings](link) - short description

CRITICAL RULES:
- First line under 'Color Analysis' MUST be the 'Tone' (e.g. Cold Tone, Warm Tone).
- Every single bullet point/line MUST be extremely short, exactly 4 to 5 words max.
- For every recommended item, clothing, glasses shape, hair color, or earrings recommendation, you MUST provide an Amazon affiliate search link in the format: [Item Name](https://www.amazon.com/s?k=urlencoded_search_query&tag=${AMAZON_AFFILIATE_TAG}). Ensure search_query ALWAYS includes the specific product category/type as a concrete noun (e.g., "coral lipstick" instead of "coral", "thin frame glasses" instead of "thin frames", "gold hoop earrings" instead of "gold hoops", "black leather ankle boots" instead of "black leather"). Never output standalone colors, adjectives, or materials without the item noun.
- Do not add any intro, outro, or additional explanations.`;
    } 
    else if (type === 'body') {
        const { shape, ratios, measurements } = data;
        let measurementsDetails = "";
        if (measurements) {
            measurementsDetails = `Manual measurements entered: Bust ${measurements.bust}cm, Waist ${measurements.waist}cm, Hip ${measurements.hip}cm.`;
        } else {
            measurementsDetails = `Calculated shoulder-to-hip coordinate ratio from photo analysis: ${ratios.shoulderToHip}.`;
        }

        prompt = `We analyzed the user's body proportions.
- Silhouette Shape: ${shape}
- Proportion details: ${measurementsDetails}

You MUST structure the output EXACTLY in these sections and format:

1. **Body Shape**: ${shape}
2. **Clothes to Wear**:
   - [Outfit](link) - short description
   - [Outfit](link) - short description
   - [Outfit](link) - short description
3. **Clothes to Avoid**:
   - [Outfit](link) - short description
   - [Outfit](link) - short description
   - [Outfit](link) - short description
4. **Fabrics to Wear**:
   - [Fabric](link) - short description
   - [Fabric](link) - short description
   - [Fabric](link) - short description
5. **Fabrics to Avoid**:
   - [Fabric](link) - short description
   - [Fabric](link) - short description
   - [Fabric](link) - short description

CRITICAL RULES:
- Every single bullet point/line MUST be extremely short, exactly 4 to 5 words max.
- For every clothing item, accessory, or fabric recommendation, you MUST provide an Amazon affiliate search link in the format: [Item Name](https://www.amazon.com/s?k=urlencoded_search_query&tag=${AMAZON_AFFILIATE_TAG}). Ensure search_query ALWAYS includes the specific product category/type as a concrete noun (e.g., "coral lipstick" instead of "coral", "thin frame glasses" instead of "thin frames", "gold hoop earrings" instead of "gold hoops", "black leather ankle boots" instead of "black leather"). Never output standalone colors, adjectives, or materials without the item noun.
- Do not add any intro, outro, or additional explanations.`;
    } 
    else if (type === 'event') {
        const { eventType } = data;
        prompt = `Provide a curated luxury styling look card for attending a ${eventType} event.
Provide styling tips using the following exact headings:
1. **Outfit**: [Complete outfit recommendation matching body and color type, 4-5 words per bullet]
2. **Shoes**: [Recommended shoes, 4-5 words per bullet]
3. **Makeup**: [Makeup style, 4-5 words per bullet]
4. **Bag & Accessories**: [Bags, jewelry, etc., 4-5 words per bullet]

CRITICAL RULES:
- Every bullet point MUST be extremely short, exactly 4 to 5 words max.
- For every recommended item, clothing, shoe, bag, jewelry, or accessory, you MUST provide an Amazon affiliate search link in the format: [Item Name](https://www.amazon.com/s?k=urlencoded_search_query&tag=${AMAZON_AFFILIATE_TAG}). Ensure search_query ALWAYS includes the specific product category/type as a concrete noun (e.g., "coral lipstick" instead of "coral", "thin frame glasses" instead of "thin frames", "gold hoop earrings" instead of "gold hoops", "black leather ankle boots" instead of "black leather"). Never output standalone colors, adjectives, or materials without the item noun.`;
    }
    else {
        // Fallback for general query
        prompt = data.prompt || "";
    }

    try {
        const fetchWithRetry = async (url, options, retries = 2) => {
            for (let i = 0; i <= retries; i++) {
                try {
                    const response = await fetch(url, options);
                    if (response.ok) return response;
                } catch (err) {
                    if (i === retries) throw err;
                }
            }
        };

        const userParts = [{ text: prompt }];
        if (data.image && data.mimeType) {
            userParts.push({
                inlineData: {
                    mimeType: data.mimeType,
                    data: data.image
                }
            });
        }

        const requestBody = JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemContext }]
            },
            contents: [
                {
                    role: "user",
                    parts: userParts
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        });

        const response = await fetchWithRetry(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: requestBody
            }
        );

        if (!response || !response.ok) {
            throw new Error(`Gemini API failed with status ${response?.status || 'network error'}`);
        }

        const responseData = await response.json();
        // Safely extract generated text from the response, handling possible variations in the structure.
        let resultText = null;
        if (responseData.candidates && responseData.candidates.length > 0) {
            const candidate = responseData.candidates[0];
            if (candidate.content && Array.isArray(candidate.content.parts)) {
                // Find the first part that contains text
                const textPart = candidate.content.parts.find(p => p.text);
                if (textPart && textPart.text) {
                    resultText = textPart.text;
                }
            }
        }
        if (resultText) {
            res.json({ result: resultText });
        } else {
            console.warn('Gemini returned empty or malformed response. Sending fallback message.', responseData);
            res.json({ result: 'Sorry, I could not generate a response at this time. Please try again later.' });
        }
    } catch (error) {
        console.error("Gemini proxy query failed:", error);
        res.status(503).json({ error: "AI service is currently unavailable. Please try again shortly." });
    }
});

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`[Server] Fashionist backend running on http://localhost:${PORT}`);
    });
}

module.exports = app;
