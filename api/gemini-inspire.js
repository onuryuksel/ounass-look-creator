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
    
    // Visual style options mapping
    const visualStyleDetails = {
      'cinematic': 'Shallow depth of field, natural light or directional cinematic lighting, filmic color grading, widescreen framing. Dramatic, storytelling, emotional mood.',
      'minimalist': 'Clean backgrounds, neutral or monochrome palettes, precise composition, negative space. Modern, understated elegance.',
      'high-gloss': 'Perfectly lit, sharp focus everywhere, bright and vibrant colors, retouched to perfection. Polished, premium, aspirational mood.',
      'dark-moody': 'Deep shadows, strong contrast, directional light from one side, rich dark tones. Mysterious, seductive, powerful mood.',
      'lifestyle': 'Real-life context (dining, travel, work), natural interactions, warm tones. Relatable luxury, "I want to live this life" mood.',
      'avant-garde': 'Unconventional angles, bold set design, surreal or experimental lighting. Creative, disruptive, memorable mood.',
      'vintage': 'Film grain, muted tones, warm color cast, retro styling. Nostalgic, romantic, timeless mood.',
      'hyper-real': 'Extreme detail, textures pop, high clarity, often focus stacking. Bold, high-impact, "luxury tech" vibe.',
      'documentary': 'Natural light, candid moments, less retouched but still composed. Authentic, insider access, exclusive mood.',
      'monochromatic': 'One dominant color in different shades, including product and background. Cohesive, sophisticated, visually striking mood.',
      'conceptual': 'Symbolism, metaphors, unusual objects paired with product. Thought-provoking, gallery-worthy mood.',
      'natural': 'Soft sunlight, earthy textures, natural props (stone, wood, foliage). Warm, grounded, artisan luxury mood.'
    };

    // Prepare user inputs for AI Art Director analysis
    const userInputsText = userInputs ? `
USER'S PREFERENCES (use these as foundation, but enhance and complete):
${userInputs.location ? `- Location preference: ${userInputs.location}` : '- Location: (not specified - you decide based on products)'}
${userInputs.mood ? `- Mood preference: ${userInputs.mood}` : '- Mood: (not specified - you decide based on products)'}
${userInputs.time ? `- Time preference: ${userInputs.time}` : '- Time: (not specified - you decide based on products)'}
${userInputs.extra ? `- Extra details: ${userInputs.extra}` : '- Extra details: (not specified - you decide based on products)'}
${userInputs.visualStyle ? `- Visual style preference: ${userInputs.visualStyle} (user selected this specific style)` : '- Visual style: (not specified - you choose the most suitable visual style based on products and scene)'}
` : `
USER'S PREFERENCES:
- Location: (not specified - you decide based on products)
- Mood: (not specified - you decide based on products)
- Time: (not specified - you decide based on products)
- Extra details: (not specified - you decide based on products)
- Visual style: (not specified - you choose the most suitable visual style based on products and scene)
`;

    const inspirationPrompt = `You are a world-class AI Art Director. Analyze the fashion products in these images and create scene settings for a lifestyle photoshoot.

ANALYZE THE PRODUCTS FIRST:
Study the clothing, shoes, accessories, colors, style, formality level, and overall aesthetic.

YOUR TASK:
${userInputsText}

CRITICAL INSTRUCTIONS:
1. **USER PREFERENCES ARE MANDATORY**: If user specified ANY preference, you MUST use it as the core foundation. DO NOT ignore or replace user inputs.
2. **ENHANCE, DON'T REPLACE**: When user provides input, ENHANCE and ENRICH it with professional details, but KEEP their core concept.
3. **RESPECT USER VISION**: If user says "café", enhance it to "elegant Parisian café" - don't change it to "museum" or "hotel".
4. **EMPTY FIELDS ONLY**: Only create completely new suggestions for fields the user left empty.
5. **COHESIVE ENHANCEMENT**: Make user preferences work together with professional luxury fashion standards.

RESPOND IN THIS EXACT FORMAT:

LOCATION: [If user provided location, ENHANCE their choice with luxury details. If empty, suggest iconic location based on products]

MOOD: [If user provided mood, ENRICH their vision with professional atmosphere. If empty, suggest mood based on products]  

TIME: [If user provided time, ENHANCE with lighting details. If empty, suggest time based on products]

DETAILS: [If user provided details, EXPAND with professional elements. If empty, suggest details based on products]

VISUAL_STYLE: [If user selected a visual style, USE IT and enhance with specific technical details. If empty, CHOOSE the most suitable style from: cinematic, minimalist, high-gloss, dark-moody, lifestyle, avant-garde, vintage, hyper-real, documentary, monochromatic, conceptual, natural]

LOCATION_SUMMARY: [4-5 word summary for form field]

MOOD_SUMMARY: [4-5 word summary for form field]

TIME_SUMMARY: [4-5 word summary for form field]

DETAILS_SUMMARY: [4-5 word summary for form field]

VISUAL_STYLE_SUMMARY: [4-5 word summary for form field]

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

LUXURY FASHION PHOTOGRAPHY INSPIRATION - Create imagery with the warmth, elegance and sophistication of:

ICONIC LUXURY BRANDS: Dior, Chanel, Hermès, Louis Vuitton - masters of visuals that echo craftsmanship and elegance. Think Pomellato's bold editorial style by legends like Gian Paolo Barbieri, Michel Comte, Horst P. Horst.

LEGENDARY PHOTOGRAPHERS TO EMULATE:
- Guy Bourdin: Cinematic, hyper-saturated compositions that transform imagery into vivid storytelling
- Simon Procter: Opulent, painterly images blending haute couture and fine art (Dior, McQueen, Montblanc)
- Philippe Robert: High-fashion elegance and editorial polish (Chanel, Dior, Louis Vuitton, Hermès)
- Viviane Sassen: Surreal, striking aesthetic (Bottega Veneta, Dior campaigns)
- Timothy Hogan: Master of dramatic lighting and sophisticated still-life
- Jarren Vink: Luxe specialist in jewelry, watches, perfumes with engaging warmth
- Joshua Caudwell: London-based perfume/fragrance expert (Tom Ford, Louis Vuitton, McQueen)

CREATE WARMTH, NOT COLDNESS: Avoid sterile, cold imagery. Instead create:
- Rich, luxurious atmosphere with emotional warmth
- Sophisticated lighting that feels inviting, not clinical
- Editorial elegance that tells a compelling story
- Craftsmanship appreciation with human connection
- Aspirational yet approachable luxury aesthetic

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
        // More precise extraction to avoid mixing content
        const pattern = new RegExp(`^${fieldName}:\\s*(.+?)(?=\\n\\n|\\n[A-Z_]+:|$)`, 'im');
        const match = aiResponse.match(pattern);
        let result = match ? match[1].trim() : '';
        
        // Clean up any summary tags that might have leaked in
        result = result.replace(/_SUMMARY:.*$/g, '').trim();
        
        return result;
      };
      
      const sceneSettings = {
        location: extractField('LOCATION'),
        mood: extractField('MOOD'),
        time: extractField('TIME'),
        details: extractField('DETAILS'),
        visualStyle: extractField('VISUAL_STYLE')
      };
      
      const shortSummaries = {
        location: extractField('LOCATION_SUMMARY'),
        mood: extractField('MOOD_SUMMARY'),
        time: extractField('TIME_SUMMARY'),
        details: extractField('DETAILS_SUMMARY'),
        visualStyle: extractField('VISUAL_STYLE_SUMMARY')
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
      
      // Clean scene settings from any potential summary contamination
      const cleanSceneSettings = {
        location: sceneSettings.location.replace(/LOCATION_SUMMARY:.*$/gi, '').trim(),
        mood: sceneSettings.mood.replace(/MOOD_SUMMARY:.*$/gi, '').trim(),
        time: sceneSettings.time.replace(/TIME_SUMMARY:.*$/gi, '').trim(),
        details: sceneSettings.details.replace(/DETAILS_SUMMARY:.*$/gi, '').trim(),
        visualStyle: sceneSettings.visualStyle.replace(/VISUAL_STYLE_SUMMARY:.*$/gi, '').trim()
      };
      
      // Create structured lifestyle prompt
      const structuredPrompt = `A photorealistic lifestyle photograph of a fashion model.

CRITICAL REQUIREMENT - PRODUCT PRESERVATION:
The model MUST wear the EXACT products from the provided reference images. These products are NOT to be used as inspiration - they are to be REPLICATED PERFECTLY with zero modifications.

PRODUCT SPECIFICATIONS:
[Products will be inserted here by the frontend]

SCENE SETTING:
Location: ${cleanSceneSettings.location || 'A stylish modern setting'}
Mood: ${cleanSceneSettings.mood || 'Sophisticated and elegant'}
Time of the day: ${cleanSceneSettings.time || 'Golden hour lighting'}
Details: ${cleanSceneSettings.details || 'Professional styling and composition'}

VISUAL STYLE:
${cleanSceneSettings.visualStyle || 'Natural, elegant luxury photography with professional lighting and composition'}

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
