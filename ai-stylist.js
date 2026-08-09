/**
 * Fashionist AI Stylist Engine
 * Integrates Google Gemini API and MediaPipe Computer Vision (Face Mesh / Pose)
 */
window.AIStylist = {
    // Returns the client's custom API key from settings if present, otherwise null.
    getApiKey() {
        const customKey = localStorage.getItem("customGeminiKey");
        return customKey || null;
    },

    async queryGemini(prompt, systemContext = "You are a senior luxury fashion stylist.", imageBase64 = null, mimeType = null) {
        const apiKey = this.getApiKey();
        if (apiKey) {
            try {
                return await this.queryGeminiClientSide(prompt, systemContext, imageBase64, mimeType);
            } catch (clientErr) {
                console.warn("[AIStylist] Client-side Gemini call failed, trying server proxy...", clientErr);
            }
        }
        return await this.queryGeminiServerProxy(prompt, systemContext, imageBase64, mimeType);
    },

    async queryGeminiServerProxy(prompt, systemContext, imageBase64 = null, mimeType = null) {
        this.log("Executing server proxy query via /api/analyze-style...");
        try {
            const response = await fetch('/api/analyze-style', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'general',
                    data: {
                        prompt: prompt,
                        systemContext: systemContext,
                        image: imageBase64,
                        mimeType: mimeType
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Server proxy error: Status ${response.status}`);
            }

            const data = await response.json();
            if (data.result) {
                return data.result;
            }
            if (data.error) {
                throw new Error(data.error);
            }
            throw new Error("Invalid response from server proxy");
        } catch (serverErr) {
            console.error("[AIStylist] Server proxy query failed:", serverErr);
            throw serverErr;
        }
    },

    // Debug flag for development; set to false in production
    debug: true,
    // Simple logger helper respecting the debug flag
    log(...args) { if (this.debug) console.log('[AIStylist]', ...args); },

    // Simple rate limiter to avoid hitting Gemini quota (minimum interval between calls)
    _lastGeminiCall: 0,
    _geminiMinInterval: 1200, // ms
    async fetchWithRetry(url, options, retries = 5) {
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        for (let attempt = 0; attempt <= retries; attempt++) {
            // Enforce minimum interval between Gemini calls
            const now = Date.now();
            const elapsed = now - this._lastGeminiCall;
            if (elapsed < this._geminiMinInterval) {
                await delay(this._geminiMinInterval - elapsed);
            }
            try {
                const response = await fetch(url, options);
                this._lastGeminiCall = Date.now();
                if (!response.ok) {
                    // Retry on transient errors and rate limiting
                    if ((response.status === 503 || response.status === 504 || response.status === 429) && attempt < retries) {
                        let backoff = Math.pow(2, attempt) * 500;
                        if (response.status === 429) {
                            const retryAfter = response.headers.get('Retry-After');
                            if (retryAfter) {
                                const secs = parseInt(retryAfter, 10);
                                if (!isNaN(secs)) backoff = secs * 1000;
                            }
                        }
                        console.warn(`Gemini ${response.status} – retry ${attempt + 1}/${retries} after ${backoff}ms`);
                        await delay(backoff);
                        continue;
                    }
                    throw new Error(`Gemini API Error: Status ${response.status}`);
                }
                return response;
            } catch (err) {
                if (attempt < retries) {
                    const backoff = Math.pow(2, attempt) * 500;
                    console.warn(`Fetch error (${err.message}) – retry ${attempt + 1}/${retries} after ${backoff}ms`);
                    await delay(backoff);
                } else {
                    throw err;
                }
            }
        }
        throw new Error('Exhausted all retries for Gemini request');
    },

    async queryGeminiClientSide(prompt, systemContext, imageBase64 = null, mimeType = null) {
        const apiKey = this.getApiKey();
        const models = [
            "gemini-3.1-flash-lite",
            "gemini-flash-lite-latest",
            "gemini-2.5-flash",
            "gemini-2.0-flash"
        ];
        
        const userParts = [{ text: prompt }];
        if (imageBase64 && mimeType) {
            userParts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                }
            });
        }

        const requestBody = JSON.stringify({
            systemInstruction: {
                parts: [{ text: systemContext }]
            },
            contents: [
                { role: "user", parts: userParts }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096
            }
        });

        for (const modelName of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
            try {
                this.log(`Attempting query with model: ${modelName}`);
                let response = await this.fetchWithRetry(url, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: requestBody
                }, 2); // 2 retries per model

                if (!response.ok) {
                    throw new Error(`Gemini API Error: Status ${response.status}`);
                }

                const data = await response.json();
                if (!data.candidates || data.candidates.length === 0) {
                    throw new Error("Gemini response missing candidates");
                }
                const firstCandidate = data.candidates[0];
                const text = firstCandidate.content && firstCandidate.content.parts && firstCandidate.content.parts.length > 0
                    ? firstCandidate.content.parts[0].text
                    : null;
                
                if (text) {
                    this.log(`Model ${modelName} succeeded!`);
                    return text;
                }
                throw new Error("Model returned empty text candidate");
            } catch (err) {
                console.warn(`[AIStylist] Model ${modelName} failed: ${err.message}. Falling back to next model...`);
            }
        }

        // Fallback generic advice if all models fail completely
        console.error("[AIStylist] All Gemini models failed to respond.");
        throw new Error("All styling models are currently experiencing high demand. Please try again in a few moments.");
    },

    getBaseSystemInstruction() {
        return `SYSTEM INSTRUCTION — JSON OUTPUT FIX

You are generating data for a production application.

Your response will be parsed automatically using \`JSON.parse()\`.

CRITICAL RULES:

* Return ONLY valid JSON.
* Do NOT use Markdown.
* Do NOT wrap the response in code blocks.
* Do NOT include explanations, notes, comments, or introductory text.
* Do NOT include trailing commas.
* Do NOT include placeholders such as "N/A", "TBD", or "...".
* The first character of your response MUST be \`{\`.
* The last character of your response MUST be \`}\`.
* Every key defined in the schema MUST always exist.
* Never rename keys.
* Never omit keys.
* Never return empty arrays.
* All arrays must contain at least one item.
* Every recommendation item must be a string.
* Maximum length per recommendation item: 5 words.
* Use double quotes (\`"\`), never single quotes.
* If information is unavailable, generate the best possible recommendation instead of leaving fields empty.

Before sending the response, validate internally that:
1. The response is valid JSON.
2. All required keys exist.
3. No array is empty.
4. No key names differ from the schema.
5. No markdown or extra text exists outside the JSON object.

AFFILIATE PRODUCT RULES:
Whenever recommending items, format the string inside the array EXACTLY as "Product Name | $Price | Affiliate URL". If no URL exists, use "Product Name | $Price | null".`;
    },

    async queryFaceStylist(shape, ratios, skinColorHex) {
        // Build analysis context dynamically — only include available fields
        let analysisContext = `Face shape: ${shape}`;
        if (ratios?.lengthToWidth) analysisContext += `, Length/Width ratio: ${ratios.lengthToWidth}`;
        if (ratios?.jawToCheek) analysisContext += `, Jaw/Cheek ratio: ${ratios.jawToCheek}`;
        if (skinColorHex && skinColorHex !== 'null' && skinColorHex !== 'undefined') {
            analysisContext += `, Skin color: ${skinColorHex}`;
        }

        // Build schema dynamically — always include shape-based recommendations
        // Only include color analysis if skin tone data exists
        const hasSkinTone = skinColorHex && skinColorHex !== 'null' && skinColorHex !== 'undefined';

        let schemaFields = '';
        let minimums = '';
        if (hasSkinTone) {
            schemaFields = `"tone": "",
"bestColors": [""],
"colorsToAvoid": [""],
"bestMetalTones": [""],
"bestHaircuts": [""],
"bestHairstyles": [""],
"bestHairColors": [""],
"hairColorsToAvoid": [""],
"bestGlasses": [""],
"framesToAvoid": [""],
"bestLipstickShades": [""],
"bestBlushShades": [""],
"bestEyeMakeup": [""],
"bestContourStyle": [""],
"bestEarrings": [""],
"bestNecklines": [""],
"bestNecklaces": [""],
"bestHeadwear": [""]`;
            minimums = `Minimum recommendations:
* Best Colors: 8
* Colors To Avoid: 5
* Best Haircuts: 8
* Best Hairstyles: 6
* Best Hair Colors: 6
* Hair Colors To Avoid: 4
* Best Glasses: 6
* Frames To Avoid: 4`;
        } else {
            schemaFields = `"bestHaircuts": [""],
"bestHairstyles": [""],
"bestGlasses": [""],
"framesToAvoid": [""],
"bestEarrings": [""],
"bestNecklines": [""],
"bestNecklaces": [""],
"bestHeadwear": [""]`;
            minimums = `Minimum recommendations:
* Best Haircuts: 8
* Best Hairstyles: 6
* Best Glasses: 6
* Frames To Avoid: 4

Note: Skin tone data is not available. Skip tone, color, and makeup analysis. Focus on face shape recommendations.`;
        }

        const prompt = `${this.getBaseSystemInstruction()}

---
# TASK: FACE ANALYSIS
Analyze: ${analysisContext}.
Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"faceAnalysis": {
${schemaFields}
}
}

${minimums}`;
        return this.queryGemini(prompt);
    },

    async queryBodyStylist(shape, ratios, measurements = null) {
        const prompt = `${this.getBaseSystemInstruction()}

---
# TASK: BODY ANALYSIS
Analyze: Body silhouette ${shape} with shoulder-to-hip ratio ${ratios.shoulderToHip}.
Generate recommendations only for the active section requested.

REQUIRED JSON SCHEMA:
{
"bodyAnalysis": {
"bodyShape": "",
"recommendedClothes": [""],
"clothesToAvoid": [""],
"bestFabrics": [""],
"fabricsToAvoid": [""]
}
}

Minimum recommendations:
* Recommended Clothes: 10
* Clothes To Avoid: 5
* Best Fabrics: 6
* Fabrics To Avoid: 4`;
        return this.queryGemini(prompt);
    },

    async queryEventStylist(eventType) {
        const prompt = `Curate a detailed luxury outfit look for attending a ${eventType} event. Include clothing, footwear, accessories, hair, and makeup suggestions in polished markdown.`;
        return this.queryGemini(prompt);
    },

    /**
     * Run MediaPipe FaceMesh on an Image element
     * Returns face shape parameters and landmark points
     */
    async detectFaceLandmarks(imageElement) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            // Setup timeout
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error("MediaPipe FaceMesh analysis timed out. The model may take longer to download on slower connections."));
                }
            }, 45000); // Increased timeout to 45 seconds for model downloading

            const faceMesh = new FaceMesh({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
            });

            faceMesh.setOptions({
                maxNumFaces: 1,
                refineLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            faceMesh.onResults((results) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeout);
                
                if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                    resolve(results.multiFaceLandmarks[0]);
                } else {
                    reject(new Error("No face detected in the image. Please upload a clear front-facing portrait."));
                }
                // Cleanup
                faceMesh.close();
            });

            // Send image
            faceMesh.send({ image: imageElement }).catch(err => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        });
    },

    /**
     * Classifies face shape using mathematical coordinate ratios
     */
    calculateFaceShape(landmarks) {
        // Landmarks: 468 3D points
        // Landmark 10: Top of forehead
        // Landmark 152: Bottom of chin
        // Landmark 234: Left cheek contour edge
        // Landmark 454: Right cheek contour edge
        // Landmark 58: Left jaw point
        // Landmark 288: Right jaw point

        const distance = (p1, p2) => {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        };

        const len = distance(landmarks[10], landmarks[152]);
        const width = distance(landmarks[234], landmarks[454]);
        const jawWidth = distance(landmarks[58], landmarks[288]);

        const ratioLengthToWidth = len / width;
        const ratioJawToCheek = jawWidth / width;

        console.log("Face Analysis Ratios:", { ratioLengthToWidth, ratioJawToCheek });

        let shape = "Oval"; // Default
        if (ratioLengthToWidth < 1.2) {
            shape = ratioJawToCheek > 0.85 ? "Square" : "Round";
        } else if (ratioLengthToWidth > 1.45) {
            shape = "Oblong";
        } else {
            // Heart shapes typically have wide cheekbones/forehead tapering to sharp chin
            // Landmark 103 (left forehead) to 332 (right forehead)
            const foreheadWidth = distance(landmarks[103], landmarks[332]);
            if (foreheadWidth > jawWidth * 1.15) {
                shape = "Heart";
            }
        }

        return {
            shape,
            ratios: {
                lengthToWidth: ratioLengthToWidth.toFixed(2),
                jawToCheek: ratioJawToCheek.toFixed(2)
            }
        };
    },
    // --- Skin tone extraction (average RGB from cheek region) ---
    getSkinColorHex(imageElement, landmarks) {
        // Choose a cheek landmark (right cheek: 234) and a neighboring point for averaging
        const pt = landmarks[234]; // right cheek
        if (!pt) return null;
        // Create temporary canvas to read pixel data
        const canvas = document.createElement('canvas');
        canvas.width = imageElement.width;
        canvas.height = imageElement.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imageElement, 0, 0);
        // Sample a small 5x5 block around the point
        const x = Math.floor(pt.x * imageElement.width);
        const y = Math.floor(pt.y * imageElement.height);
        const size = 5;
        const imgData = ctx.getImageData(x - size/2, y - size/2, size, size).data;
        let r = 0, g = 0, b = 0;
        const pixels = imgData.length / 4;
        for (let i = 0; i < imgData.length; i += 4) {
            r += imgData[i];
            g += imgData[i+1];
            b += imgData[i+2];
        }
        r = Math.round(r / pixels);
        g = Math.round(g / pixels);
        b = Math.round(b / pixels);
        // Convert to hex string
        const toHex = c => c.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    },
    async detectPoseLandmarks(imageElement) {
        return new Promise((resolve, reject) => {
            let resolved = false;
            const timeout = setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    reject(new Error("MediaPipe Pose analysis timed out."));
                }
            }, 10000);

            const pose = new Pose({
                locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
            });

            pose.setOptions({
                modelComplexity: 1,
                smoothLandmarks: true,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            pose.onResults((results) => {
                if (resolved) return;
                resolved = true;
                clearTimeout(timeout);

                if (results.poseLandmarks) {
                    resolve(results.poseLandmarks);
                } else {
                    reject(new Error("No full-body posture detected. Make sure your entire body is visible in the photo."));
                }
                pose.close();
            });

            pose.send({ image: imageElement }).catch(err => {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    reject(err);
                }
            });
        });
    },

    /**
     * Classifies body silhouette shape based on pose coordinates
     */
    calculateBodyShape(landmarks, manualWaist = null) {
        // Left Shoulder: 11, Right Shoulder: 12
        // Left Hip: 23, Right Hip: 24
        const distance = (p1, p2) => {
            return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        };

        const shoulderWidth = distance(landmarks[11], landmarks[12]);
        const hipWidth = distance(landmarks[23], landmarks[24]);

        const ratioShouldersToHips = shoulderWidth / hipWidth;
        console.log("Body Analysis Ratios:", { ratioShouldersToHips });

        let shape = "Rectangle"; // Default
        if (ratioShouldersToHips > 1.08) {
            shape = "Inverted Triangle"; // Shoulders much broader
        } else if (ratioShouldersToHips < 0.92) {
            shape = "Triangle (Pear)"; // Hips much broader
        } else {
            // Check if waist is narrower than shoulders and hips
            // If user inputted a manual waist or we estimate
            if (manualWaist) {
                // If they supplied measurements
                const waistRatio = manualWaist / Math.max(shoulderWidth, hipWidth);
                shape = waistRatio < 0.85 ? "Hourglass" : "Rectangle";
            } else {
                // Standard pose coordinate estimation: Hourglass vs Rectangle
                shape = "Hourglass"; // Visual silhouette suggestion
            }
        }

        return {
            shape,
            ratios: {
                shoulderToHip: ratioShouldersToHips.toFixed(2)
            }
        };
    }
};
