
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

    // Create detailed product descriptions for the prompt
    const productDescriptions = productDetails.map((product, index) => {
      return `${product.name} by ${product.brand} (${product.category})`;
    }).join(', ');

    // Build simple, direct prompt
    const tryOnPrompt = `I need to perform a virtual try-on task. 

TASK: Take the person in the first image and dress them with the products shown in the following images.

PERSON: Use the exact person from the first image - same face, same body, same hair, same skin tone.

PRODUCTS TO ADD: ${productDescriptions}

INSTRUCTIONS:
- Replace their current clothing with the new items
- Keep the same person (do not change their appearance)  
- Show only ONE person in the final image
- Make the clothing fit naturally on their body
- Add accessories like bags without replacing clothing
- Keep realistic lighting and shadows
- Maintain photo-realistic quality

CRITICAL: This must be a single person wearing new clothes, not multiple people.

Generate a high-quality fashion photograph of the same person wearing the specified items.`;

    // Log prompt details
    console.log('--- NEW SIMPLE PROMPT APPROACH ---');
    console.log('Products:', productDescriptions);
    console.log('Final prompt length:', tryOnPrompt.length);
    console.log('--- END PROMPT INFO ---');

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
