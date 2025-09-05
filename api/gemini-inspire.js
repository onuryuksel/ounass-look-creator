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
LOCATION_SUMMARY: [4-5 word summary for form field]

MOOD: [Your detailed answer - if user specified mood, enrich it; if not, suggest based on products]  
MOOD_SUMMARY: [4-5 word summary for form field]

TIME: [Your detailed answer - if user specified time, enhance it; if not, suggest based on products]
TIME_SUMMARY: [4-5 word summary for form field]

DETAILS: [Your detailed answer - if user specified details, expand them; if not, suggest based on products]
DETAILS_SUMMARY: [4-5 word summary for form field]

REQUIREMENTS:
- Be highly specific and detailed
- Make it suitable for luxury fashion photography
- Consider the product colors, style, and formality
- Create Instagram-worthy, aspirational content
- Ensure all 4 fields work together cohesively

CRITICAL FOR LOCATIONS - You are a world-class fashion art director. This is a LUXURY BRAND fashion shoot - choose ICONIC locations that match the product sophistication:

Consider these categories (examples provided, but use your expertise to choose the perfect location):

ICONIC CITIES: Paris, Milan, NYC, London, Tokyo, Dubai, Los Angeles, Hong Kong, Rome, Istanbul, Barcelona, Marrakech, Vienna, Cape Town, Sydney

ICONIC OUTDOOR LOCATIONS: Santorini cliffs, Amalfi Coast, Central Park NYC, Dubai Desert, Jardin des Tuileries Paris, Cinque Terre, Shibuya Crossing, Lake Como, Cappadocia, Joshua Tree, Swiss Alps

ICONIC HOTELS: Ritz Paris, Burj Al Arab Dubai, Plaza Athénée Paris, Peninsula Hong Kong, Aman Tokyo, Gritti Palace Venice, Beverly Hills Hotel, La Mamounia Marrakech

ICONIC RESTAURANTS: Noma Copenhagen, Cipriani Venice, Le Jules Verne Paris, Zuma Dubai, Caviar Kaspia Paris, Nobu Malibu, Sketch London

ICONIC MONUMENTS: Eiffel Tower, Colosseum, Statue of Liberty, Burj Khalifa, Taj Mahal, Big Ben, Arc de Triomphe, Sagrada Familia

ICONIC SQUARES: Times Square, Piazza San Marco Venice, Place Vendôme Paris, Trafalgar Square London, Red Square Moscow

ICONIC INTERIORS: Versailles Hall of Mirrors, Louvre galleries, Met Museum NYC, Milan Cathedral, Royal Opera House London

ICONIC BRIDGES: Pont Alexandre III Paris, Brooklyn Bridge NYC, Golden Gate Bridge, Tower Bridge London, Rialto Bridge Venice

ICONIC BEACHES: Bondi Beach, Whitehaven Beach, Seychelles, Malibu Beach, Navagio Beach Greece

ICONIC SHOPPING: Champs-Élysées, Rodeo Drive, Bond Street, Ginza Tokyo, Via Montenapoleone Milan, Fifth Avenue NYC

ICONIC ROOFTOPS: Sky Garden London, The Roof NYC, Cé La Vie Singapore, View at The Palm Dubai

ICONIC VIEWPOINTS: Top of the Rock NYC, Montmartre Paris, The Peak Hong Kong, Table Mountain Cape Town

WINTER LOCATIONS: St. Moritz, Aspen, Courchevel, Zermatt, Lapland Northern Lights

Use your fashion expertise to select the most suitable iconic location. These are just examples - choose any world-renowned location that creates stunning luxury fashion imagery matching the product style and mood.

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
      
      const shortSummaries = {
        location: extractField('LOCATION_SUMMARY'),
        mood: extractField('MOOD_SUMMARY'),
        time: extractField('TIME_SUMMARY'),
        details: extractField('DETAILS_SUMMARY')
      };
      
      console.log('--- EXTRACTED SCENE SETTINGS ---');
      console.log('Location (full):', sceneSettings.location);
      console.log('Location (summary):', shortSummaries.location);
      console.log('Mood (full):', sceneSettings.mood);
      console.log('Mood (summary):', shortSummaries.mood);
      console.log('Time (full):', sceneSettings.time);
      console.log('Time (summary):', shortSummaries.time);
      console.log('Details (full):', sceneSettings.details);
      console.log('Details (summary):', shortSummaries.details);
      console.log('------------------------------------------------');
      
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
        sceneSettings: sceneSettings, // Full details for prompt
        shortSummaries: shortSummaries, // Short summaries for form fields
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
