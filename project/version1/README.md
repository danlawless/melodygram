# Melodygram v1 - AI Music Creation App

A beautiful mobile-first music creation app that integrates with the Mureka API to provide AI-powered vocal synthesis and music generation.

## 🎵 Features

- **AI Singer Selection**: Browse and select from Mureka's extensive library of AI-powered vocal voices
- **Real-time API Integration**: Dynamically fetches singers and their details from Mureka API
- **Advanced Search & Filtering**: Search singers by name, style, or description with gender filtering
- **Responsive Design**: Mobile-first UI optimized for all devices
- **Loading States & Error Handling**: Robust error handling with fallback data
- **Modern UI/UX**: Beautiful gradient designs with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Mureka API account (optional - fallback data available)

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd project/version1
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables (optional):**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Mureka API credentials:
   ```env
   NEXT_PUBLIC_MUREKA_API_BASE_URL=https://useapi.net
   MUREKA_API_TOKEN=your_api_token_here
   MUREKA_ACCOUNT_ID=your_account_id_here
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000` to see the application.

## 🔧 Mureka API Integration

### Setting Up Mureka API

To get real-time singer data from Mureka, you'll need to:

1. **Create a Mureka account** at [mureka.ai](https://mureka.ai)
2. **Get your API credentials** following [this guide](https://useapi.net/docs/start-here/setup-mureka)
3. **Configure your environment variables** as shown above

### API Features Used

- **`GET /music/vocals`**: Fetches all available AI singers/voices
- **`GET /music/moods-and-genres`**: Gets available moods and genres
- **Search functionality**: Client-side filtering of vocal data

### Fallback Behavior

If API credentials are not provided or the API is unavailable, the app will:
- Display a curated list of sample singers
- Show all core functionality with mock data
- Provide the same user experience

## 📱 Usage

### Singer Selection

1. **Browse Singers**: View all available AI voices with their details
2. **Search**: Use the search bar to find singers by name, style, or genre
3. **Filter**: Apply filters by gender or voice characteristics
4. **Select**: Choose your preferred singer and continue to the next step

### Key Components

- **`SingerSelection`**: Main component for singer browsing and selection
- **`murekaApiService`**: Service layer for Mureka API integration
- **Error Boundaries**: Graceful error handling throughout the app

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **API Integration**: Mureka AI Platform

## 🎨 Design System

The app uses a custom design system with:

- **Color Palette**: Purple and pink gradients with dark/light themes
- **Typography**: Clean, modern font hierarchy
- **Components**: Reusable UI components with consistent styling
- **Animations**: Smooth transitions and micro-interactions

## 🔄 Development

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run lint`: Run ESLint

### Project Structure

```
project/version1/
├── app/
│   ├── components/
│   │   ├── singer/
│   │   │   └── SingerSelection.tsx    # Main singer selection component
│   │   └── creation/                  # Other creation components
│   ├── services/
│   │   └── murekaApi.ts              # Mureka API service layer
│   ├── globals.css                   # Global styles
│   ├── layout.tsx                    # App layout
│   └── page.tsx                      # Home page
├── package.json                      # Dependencies and scripts
└── README.md                         # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Mureka AI](https://mureka.ai) for providing the AI music generation API
- [Lucide](https://lucide.dev) for beautiful icons
- [Tailwind CSS](https://tailwindcss.com) for styling utilities

---

**Note**: This is a v1 implementation focusing on the singer selection feature. Additional music creation features will be added in future versions. 