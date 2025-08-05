# Mureka MCP Server Setup

This project now uses the **official Mureka MCP server** for AI music generation integration with Cursor.

## 🎯 What's Installed

- **Official Mureka MCP Server** (Python-based) installed via `pip3 install mureka-mcp`
- Server provides tools for lyrics generation, song creation, and BGM generation
- Maintained by SkyworkAI/Mureka team: https://github.com/SkyworkAI/Mureka-mcp.git

## 🗑️ Cleanup Completed

The following custom MCP server files were **removed** since we're using the official server:

- `mureka-mcp-server/` directory (entire custom Node.js implementation)
  - `mureka-mcp-server/package.json`
  - `mureka-mcp-server/index.js` 
  - `mureka-mcp-server/README.md`
  - `mureka-mcp-server/setup.sh`

## 📋 Configuration Files

- `cursor-mcp-config.json` - Cursor MCP configuration (contains API key template)
- Added to `.gitignore` to prevent accidental API key commits

## 🔧 Setup Instructions

### 1. Configure Cursor MCP Settings

1. Open **Cursor Settings** (Cmd/Ctrl + ,)
2. Search for **"MCP"**
3. Add this configuration:

```json
{
  "mcpServers": {
    "mureka": {
      "command": "python3",
      "args": [
        "-m",
        "mureka_mcp"
      ],
      "env": {
        "MUREKA_API_KEY": "your-actual-mureka-api-key",
        "MUREKA_API_URL": "https://api.mureka.ai",
        "TIME_OUT_SECONDS": "300"
      }
    }
  }
}
```

### 2. Add Your API Key

- Get your API key from https://platform.mureka.ai/
- Replace `"your-actual-mureka-api-key"` with your real key

### 3. Restart Cursor

After saving the configuration, restart Cursor to load the MCP server.

## 🎵 Available Tools

Once configured, you can ask Cursor's AI assistant:

- **Generate Songs**: *"Create a pop song about friendship"*
- **Generate Lyrics**: *"Write lyrics about Christmas in rock style"*  
- **Generate BGM**: *"Create background music for a coffee shop"*
- **Check Status**: *"Check the progress of my song generation"*

## 🚀 Integration Status

- ✅ **Web App**: Direct API integration working (CreationStudio.tsx)
- ✅ **MCP Server**: Official server installed and configured
- ✅ **Storage**: Songs saved in localStorage (songStorage.ts)
- ✅ **MyScreen**: Real-time display of generated content

## 📚 References

- **Official MCP Server**: https://github.com/SkyworkAI/Mureka-mcp.git
- **Mureka API Docs**: https://platform.mureka.ai/docs/
- **MCP Protocol**: https://modelcontextprotocol.io/ 