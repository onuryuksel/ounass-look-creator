export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, productList, lifestyleInputs } = req.body;
    
    let userQuery, systemPrompt;
    
    // Determine the prompt based on the type
    if (type === 'studio') {
      systemPrompt = `You are a creative director. Your task is to complete the user's prompt by providing a creative description. The user will provide a template with a placeholder. Replace the placeholder with your description for a luxury e-commerce studio photoshoot. Focus on the model's pose, professional lighting, and camera details. Be concise and professional.`;
      userQuery = `Complete the following prompt by replacing the placeholder: "A photorealistic full-body studio photograph of a model wearing the following exact products. It is critical these products are not altered in any way: ${productList}. [YOUR CREATIVE DESCRIPTION HERE: Describe the model's elegant pose, the bright and professional lighting, camera details, and the seamless light grey background.]"`;
    } else if (type === 'lifestyle') {
      systemPrompt = `You are a creative director. Your task is to complete the user's prompt by providing a creative description. The user will provide a template with a placeholder. Replace the placeholder with your description for a luxury lifestyle fashion shoot based on the user's creative context.`;
      userQuery = `Complete the following prompt by replacing the placeholder: "A photorealistic lifestyle photograph of a fashion model wearing the following exact products. It is critical these products are not altered in any way: ${productList}. The scene is '${lifestyleInputs.location}' with a '${lifestyleInputs.mood}' mood. [YOUR CREATIVE DESCRIPTION HERE: Describe the model's specific action, the lighting corresponding to '${lifestyleInputs.time}', and camera details like lens and aperture to bring the scene to life.]"`;
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