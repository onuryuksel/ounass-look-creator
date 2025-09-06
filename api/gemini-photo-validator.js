import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.OunassLookCreator);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userPhoto } = req.body;

    if (!userPhoto) {
      return res.status(400).json({ error: 'User photo is required' });
    }

    console.log('🔍 Starting photo validation for virtual try-on...');

    // Initialize Gemini 1.5 Flash for photo analysis
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 1024,
      }
    });

    // Create detailed validation prompt
    const validationPrompt = `Analyze this user photo for virtual try-on compatibility. Evaluate the following criteria and provide a score (0-100) for each:

1. FULL BODY SHOT (0-100): Does the photo show the person's entire body or at least from chest down?
2. NEUTRAL POSE (0-100): Is the person in a natural, standing pose with arms slightly away from body?
3. GOOD LIGHTING (0-100): Is there clear, even lighting without strong shadows or overexposure?
4. PLAIN BACKGROUND (0-100): Is the background simple and uncluttered?
5. WELL-DEFINED OUTLINE (0-100): Does the person have a clear outline distinct from background?
6. MINIMAL LOOSE CLOTHING (0-100): Is the person wearing minimal, non-baggy clothing?
7. RESOLUTION QUALITY (0-100): Is the image high-resolution with good clarity?

Provide your response in this EXACT format:
SCORE: [overall percentage 0-100]
ANALYSIS: [1-2 sentence summary of photo quality and main issues if any]
RECOMMENDATIONS: [specific improvements needed if score < 80]

Be strict but fair in your evaluation. Focus on what would make virtual try-on most successful.`;

    // Prepare the image for analysis
    const imagePart = {
      inlineData: {
        data: userPhoto,
        mimeType: "image/jpeg"
      }
    };

    // Generate validation response
    const result = await model.generateContent([validationPrompt, imagePart]);
    const response = await result.response;
    const validationText = response.text();

    console.log('📊 Photo validation response:', validationText);

    // Parse the response
    const scoreMatch = validationText.match(/SCORE:\s*(\d+)/);
    const analysisMatch = validationText.match(/ANALYSIS:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
    const recommendationsMatch = validationText.match(/RECOMMENDATIONS:\s*(.+?)$/s);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    const analysis = analysisMatch ? analysisMatch[1].trim() : 'Unable to analyze photo';
    const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : '';

    console.log(`📈 Photo validation score: ${score}%`);

    // Determine if photo is suitable
    const isSuitable = score >= 80;
    
    const result_data = {
      suitable: isSuitable,
      score: score,
      analysis: analysis,
      recommendations: recommendations,
      timestamp: new Date().toISOString()
    };

    if (isSuitable) {
      console.log('✅ Photo is suitable for virtual try-on');
      return res.status(200).json({
        success: true,
        message: 'Photo is suitable for virtual try-on',
        ...result_data
      });
    } else {
      console.log('❌ Photo is not suitable for virtual try-on');
      return res.status(400).json({
        success: false,
        message: 'Photo does not meet virtual try-on requirements',
        ...result_data
      });
    }

  } catch (error) {
    console.error('❌ Photo validation error:', error);
    return res.status(500).json({ 
      error: 'Photo validation failed',
      details: error.message 
    });
  }
}
