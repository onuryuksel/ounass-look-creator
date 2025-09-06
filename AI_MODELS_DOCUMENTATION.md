"# AI Models Documentation - Ounass Look Creator

**Version:** v1.10.6  
**Last Updated:** December 2024  
**Project:** Ounass Look Creator - AI-powered outfit generator

---

## Overview

This document provides a comprehensive overview of all AI models used in the Ounass Look Creator project, their purposes, configurations, and usage patterns. This documentation should be updated whenever new AI models are integrated or existing configurations are modified.

---

## AI Models Used

### 1. Gemini 2.5 Flash Image (Nano Banana) - `gemini-2.5-flash-image-preview`

**Primary Use Cases:**
- Virtual Try-On (Batch Processing)
- Lifestyle Image Generation
- Photo Validation for Virtual Try-On

**Model Capabilities:**
- Multimodal (Text + Image input/output)
- Advanced image editing and generation
- Multiple input image processing
- High-quality visual output

#### 1.1 Virtual Try-On (`/api/gemini-tryon.js`)

**Purpose:** Apply multiple products sequentially to user photos using batch processing approach

**Configuration:**
```javascript
Model: gemini-2.5-flash-image-preview
Response Modalities: ["TEXT", "IMAGE"]
Temperature: 0.3
TopP: 0.8
Max Output Tokens: 2048
Candidate Count: 1
```

**Process Flow:**
1. **AI Category Extraction** (using Gemini 1.5 Flash)
2. **Sequential Product Application** (one product per step)
3. **Intermediate Image Storage** (for thumbnail display)
4. **Final Result Generation**

**Key Features:**
- Batch processing with intermediate results
- AI-powered category extraction for better prompts
- Critical product preservation instructions
- Comprehensive error handling and logging
- Interactive thumbnail display on frontend

**Input:** User photo + Product images + Product details  
**Output:** Final try-on image + All intermediate steps + Detailed step results

#### 1.2 Lifestyle Image Generation (`/api/gemini-image.js`)

**Purpose:** Generate lifestyle photoshoot images with products in realistic settings

**Configuration:**
```javascript
Model: gemini-2.5-flash-image-preview
Response Modalities: ["TEXT", "IMAGE"]
```

**Key Features:**
- Critical product preservation rule injection
- Retry logic with exponential backoff
- Multiple image input support
- Enhanced error handling

**Input:** Product images + Lifestyle prompt  
**Output:** Generated lifestyle image + AI text response

#### 1.3 AI Art Director (`/api/gemini-inspire.js`)

**Purpose:** Generate scene settings and creative direction for lifestyle photoshoots

**Configuration:**
```javascript
Model: gemini-2.5-flash-image-preview
Response Modalities: ["TEXT"]
Temperature: 0.7
TopP: 0.8
Max Output Tokens: 2048
```

**Key Features:**
- Visual style mapping (12 predefined styles)
- User preference integration
- Product-aware scene generation
- Comprehensive style descriptions

**Input:** Product images + User preferences  
**Output:** Detailed scene description + Creative direction

---

### 2. Gemini 1.5 Flash - `gemini-1.5-flash`

**Primary Use Cases:**
- Text-only generation
- Category extraction
- Prompt generation
- Photo validation analysis
- Fast text processing

**Model Capabilities:**
- Text-only input/output
- Fast response times
- Cost-effective for text tasks
- High-quality text generation

#### 2.1 General Text Generation (`/api/gemini-text.js`)

**Purpose:** Handle general text generation requests

**Configuration:**
```javascript
Model: gemini-1.5-flash
Response Modalities: ["TEXT"]
```

**Key Features:**
- Retry logic with exponential backoff
- Rate limiting handling
- Cost-effective text generation

**Input:** Text prompt  
**Output:** Generated text response

#### 2.2 Virtual Try-On Prompt Generation (`/api/gemini-prompt-generator.js`)

**Purpose:** Generate bulletproof virtual try-on prompts

**Configuration:**
```javascript
Model: gemini-1.5-flash
Response Modalities: ["TEXT"]
Temperature: 0.3
TopP: 0.8
Max Output Tokens: 1024
```

**Key Features:**
- Product-specific prompt generation
- Structured prompt format
- Try-on optimization

**Input:** Product details array  
**Output:** Optimized try-on prompt

#### 2.3 AI-Powered Category Extraction (`/api/gemini-tryon.js`)

**Purpose:** Extract specific product categories from complex category strings

**Configuration:**
```javascript
Model: gemini-1.5-flash
Response Modalities: ["TEXT"]
Temperature: 0.1
Max Output Tokens: 10
```

**Process:**
1. Analyze product name, brand, and current category
2. Return single-word category (e.g., "dress", "shirt", "shoes")
3. Fallback mechanism if AI extraction fails

**Example:**
- Input: "clothing/beachwear/dresses" → Output: "dress"
- Input: "footwear/heels/pumps" → Output: "shoes"

**Key Features:**
- Low temperature for consistent results
- Minimal token usage for cost efficiency
- Fallback to original category parsing
- Error handling and logging

#### 2.4 Photo Validation for Virtual Try-On (`/api/gemini-photo-validator.js`)

**Purpose:** Analyze user photos for virtual try-on compatibility and provide quality assessment

**Configuration:**
```javascript
Model: gemini-1.5-flash
Response Modalities: ["TEXT"]
Temperature: 0.1
TopP: 0.8
TopK: 40
Max Output Tokens: 1024
```

**Validation Criteria:**
1. **Full Body Shot (0-100):** Shows person's entire body or chest down
2. **Neutral Pose (0-100):** Natural standing pose with arms slightly away
3. **Good Lighting (0-100):** Clear, even lighting without shadows
4. **Plain Background (0-100):** Simple, uncluttered background
5. **Well-Defined Outline (0-100):** Clear person outline distinct from background
6. **Minimal Loose Clothing (0-100):** Non-baggy clothing for better draping
7. **Resolution Quality (0-100):** High-resolution with good clarity

**Process Flow:**
1. Analyze photo against 7 criteria
2. Calculate overall compatibility score (0-100%)
3. Provide detailed analysis and recommendations
4. Accept if score ≥ 80%, reject with feedback if < 80%

**Key Features:**
- Strict but fair evaluation
- Detailed feedback for rejected photos
- 80% threshold for acceptance
- User-friendly error messages
- Cost-effective text-only analysis

**Input:** User photo (base64)  
**Output:** Compatibility score + Analysis + Recommendations

---

## Model Selection Strategy

### Why Gemini 2.5 Flash Image for Visual Tasks?

1. **Multimodal Capabilities:** Can process both text and images simultaneously
2. **Advanced Image Editing:** Superior quality for virtual try-on and image generation
3. **Multiple Input Support:** Can handle multiple product images in one request
4. **High-Quality Output:** Produces professional-grade visual results

### Why Gemini 1.5 Flash for Text Tasks?

1. **Cost Efficiency:** Significantly cheaper for text-only tasks
2. **Speed:** Faster response times for text generation
3. **Reliability:** Stable and consistent text output
4. **Token Efficiency:** Optimized for text processing

---

## API Integration Patterns

### 1. Error Handling
- Retry logic with exponential backoff
- Comprehensive error logging
- Graceful fallback mechanisms
- User-friendly error messages

### 2. Rate Limiting
- Built-in retry mechanisms
- Delay between requests
- API key rotation support

### 3. Cost Optimization
- Model selection based on task requirements
- Token usage optimization
- Efficient prompt engineering

### 4. Performance Monitoring
- Detailed console logging
- Response time tracking
- Success/failure rate monitoring
- Debug information collection

---

## Configuration Management

### Environment Variables
```bash
OunassLookCreator=your_gemini_api_key_here
```

### Model Endpoints
```javascript
// Gemini 2.5 Flash Image
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent

// Gemini 1.5 Flash
https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent
```

---

## Usage Statistics & Costs

*Note: Cost estimates are based on Google's pricing as of December 2024. Actual costs may vary based on usage patterns and token consumption.*

### Virtual Try-On (Per Product)
- **Category Extraction:** ~$0.0001 (Gemini 1.5 Flash - TEXT only)
- **Try-On Generation:** ~$0.039 (Gemini 2.5 Flash Image - IMAGE output)
- **Total per Product:** ~$0.0391

### Lifestyle Generation
- **AI Art Director:** ~$0.002 (Gemini 2.5 Flash Image - TEXT only)
- **Image Generation:** ~$0.039 (Gemini 2.5 Flash Image - IMAGE output)
- **Total:** ~$0.041

### General Text Generation
- **Cost:** ~$0.0001 per request (Gemini 1.5 Flash - TEXT only)

### Prompt Generation
- **Cost:** ~$0.0001 per request (Gemini 1.5 Flash - TEXT only)

### Photo Validation
- **Cost:** ~$0.0001 per request (Gemini 1.5 Flash - TEXT only)
- **Usage:** Pre-validation before virtual try-on process

---

## Best Practices

### 1. Prompt Engineering
- Use specific, detailed instructions
- Include critical preservation rules
- Structure prompts for clarity
- Test and iterate on prompt effectiveness

### 2. Error Handling
- Always implement retry logic
- Log detailed error information
- Provide meaningful fallbacks
- Monitor API response patterns

### 3. Performance Optimization
- Choose appropriate models for tasks
- Optimize token usage
- Implement caching where possible
- Monitor response times

### 4. Cost Management
- Use text-only models for text tasks
- Optimize prompt length
- Monitor usage patterns
- Implement usage limits if needed

---

## Future Enhancements

### Current Status
- **v1.10.3:** Minimum SKU requirement reduced to 1
- **AI Category Extraction:** Successfully implemented
- **Batch Processing:** Fully functional with intermediate results
- **Interactive Thumbnails:** Working on frontend

### Potential Improvements
1. **Model Version Updates:** Keep models updated to latest versions
2. **Performance Optimization:** Implement caching mechanisms
3. **Cost Reduction:** Further optimize token usage
4. **Error Recovery:** Enhanced fallback mechanisms
5. **Monitoring:** Advanced analytics and monitoring

### Potential New Models
1. **Gemini 2.0:** When available for production use
2. **Specialized Models:** For specific fashion/retail use cases
3. **Local Models:** For cost-sensitive operations

---

## Maintenance & Updates

### Regular Tasks
- [ ] Monitor model performance
- [ ] Update to latest model versions
- [ ] Review and optimize prompts
- [ ] Analyze cost patterns
- [ ] Update documentation

### Version Control
- Document all model changes
- Track performance improvements
- Maintain backward compatibility
- Test thoroughly before deployment

---

## Contact & Support

**Project:** Ounass Look Creator  
**Version:** v1.10.6  
**Last Updated:** December 2024

For questions about AI model usage or configuration, refer to this documentation or contact the development team.

---

*This documentation is automatically updated with each deployment. Please ensure all changes to AI models or configurations are reflected in this document.*
