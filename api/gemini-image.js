export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, images } = req.body;
    
    // --- CRITICAL RULE INJECTION ---
    const finalPrompt = `${prompt}. IMPORTANT: The products in the images provided MUST be used exactly as they are. Do not alter, modify, or replace any product details, shapes, or colors. Replicate them perfectly in the final image.`;
    // --- END CRITICAL RULE INJECTION ---

    console.log('--- RECEIVED IMAGE GENERATION REQUEST ---');
    console.log('Original Prompt:', prompt);
    console.log('Final Injected Prompt:', finalPrompt);
    console.log('IMAGE COUNT:', images?.length);
    console.log('-----------------------------------------');
    
    console.log('Image generation request received:', {
      promptLength: prompt?.length,
      imageCount: images?.length,
      firstImagePreview: images?.[0]?.substring(0, 50) + '...'
    });
    
    const payload = {
      contents: [{
        parts: [
          { text: finalPrompt }, // Use the modified prompt
          ...images.map(base64Str => ({
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Str.split(',')[1]
            }
          }))
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"]
      }
    };
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Use only gemini-2.5-flash-image-preview model
    const model = 'gemini-2.5-flash-image-preview';
    
    console.log(`Using model: ${model}`);
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    // Add retry logic with exponential backoff for rate limiting
    let response;
    const retries = 3;
    let delay = 1000;

    for (let i = 0; i < retries; i++) {
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 429 && i < retries - 1) {
        console.log(`Rate limit hit (429). Retrying in ${delay / 1000}s... (Attempt ${i + 1}/${retries})`);
        await new Promise(res => setTimeout(res, delay));
        delay *= 2; // Exponential backoff
      } else {
        break; // Break loop on success or non-retriable error
      }
    }

    console.log(`Model ${model} final response status:`, response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`Model ${model} error response:`, errorText);
      throw new Error(`Model ${model} failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`Model ${model} success response:`, JSON.stringify(result, null, 2));
    
    // Check if this is a text-only request (no images provided)
    const isTextOnlyRequest = !images || images.length === 0;
    
    if (isTextOnlyRequest) {
      // Handle text-only response (for art director enhancement)
      const textPart = result?.candidates?.[0]?.content?.parts?.find(p => p.text);
      
      if (textPart && textPart.text) {
        console.log(`Text generated successfully with model ${model}`);
        return res.json({ 
          success: true, 
          text: textPart.text,
          debug: { finalPrompt } 
        });
      } else {
        console.log(`No text data found in response from model ${model}`);
        throw new Error(`No text data in response from ${model}`);
      }
    } else {
      // Handle image generation response (existing logic)
      const generatedImagePart = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

      if (generatedImagePart && generatedImagePart.inlineData.data) {
        const base64Data = generatedImagePart.inlineData.data;
        console.log(`Image generated successfully with model ${model}`);
        // Return the final prompt along with the image for debugging transparency
        return res.json({ 
          success: true, 
          image: `data:image/png;base64,${base64Data}`,
          debug: { finalPrompt } 
        });
      } else {
        console.log(`No image data found in response from model ${model}`);
        throw new Error(`No image data in response from ${model}`);
      }
    }

  } catch (error) {
    console.error('Final error:', error);
    res.status(500).json({ error: error.message });
  }
}
