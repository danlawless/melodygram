# Debug System for MelodyGram Generation

## Overview

A comprehensive debug logging system designed to capture and display all console logs during MelodyGram generation. This helps troubleshoot mobile generation errors and understand the complete flow of API calls.

## Features

### 🔍 **Complete Log Capture**
- Captures all `console.log`, `console.info`, `console.warn`, and `console.error` calls
- Preserves original console functionality (logs still appear in browser console)
- Maintains timestamps and log levels for each entry
- Automatically limits to last 500 logs to prevent memory issues

### 🎨 **Professional Debug Modal**
- Beautiful terminal-style interface with color-coded log levels
- Filter logs by type: ALL, LOG, INFO, WARN, ERROR
- Copy logs to clipboard with one click
- Download logs as `.txt` file with timestamp
- Clear logs functionality
- Responsive design for mobile debugging

### 🚀 **Easy Activation**
- **Method 1**: Add `?debug=true` to your URL (temporary)
- **Method 2**: Run `localStorage.setItem('melodygram_debug', 'true')` in console (persistent)
- **Method 3**: Use the debug button in the Studio header when debug mode is active

### 🎯 **Automatic Flow**
- Debug logging starts automatically when you hit "Generate MelodyGram"
- Captures all API calls, responses, and error handling
- Debug modal auto-opens 1 second after generation completes
- All logs are preserved until cleared

## How to Use

### Enable Debug Mode

**Quick Enable (URL method):**
```
https://yoursite.com/?debug=true
```

**Persistent Enable (Console method):**
```javascript
localStorage.setItem('melodygram_debug', 'true')
// Refresh the page
```

### Using the Debug Console

1. **Enable debug mode** using one of the methods above
2. **Navigate to Studio** - you'll see a green "Debug" button in the header
3. **Generate a MelodyGram** - logs will be captured automatically
4. **View logs** - debug modal opens automatically or click the Debug button
5. **Analyze the flow** - filter, copy, or download logs as needed

### Debug Modal Features

| Feature | Description |
|---------|-------------|
| **Filter Logs** | Click ALL/LOG/INFO/WARN/ERROR to filter by log level |
| **Copy Logs** | 📋 Copy all logs to clipboard for sharing |
| **Download Logs** | 💾 Download logs as timestamped .txt file |
| **Clear Logs** | 🗑️ Clear all captured logs |
| **Close Modal** | ❌ Close debug modal (logs remain captured) |

### Log Levels & Colors

- 🔴 **ERROR** - Red background, for critical errors
- 🟡 **WARN** - Yellow background, for warnings  
- 🔵 **INFO** - Blue background, for informational messages
- ⚪ **LOG** - Gray background, for general logs

## What Gets Captured

The debug system captures all logs from:

### 🎵 **Song Generation Process**
- Mureka API parameters and requests
- API responses and polling status
- Audio duration detection
- Waveform generation
- Audio clipping calculations

### 🖼️ **Avatar Generation Process**  
- LemonSlice API calls
- Image processing steps
- Upload progress
- Task polling and completion

### ⚠️ **Error Handling**
- Network errors and timeouts
- API authentication failures
- Rate limiting issues
- General generation failures

### 🔧 **System Information**
- Debug mode activation/deactivation
- Modal state changes
- Form validation results
- User interaction events

## Troubleshooting Mobile Issues

For the mobile generation error "Unable to generate song. Please check your content and try again":

1. **Enable debug mode** before attempting generation
2. **Try generating** on mobile - the error will still occur but logs will be captured
3. **Check the debug modal** for detailed error information:
   - Look for red ERROR entries
   - Check API response status codes
   - Examine network timeout messages
   - Review parameter validation issues

4. **Common mobile issues to look for**:
   - Network timeouts (mobile connections)
   - CORS issues with audio playback
   - Memory constraints during processing
   - Touch event handling problems

## Disable Debug Mode

**Temporary disable:**
Remove `?debug=true` from URL and refresh

**Permanent disable:**
```javascript
localStorage.removeItem('melodygram_debug')
// Or click "Disable debug mode" in the debug modal footer
```

## Privacy & Security

- ⚠️ **Debug logs may contain sensitive information** (API responses, user data)
- 🔒 **Debug mode is disabled by default** and must be explicitly enabled
- 🧹 **Logs are cleared on page refresh** unless manually saved
- 📱 **Works on all devices** including mobile for troubleshooting

## Development Notes

### Files Added:
- `app/services/debugLogger.ts` - Core logging service
- `app/components/debug/DebugModal.tsx` - Debug modal UI
- Updates to `app/components/creation/CreationStudio.tsx` - Integration

### Architecture:
- **Non-intrusive**: Original console methods are preserved
- **Performance optimized**: Limits log retention to prevent memory leaks  
- **User-friendly**: Clean UI with professional debugging tools
- **Mobile-ready**: Touch-friendly interface for mobile debugging

---

## Quick Start

1. Add `?debug=true` to your URL
2. Go to Studio and generate a MelodyGram  
3. Debug modal will auto-open with all logs
4. Use filters and export tools to analyze the issue

Perfect for troubleshooting the mobile generation error while maintaining a professional user experience! 🚀