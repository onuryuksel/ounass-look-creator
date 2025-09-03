# Ounass Look Creator 🎨

AI-powered outfit generator that creates realistic fashion photography from Ounass product SKUs.

## 🚀 Live Deployment

- **Production**: [ounass-look-creator-c3g3.vercel.app](https://ounass-look-creator-c3g3.vercel.app)
- **Preview (Dev)**: [Auto-deployed from dev branch](https://ounass-look-creator-c3g3-git-dev.vercel.app)

## 🏗️ Development Workflow

### Environment Strategy

```
main branch    → Production Environment
dev branch     → Preview Environment  
feature-*      → Feature Preview
```

### Making Changes

1. **Work on dev branch for preview testing:**
```bash
git checkout dev
git pull origin dev
# Make your changes...
git add .
git commit -m "Feature: description"
git push origin dev  # Auto-deploys to preview
```

2. **Deploy to production after testing:**
```bash
git checkout main
git merge dev
git push origin main  # Auto-deploys to production
```

### Quick Commands

```bash
npm run deploy:preview     # Push to dev branch
npm run deploy:production  # Push to main branch
npm run version:patch      # Bump patch version
```

## 🛠️ Technical Stack

- **Frontend**: HTML + React (via CDN) + Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **AI Services**: 
  - Google Gemini 2.5 Flash (Image Generation)
  - Google Gemini 1.5 Flash (Text Generation)
- **Deployment**: Vercel

## 📋 Features

- ✅ Multi-SKU product import (2-5 products)
- ✅ Dynamic category detection (Department/Class/SubClass)
- ✅ AI Art Director for scene enhancement
- ✅ Studio & Lifestyle photography modes
- ✅ High-resolution image generation
- ✅ Product preservation technology
- ✅ Download functionality
- ✅ Vercel Web Analytics integration
- ✅ Custom event tracking for user behavior

## 🔧 Environment Variables

Set these in Vercel dashboard for both environments:

```
OunassLookCreator=your_google_ai_studio_api_key
```

## 📈 Version History

- **v1.9.0**: Integrated Vercel Web Analytics with custom event tracking
- **v1.8.4**: API key updated to match Vercel environment (OunassLookCreator)
- **v1.8.3**: Fixed Vercel static site build configuration
- **v1.8.2**: API key renamed to OUNASS_LOOK_CREATOR_API_KEY
- **v1.8.1**: Separated text/image API endpoints
- **v1.7.2**: Enhanced category hierarchy (department/class/subClass)
- **v1.7.0**: Dynamic prompt generation
- **v1.6.1**: Initial release

## 🎯 Usage

1. Enter 2-5 Ounass product SKUs
2. Select preferred product images
3. Choose photography style:
   - **Studio**: Clean, professional background
   - **Lifestyle**: Custom location with AI-enhanced scene
4. Generate and download high-quality outfit visualization

## 🔄 API Endpoints

- `/api/gemini-image` - Image generation (60s timeout)
- `/api/gemini-text` - Text enhancement (30s timeout)

## 📊 Analytics

Vercel Web Analytics is integrated to track:

**Automatic Tracking:**
- Page views and visitor metrics
- Performance data and loading times

**Custom Events:**
- `fetch_images_started` - When user starts fetching product images
- `fetch_images_success` - When images are successfully loaded
- `prompt_generated` - When studio/lifestyle prompts are created
- `image_generated` - When AI successfully generates outfit image
- `image_downloaded` - When user downloads the generated image

**Data Available:**
- User journey flow (SKU input → Image selection → Prompt creation → Generation → Download)
- Performance metrics (API response times, image generation speed)
- Feature usage (Studio vs Lifestyle preference, product count patterns)
- Error tracking and conversion funnel analysis

---

**Team**: Test on preview environment before production deployment! 🧪
