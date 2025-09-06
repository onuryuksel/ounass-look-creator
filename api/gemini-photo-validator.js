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

    // Create detailed validation prompt with individual scoring
    const validationPrompt = `Analyze this user photo for virtual try-on compatibility. Evaluate the following criteria and provide a score (0-100) for each:

1. FULL BODY SHOT (0-100): Does the photo show the person's entire body or at least from chest down?
2. NEUTRAL POSE (0-100): Is the person in a natural, standing pose with arms slightly away from body?
3. WELL-DEFINED OUTLINE (0-100): Does the person have a clear outline distinct from background?
4. MINIMAL LOOSE CLOTHING (0-100): Is the person wearing minimal, non-baggy clothing?
5. GOOD LIGHTING (0-100): Is there clear, even lighting without strong shadows or overexposure?
6. PLAIN BACKGROUND (0-100): Is the background simple and uncluttered?
7. RESOLUTION QUALITY (0-100): Is the image high-resolution with good clarity?

Provide your response in this EXACT format:
FULL_BODY_SHOT: [score 0-100]
NEUTRAL_POSE: [score 0-100]
WELL_DEFINED_OUTLINE: [score 0-100]
MINIMAL_LOOSE_CLOTHING: [score 0-100]
GOOD_LIGHTING: [score 0-100]
PLAIN_BACKGROUND: [score 0-100]
RESOLUTION_QUALITY: [score 0-100]
ANALYSIS: [1-2 sentence summary of photo quality and main issues if any]
RECOMMENDATIONS: [specific improvements needed if weighted score < 80]

Be fair and realistic in your evaluation. Focus on what would make virtual try-on most successful.`;

    // Clean base64 data (remove data:image/jpeg;base64, prefix)
    const cleanBase64 = userPhoto.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Prepare the image for analysis
    const imagePart = {
      inlineData: {
        data: cleanBase64,
        mimeType: "image/jpeg"
      }
    };

    // Generate validation response
    const result = await model.generateContent([validationPrompt, imagePart]);
    const response = await result.response;
    const validationText = response.text();

    console.log('📊 Photo validation response:', validationText);

    // Parse individual scores
    const fullBodyShotMatch = validationText.match(/FULL_BODY_SHOT:\s*(\d+)/);
    const neutralPoseMatch = validationText.match(/NEUTRAL_POSE:\s*(\d+)/);
    const wellDefinedOutlineMatch = validationText.match(/WELL_DEFINED_OUTLINE:\s*(\d+)/);
    const minimalLooseClothingMatch = validationText.match(/MINIMAL_LOOSE_CLOTHING:\s*(\d+)/);
    const goodLightingMatch = validationText.match(/GOOD_LIGHTING:\s*(\d+)/);
    const plainBackgroundMatch = validationText.match(/PLAIN_BACKGROUND:\s*(\d+)/);
    const resolutionQualityMatch = validationText.match(/RESOLUTION_QUALITY:\s*(\d+)/);
    const analysisMatch = validationText.match(/ANALYSIS:\s*(.+?)(?=RECOMMENDATIONS:|$)/s);
    const recommendationsMatch = validationText.match(/RECOMMENDATIONS:\s*(.+?)$/s);

    // Extract scores
    const fullBodyShot = fullBodyShotMatch ? parseInt(fullBodyShotMatch[1]) : 0;
    const neutralPose = neutralPoseMatch ? parseInt(neutralPoseMatch[1]) : 0;
    const wellDefinedOutline = wellDefinedOutlineMatch ? parseInt(wellDefinedOutlineMatch[1]) : 0;
    const minimalLooseClothing = minimalLooseClothingMatch ? parseInt(minimalLooseClothingMatch[1]) : 0;
    const goodLighting = goodLightingMatch ? parseInt(goodLightingMatch[1]) : 0;
    const plainBackground = plainBackgroundMatch ? parseInt(plainBackgroundMatch[1]) : 0;
    const resolutionQuality = resolutionQualityMatch ? parseInt(resolutionQualityMatch[1]) : 0;
    const analysis = analysisMatch ? analysisMatch[1].trim() : 'Unable to analyze photo';
    const recommendations = recommendationsMatch ? recommendationsMatch[1].trim() : '';

    // Define weights (total = 100)
    const weights = {
      fullBodyShot: 25,      // Most important
      neutralPose: 25,       // Most important
      wellDefinedOutline: 15, // Important
      minimalLooseClothing: 15, // Important
      goodLighting: 10,      // Medium
      plainBackground: 5,    // Less important
      resolutionQuality: 5   // Less important
    };

    // Calculate weighted score
    const weightedScore = Math.round(
      (fullBodyShot * weights.fullBodyShot +
       neutralPose * weights.neutralPose +
       wellDefinedOutline * weights.wellDefinedOutline +
       minimalLooseClothing * weights.minimalLooseClothing +
       goodLighting * weights.goodLighting +
       plainBackground * weights.plainBackground +
       resolutionQuality * weights.resolutionQuality) / 100
    );

    // Log individual scores and weighted calculation
    console.log('📊 Individual Scores:');
    console.log(`  FULL BODY SHOT: ${fullBodyShot}/100 (weight: ${weights.fullBodyShot}%)`);
    console.log(`  NEUTRAL POSE: ${neutralPose}/100 (weight: ${weights.neutralPose}%)`);
    console.log(`  WELL-DEFINED OUTLINE: ${wellDefinedOutline}/100 (weight: ${weights.wellDefinedOutline}%)`);
    console.log(`  MINIMAL LOOSE CLOTHING: ${minimalLooseClothing}/100 (weight: ${weights.minimalLooseClothing}%)`);
    console.log(`  GOOD LIGHTING: ${goodLighting}/100 (weight: ${weights.goodLighting}%)`);
    console.log(`  PLAIN BACKGROUND: ${plainBackground}/100 (weight: ${weights.plainBackground}%)`);
    console.log(`  RESOLUTION QUALITY: ${resolutionQuality}/100 (weight: ${weights.resolutionQuality}%)`);
    console.log(`📈 Weighted Score: ${weightedScore}%`);
    console.log(`📝 Analysis: ${analysis}`);
    console.log(`💡 Recommendations: ${recommendations}`);
    console.log(`🎯 Threshold: 80%`);

    // Determine if photo is suitable (threshold back to 80%)
    const isSuitable = weightedScore >= 80;
    
    const result_data = {
      suitable: isSuitable,
      score: weightedScore,
      individualScores: {
        fullBodyShot,
        neutralPose,
        wellDefinedOutline,
        minimalLooseClothing,
        goodLighting,
        plainBackground,
        resolutionQuality
      },
      weights,
      analysis,
      recommendations,
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