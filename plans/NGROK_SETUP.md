# 🌍 Ngrok Setup for MelodyGram Development

## Why Ngrok?
When developing locally, LemonSlice API cannot access `localhost:3000` URLs. Ngrok creates a public tunnel to your local development server, allowing external APIs to access your locally generated files.

## 🚀 Quick Setup

### 1. Install ngrok (if not already installed)
```bash
# macOS with Homebrew
brew install ngrok/ngrok/ngrok

# Or download from https://ngrok.com/download
```

### 2. Authenticate ngrok (one-time setup)
```bash
ngrok config add-authtoken 30r8CtY5W81fupF2MdT7ggynMWW_5tzLSmwM2Wb8HZPFThrVG
```

### 3. Start Next.js Development Server
```bash
npm run dev
# Should start on http://localhost:3000
```

### 4. Start ngrok Tunnel (in a separate terminal)
```bash
ngrok http 3000
```

### 5. Update Environment Variable
Copy the HTTPS URL from ngrok output (e.g., `https://abc123.ngrok-free.app`) and update your `.env.local`:

```bash
NEXT_PUBLIC_NGROK_URL=https://YOUR-NGROK-URL.ngrok-free.app
```

## 🔧 Current Setup
Your current ngrok URL: `https://e9d839e3b493.ngrok-free.app`

**⚠️ Important**: This URL changes every time you restart ngrok (unless you have a paid plan with reserved domains).

## 🧪 Testing the Setup

1. **Test ngrok tunnel**:
   ```bash
   curl https://e9d839e3b493.ngrok-free.app/api/upload-audio-blob
   ```

2. **Test local API**:
   ```bash
   curl http://localhost:3000/api/upload-audio-blob
   ```

Both should return a similar response (probably a 405 Method Not Allowed for GET requests, which is expected).

## 🚀 Development Workflow

### Option A: With Ngrok (Full External Access)
1. Start Next.js: `npm run dev`
2. Start ngrok: `ngrok http 3000`
3. Update `NEXT_PUBLIC_NGROK_URL` with new ngrok URL
4. ✅ LemonSlice API can access your files

### Option B: Local Only (Faster Development)
1. Comment out or remove `NEXT_PUBLIC_NGROK_URL` from `.env.local`
2. Start Next.js: `npm run dev`
3. ⚠️ Files saved locally but LemonSlice API cannot access them
4. 🧪 Use dry run mode to test without actual API calls

## 🐛 Troubleshooting

### "404 Not Found" on ngrok URL
- Ensure Next.js is running on port 3000
- Restart ngrok: `ngrok http 3000`
- Update `NEXT_PUBLIC_NGROK_URL` with the new URL
- Restart Next.js development server

### "CORS Error"
- The upload endpoints have CORS headers configured
- Try using the fallback system (it should work automatically)

### "Access to fetch blocked by CORS"
- This usually means ngrok isn't properly tunneling to your Next.js server
- Check that both Next.js (port 3000) and ngrok are running
- Verify the ngrok URL in your browser: `https://your-ngrok-url.ngrok-free.app`

## 💡 Pro Tips

1. **Persistent URLs**: Upgrade to ngrok Pro for persistent URLs that don't change
2. **Multiple tunnels**: Run `ngrok http 3000 --region us` for better performance
3. **Local development**: Remove ngrok URL to develop faster without external dependencies
4. **Testing**: Use dry run mode to test generation flow without costs

## 🔄 Automatic Fallback

The app now includes automatic fallback:
- Tries ngrok first (if configured)
- Falls back to local API if ngrok fails
- Shows clear error messages for debugging

This means your app will work on localhost even if ngrok is misconfigured!