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
    const { images, userInputs } = req.body;
    
    console.log('--- LIFESTYLE PROMPT GENERATION REQUEST ---');
    console.log('IMAGE COUNT:', images?.length);
    console.log('USER INPUTS:', userInputs);
    console.log('------------------------------------------');
    
    // Prepare user inputs for AI Art Director analysis
    const userInputsText = userInputs ? `
USER'S PREFERENCES (use these as foundation, but enhance and complete):
${userInputs.location ? `- Location preference: ${userInputs.location}` : '- Location: (not specified - you decide based on products)'}
${userInputs.mood ? `- Mood preference: ${userInputs.mood}` : '- Mood: (not specified - you decide based on products)'}
${userInputs.time ? `- Time preference: ${userInputs.time}` : '- Time: (not specified - you decide based on products)'}
${userInputs.extra ? `- Extra details: ${userInputs.extra}` : '- Extra details: (not specified - you decide based on products)'}
` : `
USER'S PREFERENCES:
- Location: (not specified - you decide based on products)
- Mood: (not specified - you decide based on products)
- Time: (not specified - you decide based on products)
- Extra details: (not specified - you decide based on products)
`;

    const inspirationPrompt = `You are a world-class AI Art Director. Analyze the fashion products in these images and create scene settings for a lifestyle photoshoot.

ANALYZE THE PRODUCTS FIRST:
Study the clothing, shoes, accessories, colors, style, formality level, and overall aesthetic.

YOUR TASK:
${userInputsText}

INSTRUCTIONS:
1. For fields where user specified preferences: RESPECT their choice but ENHANCE and ENRICH it with professional details
2. For empty fields: CREATE appropriate suggestions based on the fashion products shown
3. Make all recommendations cohesive and suitable for the product style
4. Be specific and detailed - avoid generic answers

RESPOND IN THIS EXACT FORMAT:

LOCATION: [Your detailed answer - if user specified location, enhance it; if not, suggest based on products]
MOOD: [Your detailed answer - if user specified mood, enrich it; if not, suggest based on products]  
TIME: [Your detailed answer - if user specified time, enhance it; if not, suggest based on products]
DETAILS: [Your detailed answer - if user specified details, expand them; if not, suggest based on products]

REQUIREMENTS:
- Be highly specific and detailed
- Make it suitable for luxury fashion photography
- Consider the product colors, style, and formality
- Create Instagram-worthy, aspirational content
- Ensure all 4 fields work together cohesively

Analyze the products and respond now:`;

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
      const aiResponse = textPart.text;
      
      console.log('--- AI ART DIRECTOR RESPONSE ---');
      console.log('Raw response:', aiResponse);
      console.log('-------------------------------');
      
      // Parse AI Art Director response
      const extractField = (fieldName) => {
        const pattern = new RegExp(`${fieldName}:\\s*(.+?)(?=\\n[A-Z]+:|$)`, 'is');
        const match = aiResponse.match(pattern);
        return match ? match[1].trim() : '';
      };
      
      const sceneSettings = {
        location: extractField('LOCATION'),
        mood: extractField('MOOD'),
        time: extractField('TIME'),
        details: extractField('DETAILS')
      };
      
      console.log('--- EXTRACTED SCENE SETTINGS ---');
      console.log('Location:', sceneSettings.location);
      console.log('Mood:', sceneSettings.mood);
      console.log('Time:', sceneSettings.time);
      console.log('Details:', sceneSettings.details);
      console.log('--------------------------------');
      
      // Create structured lifestyle prompt
      const structuredPrompt = `A photorealistic lifestyle photograph of a fashion model.

CRITICAL REQUIREMENT - PRODUCT PRESERVATION:
The model MUST wear the EXACT products from the provided reference images. These products are NOT to be used as inspiration - they are to be REPLICATED PERFECTLY with zero modifications.

PRODUCT SPECIFICATIONS:
[Products will be inserted here by the frontend]

SCENE SETTING:
Location: ${sceneSettings.location || 'A stylish modern setting'}
Mood: ${sceneSettings.mood || 'Sophisticated and elegant'}
Time of the day: ${sceneSettings.time || 'Golden hour lighting'}
Details: ${sceneSettings.details || 'Professional styling and composition'}

FINAL INSTRUCTION:
Copy the products pixel-perfect. Do not create variations. Do not interpret. Do not stylize. REPLICATE EXACTLY as provided.`;
      
      console.log('--- STRUCTURED PROMPT CREATED ---');
      console.log('Final prompt:', structuredPrompt);
      console.log('--------------------------------');
      
      return res.json({ 
        success: true, 
        prompt: structuredPrompt,
        sceneSettings: sceneSettings,
        debug: { 
          imageCount: images?.length,
          model: model,
          rawResponseLength: aiResponse.length,
          userInputsProvided: Object.keys(userInputs || {}).filter(key => userInputs[key]?.trim()).length
        }
      });
    } else {
      console.error('No valid response from AI Art Director:', result);
      return res.status(500).json({ 
        error: 'No scene settings generated by AI Art Director',
        debug: result
      });
    }
    
  } catch (error) {
    console.error('Lifestyle prompt generation error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate lifestyle prompt',
      details: error.message 
    });
  }
}
