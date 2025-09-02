export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, productList, lifestyleInputs } = req.body;
    
    let userQuery, systemPrompt;
    
    if (type === 'studio') {
      userQuery = `Create a professional, high-fashion e-commerce studio photography prompt for a model wearing all of these products to create a single, cohesive look: ${productList}. The prompt must ensure the products themselves are not altered or morphed in any way.`;
      systemPrompt = "You are a professional product photographer and creative director. Your task is to write a concise and compelling studio photography prompt for a single image. The prompt should focus on a clean, luxurious background (e.g., seamless white or light gray), professional lighting, and clear details, suitable for an e-commerce website. Emphasize that the final output should be a single look on a model and that all products must be included and styled together, without any individual product photos.";
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