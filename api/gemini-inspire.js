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
    const { images } = req.body;
    
    console.log('--- PRODUCT-AWARE INSPIRATION REQUEST ---');
    console.log('IMAGE COUNT:', images?.length);
    console.log('----------------------------------------');
    
    const inspirationPrompt = `You are the world's most creative fashion photography art director. Analyze the fashion products shown in these images and create a PERFECT lifestyle scene concept that complements these specific items.

ANALYSIS TASK:
1. Study each product carefully (clothing, shoes, accessories, etc.)
2. Identify the style aesthetic (casual, formal, edgy, bohemian, etc.)
3. Consider the colors, textures, and overall vibe
4. Think about what lifestyle/occasion these products suit

SCENE CREATION TASK:
Create a complete lifestyle photoshoot concept with these 4 elements that PERFECTLY match the products:

1. LOCATION: A specific location that complements the product style and aesthetic
2. MOOD: The emotional atmosphere that matches the product vibe  
3. TIME/LIGHTING: Time of day and lighting that enhances the product colors/style
4. EXTRA DETAILS: Props, weather, activities, or situational elements that fit the products

REQUIREMENTS:
- Make the scene concept SPECIFICALLY suited to these exact products
- Consider the formality level, color palette, and style aesthetic
- Think about where someone wearing these items would naturally be
- Create visual harmony between products and environment
- Be creative but realistic and achievable for photography

OUTPUT FORMAT: Return EXACTLY in this JSON format:
{
  "location": "specific location description that matches the products",
  "mood": "mood and atmosphere that complements the style", 
  "time": "time of day and lighting that enhances the products",
  "extra": "additional elements that create perfect scene for these products"
}

Analyze the products and generate ONE perfect, product-matched lifestyle concept:`;

    const payload = {
      contents: [{
        parts: [
          { text: inspirationPrompt },
          ...images.map(base64Str => ({
            inlineData: {
              mimeType: "image/jpeg", 
              data: base64Str.split(',')[1]
            }
          }))
        ]
      }],
      generationConfig: {
        responseModalities: ["TEXT"]
      }
    };
    
    const apiKey = process.env.OunassLookCreator;
    if (!apiKey) {
      return res.status(500).json({ error: 'OunassLookCreator API key not configured' });
    }
    
    // Use the same vision model as image generation
    const model = 'gemini-2.5-flash-image-preview';
    
    console.log(`Using model: ${model} for product-aware inspiration`);
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('--- INSPIRATION RESPONSE ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('-------------------------');
    
    if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      const textPart = result.candidates[0].content.parts[0];
      
      console.log('--- PRODUCT-AWARE INSPIRATION SUCCESS ---');
      console.log('Generated inspiration text:', textPart.text);
      console.log('---------------------------------------');
      
      return res.json({ 
        success: true, 
        text: textPart.text,
        debug: { 
          imageCount: images?.length,
          model: model
        }
      });
    } else {
      console.error('No valid inspiration in response:', result);
      return res.status(500).json({ 
        error: 'No inspiration received from AI',
        debug: result
      });
    }
    
  } catch (error) {
    console.error('Product-aware inspiration error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate product-aware inspiration',
      details: error.message 
    });
  }
}
