export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { type, productList, lifestyleInputs } = req.body;
    
    let userQuery, systemPrompt;
    
    // Determine the prompt based on the type
    if (type === 'studio') {
      systemPrompt = `You are a creative director. Your task is to write a short, creative description for a luxury e-commerce studio photoshoot. Focus ONLY on the model's elegant pose, the professional, bright, even lighting, and specific camera details (e.g., lens, aperture). DO NOT mention the products or the background; that is already handled.`;
      userQuery = `Write a creative description for a studio photoshoot.`;
    } else if (type === 'lifestyle') {
      systemPrompt = `You are a creative director. Your task is to write a short, creative description for a luxury lifestyle fashion shoot. Focus ONLY on the model's specific action/pose, the lighting, and specific camera details. DO NOT mention the products or the location/mood; that is already handled.`;
      userQuery = `Write a creative description for a lifestyle photoshoot with the following context: Location is '${lifestyleInputs.location}', mood is '${lifestyleInputs.mood}', time is '${lifestyleInputs.time}'.`;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash-preview-05-20',
    });

    const result = await model.generateContent({
      contents: [{ parts: [{ text: userQuery }] }],
      generationConfig: {
        maxOutputTokens: 100,
        temperature: 0.1,
      },
    });

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