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
   - BE VERY SPECIFIC: Include city/country and iconic landmarks when relevant
   - Examples: "Rooftop terrace overlooking the Eiffel Tower in Paris", "Modern café in Soho, New York", "Burj Khalifa's observation deck in Dubai"
   - Consider famous locations that match the product style: luxury hotels, iconic buildings, renowned districts
   - Think globally: Paris, London, Tokyo, Dubai, Milan, New York, etc.

2. WHAT IS THE MOOD?
   - DESCRIBE THE ATMOSPHERE IN DETAIL (2-3 sentences)
   - Don't just say "elegant" - explain what makes it elegant
   - Examples: "Sophisticated Parisian chic with an air of effortless confidence", "Edgy urban energy with a rebellious yet refined attitude"
   - Include the emotional experience, body language, and overall vibe

3. WHAT IS THE TIME OF THE DAY?
   - What time and lighting would best showcase these products?
   - Consider: morning light, golden hour, evening, noon, blue hour
   - Think about how lighting affects the product colors and textures

4. WHAT ARE THE FURTHER DETAILS ABOUT THE SCENE?
   - What additional elements, props, activities, or atmosphere details?
   - Consider: weather, activities, props, background elements
   - What would complete this perfect lifestyle moment?

REQUIREMENTS:
- BE HIGHLY SPECIFIC AND DETAILED in every answer
- Location must include city/country and famous landmarks or districts
- Mood must be 2-3 descriptive sentences, not just one word
- Consider the product colors, style, and formality level
- Make it aspirational and Instagram-worthy
- Think of locations that fashion influencers would choose

INSPIRATION EXAMPLES FOR REFERENCE:
- Casual streetwear → "Trendy coffee shop in Brooklyn's DUMBO with Manhattan Bridge backdrop"
- Elegant evening wear → "Private terrace at Hotel George V overlooking Champs-Élysées in Paris"
- Sporty chic → "Modern rooftop gym in Tokyo's Shibuya district with city skyline views"

Answer these 4 questions clearly and in detail based on the products shown:

1. LOCATION: [Your detailed answer about where]
2. MOOD: [Your detailed answer about the atmosphere] 
3. TIME: [Your detailed answer about when]
4. EXTRA: [Your detailed answer about additional details]`;

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
      console.log('Generated inspiration text (length:', textPart.text?.length, '):', textPart.text);
      console.log('Text complete?', textPart.text?.includes('}'));
      console.log('---------------------------------------');
      
      // Check if response is truncated
      if (!textPart.text?.includes('}')) {
        console.warn('⚠️ WARNING: Response appears to be truncated - missing closing brace');
      }
      
      return res.json({ 
        success: true, 
        text: textPart.text,
        debug: { 
          imageCount: images?.length,
          model: model,
          textLength: textPart.text?.length,
          isComplete: textPart.text?.includes('}')
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
