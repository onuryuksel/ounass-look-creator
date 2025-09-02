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
      const { location, mood, time, extra } = lifestyleInputs;
      userQuery = `Create a high-fashion, professional visual prompt for a person wearing these products: ${productList}. The photo should be taken in "${location}", with a "${mood}" mood, and at "${time}". Extra details: "${extra}". The prompt must strictly ensure the products themselves are not altered or morphed in any way.`;
      systemPrompt = "You are an assistant to a professional fashion photographer. Your task is to generate a detailed and creative visual prompt for a high-fashion photoshoot based on user inputs. The prompt should be a single, descriptive sentence. Ensure the prompt explicitly states that the products should not be altered.";
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
