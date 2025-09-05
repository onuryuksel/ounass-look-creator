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
    
    // Build scene setting from user inputs
    let sceneSettings = [];
    if (userInputs.location) sceneSettings.push(`Location: ${userInputs.location}`);
    if (userInputs.mood) sceneSettings.push(`Mood: ${userInputs.mood}`);
    if (userInputs.time) sceneSettings.push(`Time: ${userInputs.time}`);
    if (userInputs.extra) sceneSettings.push(`Extra details: ${userInputs.extra}`);
    
    const sceneSettingText = sceneSettings.length > 0 
      ? `\nSCENE SETTING (from user inputs):\n${sceneSettings.join('\n')}\n`
      : '';
    
    const inspirationPrompt = `You are a professional fashion photographer and creative director. Create a complete lifestyle photoshoot prompt based on the fashion products in these images.

ANALYZE THE PRODUCTS:
Study the clothing, shoes, accessories, colors, style, formality level, and overall aesthetic of the products shown.
${sceneSettingText}
TASK: Generate a complete, professional lifestyle photoshoot prompt that incorporates the user's scene preferences above. The prompt should be ready to use for AI image generation.

STRUCTURE YOUR RESPONSE AS A COMPLETE PROMPT:
- Start with "A lifestyle photoshoot featuring..."
- Include detailed scene description using the user's inputs
- Describe the model and styling  
- Specify lighting and photography style
- Add atmospheric details
- End with quality modifiers

REQUIREMENTS:
- Use the user's scene settings as the foundation
- Make it professional and detailed
- Include specific photographic terms
- Make it suitable for AI image generation
- Incorporate all the fashion products shown
- Create aspirational, high-end fashion imagery

Generate a complete lifestyle photoshoot prompt now:`;

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
      
      console.log('--- LIFESTYLE PROMPT GENERATION SUCCESS ---');
      console.log('Generated prompt (length:', textPart.text?.length, '):', textPart.text);
      console.log('-------------------------------------------');
      
      return res.json({ 
        success: true, 
        prompt: textPart.text,
        debug: { 
          imageCount: images?.length,
          model: model,
          promptLength: textPart.text?.length,
          userInputsUsed: Object.keys(userInputs || {}).length
        }
      });
    } else {
      console.error('No valid prompt in response:', result);
      return res.status(500).json({ 
        error: 'No lifestyle prompt generated',
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
