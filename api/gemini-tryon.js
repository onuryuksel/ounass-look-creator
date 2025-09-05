
export default async function handler(req, res) {
  console.log('🚨🚨🚨 TRY-ON API CALLED - THIS SHOULD BE VISIBLE! 🚨🚨🚨');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body keys:', Object.keys(req.body || {}));
  console.log('🚨🚨🚨 API INITIALIZATION COMPLETE 🚨🚨🚨');

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

    // Build dynamic source image descriptions
    let sourceImageDescriptions = `Source Image 1: [A full-body photograph of a person, against a neutral background].`;
    
    productDetails.forEach((product, index) => {
      const imageNumber = index + 2; // Start from 2 since user photo is 1
      sourceImageDescriptions += `\nSource Image ${imageNumber}: [A reference image of ${product.name.toLowerCase()}, from "${product.category}" category].`;
    });
    
    // Build dynamic wearing instructions - CLOTHING FIRST, ACCESSORIES LAST
    const clothingItems = productDetails.filter(p => 
      p.category.toLowerCase().includes('clothing') || 
      p.category.toLowerCase().includes('dress') ||
      p.category.toLowerCase().includes('top') ||
      p.category.toLowerCase().includes('bottom')
    );
    const accessoryItems = productDetails.filter(p => 
      p.category.toLowerCase().includes('bag') || 
      p.category.toLowerCase().includes('shoe') ||
      p.category.toLowerCase().includes('accessory')
    );
    
    // Separate clothing and accessory instructions
    const clothingInstructions = clothingItems.map((product, index) => {
      const originalIndex = productDetails.indexOf(product);
      const imageNumber = originalIndex + 2;
      return `wearing the ${product.name.toLowerCase()} from Source Image ${imageNumber}`;
    });
    
    const accessoryInstructions = accessoryItems.map((product, index) => {
      const originalIndex = productDetails.indexOf(product);
      const imageNumber = originalIndex + 2;
      return `carrying the ${product.name.toLowerCase()} from Source Image ${imageNumber}`;
    });
    
    // Combine: CLOTHING first, then ACCESSORIES
    const allInstructions = [...clothingInstructions, ...accessoryInstructions];
    const wearingInstructions = allInstructions.join(', ');

    const tryOnPrompt = `${sourceImageDescriptions}

Prompt: Create a high-resolution, realistic image of the SAME SINGLE PERSON from Source Image 1. The subject should be ${wearingInstructions}.

CRITICAL REQUIREMENTS:
1. SINGLE PERSON ONLY: Show EXACTLY ONE PERSON - the same person from Source Image 1. Do NOT add additional people.
2. IDENTITY PRESERVATION: The person must maintain identical characteristics:
   - EXACT same face and facial features
   - EXACT same skin tone and complexion
   - EXACT same hair color, length, and style
   - EXACT same body type and proportions
   - EXACT same ethnic background and appearance
3. CLOTHING REPLACEMENT: Replace ALL existing clothing with the new clothing items specified above.
4. NO NEW PEOPLE: Do not generate additional models, people, or figures in the image.

Instructions:
1. POSE ADAPTATION: You may adjust the person's pose to better showcase the new clothing items, but maintain their core identity.
2. Apply accessories (bags, shoes) in addition to the clothing, not as replacements.
3. Seamlessly integrate all items onto the subject, ensuring realistic fit and proportions.
4. Maintain similar lighting and background style from Source Image 1 (background can be adjusted if needed for better product display).
5. Create consistent shadows, reflections, and fabric textures for photorealism.
6. NEVER alter the subject's face, hair color/length, skin tone, or core physical characteristics.
7. Keep the same single-person composition as Source Image 1.

Product Details:
${productSpecs}

Generate a professional, photo-realistic image with natural lighting and realistic fabric draping.`;

    // CRITICAL: Verify prompt was generated correctly
    console.log('--- PROMPT GENERATION VERIFICATION ---');
    console.log('Source image descriptions length:', sourceImageDescriptions.length);
    console.log('Wearing instructions length:', wearingInstructions.length);
    console.log('Product specs length:', productSpecs.length);
    console.log('Final prompt length:', tryOnPrompt.length);
    if (tryOnPrompt.length < 100) {
      console.error('🚨 CRITICAL: Prompt seems too short!');
      console.error('🚨 This suggests prompt generation failed!');
    }
    console.log('--- END PROMPT VERIFICATION ---');

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
        responseModalities: ["TEXT", "IMAGE"]
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
    console.log('🚀 CALLING GEMINI API...');
    console.log('Total images being sent:', allImages.length);
    console.log('Prompt length:', tryOnPrompt.length);
    
    // CRITICAL: Verify payload structure
    console.log('--- PAYLOAD VERIFICATION ---');
    console.log('Payload parts count:', payload.contents[0].parts.length);
    console.log('First part type:', payload.contents[0].parts[0].text ? 'TEXT' : 'IMAGE');
    console.log('First part content preview:', payload.contents[0].parts[0].text ? 
      payload.contents[0].parts[0].text.substring(0, 100) + '...' : 'IMAGE DATA');
    
    // Log image sizes for debugging
    console.log('--- IMAGE SIZE ANALYSIS ---');
    console.log('User photo size (chars):', userPhoto.length);
    productImages.forEach((img, index) => {
      console.log(`Product image ${index + 1} size (chars):`, img.length);
    });
    
    // Calculate total payload size
    const payloadString = JSON.stringify(payload);
    const payloadSizeMB = (payloadString.length / (1024 * 1024)).toFixed(2);
    console.log('Total payload size:', payloadSizeMB, 'MB');
    console.log('Total payload chars:', payloadString.length);
    console.log('--- END SIZE ANALYSIS ---');
    
    console.log('API URL:', apiUrl.replace(apiKey, '[API_KEY_HIDDEN]'));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    console.log('✅ Raw Gemini response received');
    console.log('Response status:', response.status);
    
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
    console.log('--- TRY-ON RESPONSE ANALYSIS ---');
    console.log('Response structure:', {
      hasCandidates: !!result.candidates,
      candidatesCount: result.candidates?.length || 0,
      hasContent: !!(result.candidates?.[0]?.content),
      hasPartse: !!(result.candidates?.[0]?.content?.parts),
      partsCount: result.candidates?.[0]?.content?.parts?.length || 0
    });
    if (result.candidates?.[0]?.content?.parts) {
      console.log('Parts analysis:');
      result.candidates[0].content.parts.forEach((part, index) => {
        console.log(`Part ${index}:`, {
          hasText: !!part.text,
          hasInlineData: !!part.inlineData,
          textLength: part.text?.length || 0,
          dataSize: part.inlineData?.data?.length || 0,
          mimeType: part.inlineData?.mimeType
        });
      });
    }
    console.log('Full response (first 1000 chars):', JSON.stringify(result, null, 2).substring(0, 1000));
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
        prompt: tryOnPrompt, // CRITICAL: Send prompt to frontend
        debug: { 
          model: model,
          productCount: productDetails.length,
          imageDataLength: tryOnImageData.length,
          mimeType: mimeType,
          message: 'Virtual try-on successful'
        }
      });
    } else {
      console.log('❌ No try-on image data found in response');
      
      // Check if there's text response explaining why
      let aiTextResponse = '';
      if (result.candidates?.[0]?.content?.parts) {
        const textParts = result.candidates[0].content.parts.filter(part => part.text);
        if (textParts.length > 0) {
          aiTextResponse = textParts.map(part => part.text).join(' ');
          console.log('❌ AI returned text instead of image:');
          console.log(aiTextResponse);
        }
      }
      
      console.error('No valid image in try-on response:', result);
      return res.status(500).json({ 
        error: 'No try-on image received from AI',
        aiResponse: aiTextResponse,
        prompt: tryOnPrompt, // CRITICAL: Send prompt to frontend even on error
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
      prompt: tryOnPrompt || 'Prompt not generated', // CRITICAL: Send prompt even on error
      debug: {
        errorType: error.constructor.name
      }
    });
  }
}
