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

    // System instruction demanding warm, supportive, and body-positive styling feedback
    const systemContext = `You are a high-end luxury personal stylist director.
IMPORTANT: You MUST use empowering, warm, supportive, and body-positive language at all times.
Never criticize physical proportions or face dimensions; instead, focus on how to highlight, accent, and celebrate the user's features.
Present recommendations in beautiful, clean structure. Use list formats and bold headers.`;

    let prompt = "";

    if (type === 'face') {
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
- For every color, haircut, glasses shape, hair color, or earrings recommendation, you MUST provide an Amazon affiliate search link in the exact format: [Item Name](https://www.amazon.com/s?k=urlencoded+keywords&tag=fashionist0a-20). Ensure the affiliate tag '&tag=fashionist0a-20' is present at the end.
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
- For every clothing item, accessory, or fabric recommendation, you MUST provide an Amazon affiliate search link in the exact format: [Item Name](https://www.amazon.com/s?k=urlencoded+keywords&tag=fashionist0a-20). Ensure the affiliate tag '&tag=fashionist0a-20' is present at the end.
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
- For every recommended item, clothing, shoe, bag, jewelry, or accessory, you MUST provide an Amazon affiliate search link in the exact format: [Item Name](https://www.amazon.com/s?k=urlencoded+keywords&tag=fashionist0a-20). Ensure the affiliate tag '&tag=fashionist0a-20' is present at the end.`;
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
                maxOutputTokens: 1024
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
