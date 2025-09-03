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
    
    const inspirationPrompt = `You are a world-class fashion photography art director. Analyze the fashion products in these images and answer these 4 specific questions to create the perfect lifestyle scene:

ANALYZE THE PRODUCTS:
Study the clothing, shoes, accessories, colors, style, formality level, and overall aesthetic of the products shown.

NOW ANSWER THESE 4 QUESTIONS SPECIFICALLY:

1. WHAT IS THE LOCATION?
   - Where would someone wearing these specific products naturally be?
   - Consider: indoor/outdoor, urban/nature, formal/casual venues
   - Be specific: "rooftop terrace" not just "outdoors"

2. WHAT IS THE MOOD?
   - What emotional atmosphere matches these products?
   - Consider: elegant, edgy, relaxed, confident, romantic, etc.
   - Think about the energy and feeling the products convey

3. WHAT IS THE TIME OF THE DAY?
   - What time and lighting would best showcase these products?
   - Consider: morning light, golden hour, evening, noon, blue hour
   - Think about how lighting affects the product colors and textures

4. WHAT ARE THE FURTHER DETAILS ABOUT THE SCENE?
   - What additional elements, props, activities, or atmosphere details?
   - Consider: weather, activities, props, background elements
   - What would complete this perfect lifestyle moment?

REQUIREMENTS:
- Answer based on the SPECIFIC products you see
- Be creative but realistic for photography
- Ensure all elements work together harmoniously
- Make it aspirational but achievable

OUTPUT FORMAT: Return EXACTLY in this JSON format:
{
  "location": "your specific answer to question 1",
  "mood": "your specific answer to question 2", 
  "time": "your specific answer to question 3",
  "extra": "your specific answer to question 4"
}

Answer these 4 questions based on the products shown:`;

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
