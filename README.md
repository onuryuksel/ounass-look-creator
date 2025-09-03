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

## 🔧 Environment Variables

Set these in Vercel dashboard for both environments:

```
GEMINI_API_KEY=your_google_ai_studio_api_key
```

## 📈 Version History

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

---

**Team**: Test on preview environment before production deployment! 🧪
