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
    const { prompt } = req.body;
    
    console.log('--- RECEIVED TEXT GENERATION REQUEST ---');
    console.log('Prompt:', prompt);
    console.log('-----------------------------------------');
    
    const payload = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT"]
      }
    };
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // Use gemini-1.5-flash for text generation (faster and more cost-effective)
    const model = 'gemini-1.5-flash';
    
    console.log(`Using model: ${model} for text generation`);
    
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
    
    const textPart = result?.candidates?.[0]?.content?.parts?.find(p => p.text);
    
    if (textPart && textPart.text) {
      console.log(`Text generated successfully with model ${model}`);
      return res.json({ 
        success: true, 
        text: textPart.text,
        debug: { prompt } 
      });
    } else {
      console.log(`No text data found in response from model ${model}`);
      throw new Error(`No text data in response from ${model}`);
    }

  } catch (error) {
    console.error('Final error:', error);
    res.status(500).json({ error: error.message });
  }
}
