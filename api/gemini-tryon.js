export default async function handler(req, res) {
  console.log('--- TRY-ON API STARTED ---');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('--- API INITIALIZATION ---');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('Method not allowed:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userPhoto, productImages, productDetails } = req.body;
    
    console.log('--- TRY-ON REQUEST ---');
    console.log('User photo provided:', !!userPhoto);
    console.log('Product images count:', productImages?.length || 0);
    console.log('Product details:', productDetails);
    console.log('--------------------------------');

    if (!userPhoto || !productImages || !productDetails) {
      return res.status(400).json({ 
        error: 'Missing required fields: userPhoto, productImages, productDetails' 
      });
    }

    // Build product specifications for the prompt
    let productSpecs = '';
    productDetails.forEach((product, index) => {
      productSpecs += `
PRODUCT ${index + 1}:
- SKU: ${product.sku}
- Name: ${product.name}
- Brand: ${product.brand}
- Category: ${product.category}
- Reference Image: Product image ${index + 1} (provided)
`;
    });

    const tryOnPrompt = `🚨 CRITICAL VIRTUAL TRY-ON MISSION 🚨

You are a specialized virtual try-on AI. Your PRIMARY task is to preserve the EXACT user in the first image and dress them with the EXACT products from the reference images.

⚠️ CRITICAL USER PRESERVATION REQUIREMENTS:
- THE FIRST IMAGE CONTAINS THE USER - THIS PERSON MUST BE PRESERVED 100%
- DO NOT create a new model or person
- DO NOT change the user's face, body, pose, or identity
- DO NOT generate a different person
- USE THE EXACT USER from the first image as the foundation

🎯 USER PHOTO ANALYSIS (FIRST IMAGE):
- This is THE PERSON who will wear the products
- Preserve their EXACT face, body shape, skin tone, pose
- Maintain their background, lighting, and setting
- Keep their body position and posture unchanged
- This person MUST remain the same throughout

📦 PRODUCT SPECIFICATIONS (SUBSEQUENT IMAGES):
${productSpecs}

🔧 VIRTUAL TRY-ON PROCESS:
1. ✅ FOUNDATION: Use the EXACT user from the first image
2. 🎯 ANALYSIS: Study user's pose, lighting, body shape
3. 👕 CLOTHING REPLACEMENT: Replace only conflicting garments
4. 🎨 PRODUCT APPLICATION: Apply each product naturally on the user
5. ✨ INTEGRATION: Blend products seamlessly with user's body
6. 🔍 QUALITY CHECK: Ensure user identity is preserved

🚫 ABSOLUTE PROHIBITIONS:
- DO NOT create a new person/model
- DO NOT change the user's identity, face, or body
- DO NOT ignore the user photo
- DO NOT use products as inspiration for a new person
- DO NOT alter user's pose, background, or lighting significantly

⚡ TECHNICAL REQUIREMENTS:
- HIGH RESOLUTION output
- Photo-realistic quality
- Natural fabric draping and fit
- Realistic shadows and highlights
- Seamless clothing integration
- Preserve original image sharpness and detail

🎖️ SUCCESS CRITERIA:
- User from first image is clearly recognizable ✓
- All products are applied correctly to the user ✓
- High quality, realistic result ✓
- Natural clothing fit and appearance ✓
- User's identity and appearance preserved ✓

FINAL INSTRUCTION:
Take the EXACT user from the first image and dress them with the EXACT products. Do not create variations, interpretations, or new people. The user MUST remain the same person throughout.

Return a HIGH-QUALITY photo-realistic image of the SAME USER wearing the exact products provided.`;

    console.log('--- FINAL TRY-ON PROMPT SENT TO GEMINI-2.5-FLASH-IMAGE-PREVIEW ---');
    console.log('Product count:', productDetails.length);
    console.log('User photo provided:', !!userPhoto);
    console.log('Product images provided:', productImages.length);
    console.log('');
    console.log('FULL PROMPT:');
    console.log(tryOnPrompt);
    console.log('');
    console.log('PRODUCT DETAILS:');
    productDetails.forEach((product, index) => {
      console.log(`Product ${index + 1}: ${product.name} (${product.brand}) - ${product.category} - SKU: ${product.sku}`);
    });
    console.log('--- END OF FINAL TRY-ON PROMPT ---');

    // Prepare images for Gemini API
    const allImages = [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: userPhoto.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }
      },
      ...productImages.map(img => ({
        inlineData: {
          mimeType: "image/jpeg", 
          data: img.split(',')[1] // Remove data:image/jpeg;base64, prefix
        }
      }))
    ];

    const payload = {
      contents: [{
        parts: [
          { text: tryOnPrompt },
          ...allImages
        ]
      }],
      generationConfig: {
        responseModalities: ["IMAGE"]
      }
    };
    
    const apiKey = process.env.OunassLookCreator;
    if (!apiKey) {
      return res.status(500).json({ error: 'OunassLookCreator API key not configured' });
    }
    
    const model = 'gemini-2.5-flash-image-preview';
    console.log(`Using model: ${model} for virtual try-on`);
    console.log('API Key available:', !!apiKey);
    console.log('API Key first 10 chars:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');
    console.log('Total images being sent:', allImages.length);
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    console.log('API URL:', apiUrl.replace(apiKey, '[API_KEY_HIDDEN]'));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      console.error('Response status:', response.status);
      console.error('Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }
    
    let result;
    let responseText;
    try {
      responseText = await response.text();
      console.log('Raw API response (first 500 chars):', responseText.substring(0, 500));
      result = JSON.parse(responseText);
    } catch (jsonError) {
      console.error('JSON parsing failed:', jsonError.message);
      console.error('Raw response that failed to parse:', responseText);
      throw new Error(`Failed to parse Gemini API response: ${jsonError.message}`);
    }
    console.log('--- TRY-ON RESPONSE ---');
    console.log(JSON.stringify(result, null, 2));
    console.log('------------------------');
    
    // Find the part with image data
    let tryOnImageData = null;
    let mimeType = 'image/jpeg';
    if (result.candidates && result.candidates[0]?.content?.parts) {
      const parts = result.candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData?.data) {
          tryOnImageData = part.inlineData.data;
          mimeType = part.inlineData.mimeType || 'image/jpeg';
          break;
        }
      }
    }
    
    if (tryOnImageData) {
      console.log('--- TRY-ON SUCCESS ---');
      console.log('Generated try-on image data length:', tryOnImageData.length);
      console.log('Image MIME type:', mimeType);
      console.log('Product count:', productDetails.length);
      console.log('--------------------------------');
      
      return res.json({ 
        success: true, 
        image: `data:${mimeType};base64,${tryOnImageData}`,
        debug: { 
          model: model,
          productCount: productDetails.length,
          imageDataLength: tryOnImageData.length,
          mimeType: mimeType,
          message: 'Virtual try-on successful'
        }
      });
    } else {
      console.error('No valid image in try-on response:', result);
      return res.status(500).json({ 
        error: 'No try-on image received from AI',
        debug: result
      });
    }
    
  } catch (error) {
    console.error('--- TRY-ON ERROR ---');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('--- END TRY-ON ERROR ---');
    
    return res.status(500).json({ 
      error: error.message || 'Unknown error occurred during virtual try-on',
      debug: {
        errorType: error.constructor.name
      }
    });
  }
}
