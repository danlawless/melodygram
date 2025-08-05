# Environment Setup Guide

This guide will help you set up the required environment variables for MelodyGram to work properly.

## Required API Keys

### 1. LemonSlice API (Avatar Generation)

**Status**: Required for avatar generation features
**Website**: https://lemonslice.com

```bash
LEMONSLICE_API_KEY=your_actual_lemonslice_api_key_here
```

**Setup Steps**:
1. Visit https://lemonslice.com
2. Join the API waitlist (required)
3. Once approved, get your API key from the dashboard
4. Add it to your environment variables

**Note**: The current fallback key (`sk-1990426d-aff0-4c6d-ab38-6aea2af25018`) is a placeholder and will cause 403 errors.

### 2. OpenAI API (Image Generation + Enhanced Lyrics)

**Status**: Required for AI image generation, **Optional** for enhanced lyrics generation
**Website**: https://platform.openai.com

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

**Features**:
- **Image Generation**: DALL-E integration for AI-generated avatars
- **Enhanced Lyrics**: GPT-4 powered lyrics with precise length control (Short/Medium/Long)
- **Smart Titles**: Auto-generated song titles from lyrics content

### 3. Mureka API (Music Generation + Basic Lyrics)

**Status**: Required for music generation, provides basic lyrics generation
**Website**: https://mureka.ai

```bash
MUREKA_API_KEY=your_mureka_api_key_here
```

## New Feature: Lyrics Length Control

The app now supports **Short/Medium/Long** lyrics generation with two modes:

### 🎵 Mureka Mode (Default)
- Creative, natural-flowing lyrics
- Enhanced with length guidance
- Works without OpenAI API key

### 🤖 GPT Mode (Enhanced)
- Precise word count control
- Structured song format (Intro/Verse/Chorus/Bridge/Outro)
- Better length consistency
- Requires OpenAI API key

**Length Options**:
- **Short**: 1-2 verses, 1 chorus (~100-200 words)
- **Medium**: 2 verses, 2 choruses, bridge (~200-400 words)  
- **Long**: 3+ verses, multiple choruses, bridge, outro (~400+ words)

## Setting Up Environment Variables

### Local Development

1. Create a `.env.local` file in your project root:
```bash
# .env.local
LEMONSLICE_API_KEY=your_actual_lemonslice_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
MUREKA_API_KEY=your_mureka_api_key_here
NEXT_PUBLIC_LEMONSLICE_API_BASE_URL=https://lemonslice.com/api
```

2. Restart your development server:
```bash
npm run dev
```

### Production Deployment

Set these environment variables in your hosting platform:
- **Vercel**: Project Settings > Environment Variables
- **Netlify**: Site Settings > Environment Variables
- **Docker**: Use `-e` flags or docker-compose environment section

## Troubleshooting

### 403 Forbidden Errors (LemonSlice)
- ✅ Check if `LEMONSLICE_API_KEY` is set correctly
- ✅ Verify your API key is valid and not expired
- ✅ Ensure you've joined the API waitlist at lemonslice.com
- ✅ Contact LemonSlice support if issues persist

### GPT Lyrics Not Working
- ✅ Verify `OPENAI_API_KEY` is set and valid
- ✅ Check OpenAI account has credits/billing set up
- ✅ App will fallback to Mureka mode if OpenAI fails
- ✅ Check browser console for detailed error messages

### Other Common Issues
- **Environment variables not loading**: Restart your development server
- **API keys not working**: Double-check for typos and trailing spaces
- **CORS errors**: Make sure you're using the Next.js API routes (not direct calls)

## Testing Your Setup

You can test your API configurations using the test components:
- Navigate to `/test` in your app
- Use the LemonSlice API Test component
- Try both Mureka and GPT lyrics generation modes
- Check the browser console for detailed error messages

## Cost Optimization Tips

- **GPT Mode**: More expensive but better control - use for important projects
- **Mureka Mode**: Cost-effective for most use cases
- **Short lyrics**: Use less tokens/credits than long lyrics
- **Test mode**: Use test API keys when available to avoid charges 