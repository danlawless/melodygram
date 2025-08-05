# Local Development Setup Guide

## 🎯 Problem: Desktop Generation vs Mobile Generation

- **✅ Mobile**: Works because it uses external URLs (`https://cdn.mureka.ai/...`)
- **❌ Desktop/Local**: Fails because it uses `localhost` URLs that LemonSlice API can't access

## 🛠️ Solution: Use ngrok for External URL Access

### Step 1: Install ngrok
```bash
# Install ngrok (if not already installed)
npm install -g ngrok
# OR download from https://ngrok.com/
```

### Step 2: Start ngrok tunnel
```bash
# In a separate terminal, start ngrok tunnel to port 3000
ngrok http 3000
```

### Step 3: Set Environment Variable
Copy the ngrok URL from the terminal (e.g., `https://abc123.ngrok.io`) and set it:

**Option A: .env.local file**
```bash
# Create or edit .env.local file
NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
```

**Option B: Terminal export**
```bash
export NEXT_PUBLIC_BASE_URL=https://abc123.ngrok.io
npm run dev
```

### Step 4: Restart Development Server
```bash
npm run dev
```

## 🎉 Result

With this setup:
- **✅ Audio clipping works**: Uses external ngrok URL that LemonSlice can access
- **✅ Image proxying works**: Already configured for ngrok
- **✅ Both mobile and desktop work**: External URLs for both

## 🔄 Fallback Behavior

If you don't set up ngrok:
- **Desktop**: Will skip audio clipping and use full Mureka audio URL
- **Mobile**: Still works with external URLs
- **Warning**: Full audio is more expensive for LemonSlice API

## 🚀 Pro Tips

1. **Keep ngrok running**: The URL changes each restart unless you have a paid plan
2. **Update .env.local**: When ngrok URL changes, update the environment variable
3. **Free plan limit**: ngrok free plan has session limits, consider upgrading for heavy dev

## 🎯 Current Behavior

The app now automatically:
1. **Detects localhost**: Checks if running on local development
2. **Checks for external URL**: Looks for `NEXT_PUBLIC_BASE_URL`
3. **Smart fallback**: Uses original Mureka URL if no external access
4. **Logs guidance**: Console shows exactly what's happening and how to fix it

Your app will work in both scenarios - with or without ngrok setup! 🎵