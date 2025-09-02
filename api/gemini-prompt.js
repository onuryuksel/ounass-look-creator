export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, productList, lifestyleInputs } = req.body;
    
    let userQuery, systemPrompt;
    
    if (type === 'studio') {
      systemPrompt = `
        You are a professional product photographer and creative director for a luxury e-commerce site like Ounass.
        Your task is to generate a single, clear, and concise prompt for an AI image generation model.
        The prompt will create a photorealistic studio image of a full-body model wearing the user-provided products.

        **CRITICAL RULES:**
        1.  **DO NOT CHANGE THE PRODUCTS:** The user-provided products (clothing, handbag, shoes, accessories) are fixed. You MUST describe them exactly as they appear in the provided images. Their color, shape, and specific details must be preserved perfectly. Do not replace them with similar items.
        2.  **FOCUS ON CLARITY:** The background must be simple and non-distracting (e.g., seamless off-white or light grey). The lighting should be bright and professional, highlighting the product details. The model's pose should be elegant and static.
        3.  **SINGLE LOOK:** The final output must be a single, cohesive look on one model. All products must be styled together. Do not generate individual product shots.
        4.  **OUTPUT FORMAT:** Respond ONLY with the generated prompt text, without any additional explanations or markdown.
      `;
      userQuery = `Generate a studio photography prompt for these products to be styled together in a single look on a model: ${productList}`;
    } else if (type === 'lifestyle') {
      systemPrompt = `
        You are a world-class creative director for a luxury fashion brand like Ounass.
        Your task is to generate a single, highly detailed, and vivid prompt for an AI image generation model.
        This prompt will be used to create a photorealistic lifestyle image featuring the user-provided products.

        **CRITICAL RULES:**
        1.  **DO NOT CHANGE THE PRODUCTS:** The user-provided products (clothing, handbag, shoes, accessories) are fixed. You MUST describe them exactly as they appear in the provided images. Their color, shape, texture, and specific details must be preserved perfectly. Do not replace them with similar items. The prompt must explicitly state to use these exact items.
        2.  **FOCUS ON THE SCENE:** Your creativity should only be applied to the background, the model's pose, the lighting, and the overall mood. Do not alter the products themselves.
        3.  **PHOTOREALISM:** The final image must be indistinguishable from a real, high-quality photograph. Mention camera settings like aperture, shutter speed, and lens type (e.g., 85mm f/1.4).
        4.  **OUTPUT FORMAT:** Respond ONLY with the generated prompt text, without any additional explanations, introductions, or markdown.
      `;
      userQuery = `
        Generate a lifestyle prompt featuring these products:
        ${productList}
        Additional context for the scene: ${lifestyleInputs}
      `;
    }

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error('Gemini API request failed');
    }

    const result = await response.json();
    const generatedText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (generatedText) {
      res.json({ success: true, prompt: generatedText });
    } else {
      throw new Error('Failed to generate prompt');
    }

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
}