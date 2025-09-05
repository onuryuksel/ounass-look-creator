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

    const tryOnPrompt = `You are an expert virtual try-on AI. Your task is to dress the person in the provided photo with the EXACT products from the reference images.

CRITICAL REQUIREMENT - PRODUCT PRESERVATION:
EXACT products from the provided reference images should be used. These products are NOT to be used as inspiration - they are to be REPLICATED PERFECTLY with zero modifications.

PRODUCT SPECIFICATIONS:
${productSpecs}

VIRTUAL TRY-ON INSTRUCTIONS:
1. ANALYZE the user's photo to understand:
   - Body position and pose
   - Lighting conditions
   - Background and setting
   - Current clothing (to be replaced)

2. DRESS the person with the EXACT products:
   - Place each product appropriately on the body
   - Maintain natural fit and draping
   - Ensure proper sizing and proportions
   - Preserve original product colors, patterns, and textures

3. TECHNICAL REQUIREMENTS:
   - Keep the person's face, hands, and visible skin unchanged
   - Maintain the original background and lighting
   - Ensure realistic shadows and highlights on the new clothing
   - Blend clothing naturally with the body
   - Preserve the original pose and body position

4. QUALITY STANDARDS:
   - Photo-realistic result
   - Natural clothing fit and draping
   - Consistent lighting across all elements
   - No visible artifacts or blending issues
   - Maintain original image quality and resolution

WHAT TO PRESERVE:
- User's face, skin tone, and facial features
- Original background and environment
- User's pose and body position
- Natural lighting and shadows
- Image quality and resolution

WHAT TO REPLACE:
- Only the clothing items that conflict with the new products
- Ensure new products fit naturally on the body

FINAL INSTRUCTION:
Copy the products pixel-perfect. Do not create variations. Do not interpret. Do not stylize. REPLICATE EXACTLY as provided while naturally fitting them on the user's body.

Return a photo-realistic image of the person wearing the exact products provided.`;

    console.log('--- TRY-ON PROMPT ---');
    console.log(tryOnPrompt);
    console.log('--- END PROMPT ---');

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
