
export default async function handler(req, res) {
  console.log('🚨🚨🚨 BATCH TRY-ON API CALLED - THIS SHOULD BE VISIBLE! 🚨🚨🚨');
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
    const { userPhoto, productImages, productDetails, generatedPrompt } = req.body;
    
    console.log('--- BATCH TRY-ON REQUEST ---');
    console.log('User photo provided:', !!userPhoto);
    console.log('Product images count:', productImages?.length || 0);
    console.log('Product details:', productDetails);
    console.log('--------------------------------');

    if (!userPhoto || !productImages || !productDetails) {
      return res.status(400).json({ 
        error: 'Missing required fields: userPhoto, productImages, productDetails' 
      });
    }

    const apiKey = process.env.OunassLookCreator;
    if (!apiKey) {
      return res.status(500).json({ error: 'OunassLookCreator API key not configured' });
    }

    const model = 'gemini-2.5-flash-image-preview';
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // BATCH PROCESSING: Process one product at a time following Google's single-item pattern
    let currentImage = userPhoto; // Start with user photo
    let allPrompts = []; // Track all prompts used
    let stepResults = []; // Track each step result
    let iterationImages = []; // Track all intermediate images for thumbnails

    console.log(`🔄 Starting batch processing for ${productDetails.length} products...`);
    
    // Add the original user photo as the first iteration
    iterationImages.push({
      step: 0,
      label: "Original Photo",
      image: userPhoto,
      description: "User's original photo"
    });

    for (let i = 0; i < productDetails.length; i++) {
      const product = productDetails[i];
      const productImage = productImages[i];
      
      console.log(`\n--- STEP ${i + 1}/${productDetails.length}: ${product.name} ---`);
      
      // Create Google-style single-item prompt following their best practices
      const stepPrompt = `Make the person in image 1 wear the ${product.category.toLowerCase()} from image 2. Leave the background unchanged.

CRITICAL REQUIREMENTS:
- Keep the EXACT same person (face, body, hair, skin tone, facial features)
- Keep the EXACT same background and environment completely unchanged
- Keep the EXACT same pose, position, and body posture
- Keep the EXACT same lighting conditions and photo style
- Keep the EXACT same camera angle and perspective
- ONLY replace/add the specified ${product.category.toLowerCase()}
- Make the new ${product.category.toLowerCase()} fit naturally on the person's body
- Ensure proper sizing and proportions for the person's build
- Maintain realistic fabric draping and shadows

This is precise digital clothing replacement - preserve everything except the specified ${product.category.toLowerCase()}.`;

      console.log(`Step ${i + 1} prompt:`, stepPrompt);
      allPrompts.push(stepPrompt);
      
      // Log the prompt that will be sent to Google API for this step
      console.log(`🔥🔥🔥 STEP ${i + 1} PROMPT SENT TO GOOGLE API 🔥🔥🔥`);
      console.log(stepPrompt);
      console.log(`🔥🔥🔥 END STEP ${i + 1} PROMPT 🔥🔥🔥`);

      // Prepare images for this step: current image + new product
      const stepImages = [
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: currentImage.split(',')[1] // Current state (user photo or previous result)
          }
        },
        {
          inlineData: {
            mimeType: "image/jpeg", 
            data: productImage.split(',')[1] // New product to add
          }
        }
      ];

      const payload = {
        contents: [{
          parts: [
            { text: stepPrompt },
            ...stepImages
          ]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          temperature: 0.3,        // Lower temperature for consistency
          topP: 0.8,              // Controlled diversity
          maxOutputTokens: 2048,   // Allow for detailed responses
          candidateCount: 1        // Cost efficiency
        }
      };

      console.log(`🚀 Calling Gemini API for step ${i + 1}...`);
      console.log(`Current image size: ${currentImage.length} chars`);
      console.log(`Product image size: ${productImage.length} chars`);
      
      // Log API call details for this step
      console.log(`📡 STEP ${i + 1} API CALL DETAILS:`);
      console.log(`- Model: ${model}`);
      console.log(`- Product: ${product.name} by ${product.brand}`);
      console.log(`- Category: ${product.category}`);
      console.log(`- Images being sent: 2 (current state + new product)`);
      console.log(`- Payload size: ${JSON.stringify(payload).length} chars`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      console.log(`✅ Step ${i + 1} response received, status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Step ${i + 1} failed:`, errorText);
        throw new Error(`Step ${i + 1} failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log(`📊 Step ${i + 1} response structure:`, {
        hasCandidates: !!result.candidates,
        candidatesCount: result.candidates?.length || 0,
        hasContent: !!(result.candidates?.[0]?.content),
        partsCount: result.candidates?.[0]?.content?.parts?.length || 0
      });
      
      // Log detailed response analysis for this step
      console.log(`🔍 STEP ${i + 1} RESPONSE ANALYSIS:`);
      if (result.candidates?.[0]?.content?.parts) {
        result.candidates[0].content.parts.forEach((part, partIndex) => {
          if (part.text) {
            console.log(`- Part ${partIndex}: TEXT (${part.text.length} chars):`, part.text.substring(0, 200) + '...');
          } else if (part.inlineData) {
            console.log(`- Part ${partIndex}: IMAGE (${part.inlineData.data.length} chars, ${part.inlineData.mimeType})`);
          }
        });
      }

      // Extract image from this step following Google's multimodal approach
      let stepImageData = null;
      let stepMimeType = 'image/jpeg';
      let stepTextResponse = '';

      if (result.candidates && result.candidates[0]?.content?.parts) {
        const parts = result.candidates[0].content.parts;
        
        for (const part of parts) {
          if (part.text !== null && part.text !== undefined) {
            stepTextResponse += part.text + ' ';
            console.log(`Step ${i + 1} AI text:`, part.text);
          } else if (part.inlineData !== null && part.inlineData !== undefined) {
            stepImageData = part.inlineData.data;
            stepMimeType = part.inlineData.mimeType || 'image/jpeg';
            console.log(`✅ Step ${i + 1} image generated, MIME type:`, stepMimeType);
          }
        }
      }

      if (stepImageData) {
        // Update current image for next iteration
        currentImage = `data:${stepMimeType};base64,${stepImageData}`;
        
        // Add this iteration to the thumbnails collection
        iterationImages.push({
          step: i + 1,
          label: `Step ${i + 1}`,
          image: currentImage,
          description: `Added ${product.name} by ${product.brand}`,
          product: {
            name: product.name,
            brand: product.brand,
            category: product.category
          }
        });
        
        stepResults.push({
          step: i + 1,
          product: product.name,
          success: true,
          imageDataLength: stepImageData.length,
          mimeType: stepMimeType,
          textResponse: stepTextResponse
        });
        
        console.log(`✅ Step ${i + 1} completed successfully`);
        console.log(`🎯 STEP ${i + 1} SUMMARY:`);
        console.log(`- Product: ${product.name} by ${product.brand}`);
        console.log(`- Category: ${product.category}`);
        console.log(`- Image generated: ${stepImageData.length} chars`);
        console.log(`- MIME type: ${stepMimeType}`);
        if (stepTextResponse) {
          console.log(`- AI text response: ${stepTextResponse.substring(0, 100)}...`);
        }
        console.log(`- Progress: ${i + 1}/${productDetails.length} products processed`);
      } else {
        console.log(`❌ Step ${i + 1} failed - no image generated`);
        console.log(`AI response:`, stepTextResponse);
        
        stepResults.push({
          step: i + 1,
          product: product.name,
          success: false,
          error: 'No image generated',
          textResponse: stepTextResponse
        });
        
        // If any step fails, we can either:
        // 1. Stop and return error
        // 2. Continue with previous image
        // 3. Return partial results
        
        // For now, let's stop on first failure
        throw new Error(`Step ${i + 1} failed: No image generated. AI response: ${stepTextResponse}`);
      }
    }

    // All steps completed successfully
    console.log('🎉 All batch processing steps completed successfully!');
    console.log('Final result image size:', currentImage.length, 'chars');
    console.log('Total steps processed:', stepResults.length);
    
    // Final batch processing summary
    console.log('🏆 BATCH PROCESSING COMPLETE - FINAL SUMMARY:');
    console.log(`- Total products processed: ${productDetails.length}`);
    console.log(`- Successful steps: ${stepResults.filter(s => s.success).length}`);
    console.log(`- Final image size: ${currentImage.length} chars`);
    console.log(`- Total iterations captured: ${iterationImages.length}`);
    console.log('Products processed:');
    stepResults.forEach((result, index) => {
      console.log(`  ${index + 1}. ${result.product} - ${result.success ? '✅ Success' : '❌ Failed'}`);
    });

    return res.json({
      success: true,
      image: currentImage, // Final result after all products applied
      prompt: allPrompts.join('\n\n--- NEXT STEP ---\n\n'), // All prompts used
      stepResults: stepResults, // Detailed results for each step
      iterations: iterationImages, // All intermediate images for thumbnails
      debug: { 
        model: model,
        totalProducts: productDetails.length,
        successfulSteps: stepResults.filter(s => s.success).length,
        finalImageDataLength: currentImage.length,
        totalIterations: iterationImages.length,
        message: 'Batch virtual try-on successful'
      }
    });

  } catch (error) {
    console.error('--- BATCH TRY-ON ERROR ---');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('--- END BATCH TRY-ON ERROR ---');
    
    return res.status(500).json({ 
      error: error.message || 'Unknown error occurred during batch virtual try-on',
      debug: {
        errorType: error.constructor.name,
        stepResults: stepResults || []
      }
    });
  }
}
