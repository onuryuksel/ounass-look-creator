export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, images } = req.body;
    
    const payload = {
      contents: [{
        parts: [
          { text: prompt },
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
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Image generation service failed');
    }

    const result = await response.json();
    const generatedImagePart = result?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);

    if (generatedImagePart && generatedImagePart.inlineData.data) {
      const base64Data = generatedImagePart.inlineData.data;
      res.json({ success: true, image: `data:image/png;base64,${base64Data}` });
    } else {
      throw new Error('Failed to retrieve image data');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}
