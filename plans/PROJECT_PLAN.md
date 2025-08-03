# MelodyGram - Project Plan & Technical Overview
*Transform Your Pictures Into Personalized Singing Experiences*

## 🎵 Project Overview

MelodyGram is an innovative AI-powered platform that combines music generation with animated talking avatars to create personalized singing experiences. Users upload a picture and lyrics, then our system generates a custom song and brings their photo to life as a singing avatar.

**The Magic Formula:** Picture + Lyrics = Singing Avatar with Custom Song

## 🔧 Technology Stack & APIs

### Music Generation: Mureka AI
- **Base URL**: `https://platform.mureka.ai/v1/`
- **Authentication**: Bearer token (expires every 30 days)
- **Key Endpoints**:
  - `POST /song/generate` - Generate song from lyrics
  - `POST /lyrics/generate` - Generate lyrics (optional helper)
  - `GET /song/{task_id}` - Check generation status
  - `POST /tts/generate` - Text-to-speech for vocals
  - `GET /music/refs` - Get reference tracks library
  - `GET /music/vocals` - Get available singer profiles
  - `POST /files/vocal` - Upload custom vocal reference
  - `GET /music/moods-and-genres` - Get available moods and genres

**Capabilities**:
- Lyrics-to-song generation with SkyMusic 2.0
- 20+ genres (pop, jazz, rock, electronic, etc.)
- Mood control (happy, sad, energetic, romantic, etc.)
- Tempo and key customization
- Voice synthesis with multiple vocal styles
- **Music Reference Library**: Browse and use demo tracks as style references
- **Singer Profiles**: Consistent AI singers with diverse vocal characteristics
- **Multi-language Support**: English, Japanese, Korean, Spanish, Portuguese
- Royalty-free commercial licensing

### Avatar Animation: LemonSlice
- **Base URL**: `https://lemonslice.com/api/` (API waitlist required)
- **Technology**: Real-time Diffusion Transformers (DiT)
- **Key Features**:
  - Zero-shot: Any image becomes talking avatar instantly
  - 25fps real-time streaming
  - Perfect lip-sync with audio
  - Works with any image style (photo, cartoon, artwork)
  - 10+ language support
  - 3-6 second end-to-end latency

## 🎨 Frontend Architecture for v0.dev

### Screen 1: Creation Studio
**Purpose**: Single-page creation workflow

**Key Components to Build**:

1. **ImageUpload Component**
   - Drag & drop zone for picture upload
   - Preview thumbnail with edit options
   - File validation (formats, size limits)
   - Crop/resize functionality

2. **LyricsEditor Component**
   - Large text area with character count (max 3000)
   - Auto-save functionality
   - Optional AI lyrics generation helper
   - Rhyme scheme suggestions

3. **MusicSettings Component**
   - Genre dropdown (pop, jazz, rock, electronic, etc.)
   - Mood selector (happy, sad, energetic, romantic, etc.)
   - Tempo slider (60-200 BPM)
   - Voice type selector (male/female, style variations)
   - Audio preview player

4. **ReferenceLibrary Component**
   - Searchable grid of reference tracks/demos
   - Play/pause controls for each reference
   - Filter by genre, mood, and popularity
   - "Use as Reference" button for each track
   - Upload custom reference track option

5. **SingerProfiles Component**
   - Grid layout of available AI singers
   - Voice preview for each singer (male/female)
   - Language support indicators
   - Consistent singer selection across projects
   - Vocal style characteristics display

6. **AvatarSettings Component**
   - Animation intensity slider
   - Background selection
   - Expression presets
   - Language selection for lip-sync

7. **GenerationFlow Component**
   - Step-by-step progress indicator
   - Real-time status updates
   - Preview functionality
   - Error handling and retry logic

**State Management**:
```javascript
const creationState = {
  image: null,
  lyrics: '',
  musicSettings: {
    genre: 'pop',
    mood: 'happy',
    tempo: 120,
    voice: 'female_pop'
  },
  referenceTrack: {
    id: null,
    title: '',
    artist: '',
    audioUrl: '',
    isCustomUpload: false
  },
  singerProfile: {
    id: 'en-US-sarah',
    name: 'Sarah',
    gender: 'female',
    language: 'en',
    style: 'pop',
    previewUrl: ''
  },
  avatarSettings: {
    animation: 'natural',
    background: 'studio',
    language: 'en'
  },
  generationStatus: 'idle' // idle, generating, complete, error
}
```

### Screen 2: Library & Gallery
**Purpose**: Browse, manage, and share created content

**Key Components to Build**:

1. **LibraryGrid Component**
   - Masonry/grid layout for video thumbnails
   - Infinite scroll or pagination
   - Filter and search functionality
   - Sort options (date, popularity, genre)

2. **MediaPlayer Component**
   - Full-screen video player
   - Audio controls and waveform visualization
   - Share functionality
   - Download options

3. **MetadataPanel Component**
   - Creation date and settings used
   - Lyrics display
   - Edit/regenerate options
   - Analytics (plays, shares)

## 🔄 Technical Implementation Flow

### 1. Content Creation Workflow
```
User Upload → Mureka API → LemonSlice API → Final Output
     ↓            ↓             ↓              ↓
  Image +      Generate      Create         Deliver
  Lyrics       Song          Avatar         Result
```

### 2. API Integration Sequence
1. **Load initial data** from Mureka:
   ```javascript
   GET /v1/music/refs          // Load reference tracks library
   GET /v1/music/vocals        // Load available singer profiles
   GET /v1/music/moods-and-genres  // Load available options
   ```

2. **User submits** image + lyrics + preferences + reference + singer
3. **Call Mureka API** to generate song:
   ```javascript
   POST /v1/song/generate
   {
     "lyrics": "user lyrics",
     "genre": "pop",
     "mood": "happy",
     "tempo": 120,
     "reference_track_id": "ref_123",  // Optional reference
     "singer_profile_id": "en-US-sarah", // Selected singer
     "language": "en"
   }
   ```
4. **Poll for completion** using task ID
5. **Call LemonSlice API** with image + generated audio:
   ```javascript
   POST /api/avatar/create
   {
     "image": "base64_image",
     "audio": "audio_file_url",
     "language": "en"
   }
   ```
6. **Stream result** to user in real-time

### 3. Data Flow Architecture
```
Frontend (React/Next.js)
    ↕
Backend API (Node.js/Python)
    ↕
External APIs (Mureka + LemonSlice)
    ↕
Database (User content, metadata)
    ↕
File Storage (Images, audio, videos)
```

## 🎯 v0.dev Implementation Guide

### Recommended Component Structure:
```
src/
├── components/
│   ├── creation/
│   │   ├── ImageUpload.tsx
│   │   ├── LyricsEditor.tsx
│   │   ├── MusicSettings.tsx
│   │   ├── ReferenceLibrary.tsx
│   │   ├── SingerProfiles.tsx
│   │   ├── AvatarSettings.tsx
│   │   └── GenerationFlow.tsx
│   ├── library/
│   │   ├── LibraryGrid.tsx
│   │   ├── MediaPlayer.tsx
│   │   └── MetadataPanel.tsx
│   └── shared/
│       ├── Header.tsx
│       ├── LoadingSpinner.tsx
│       ├── AudioPlayer.tsx
│       └── ErrorBoundary.tsx
├── pages/
│   ├── create.tsx
│   └── library.tsx
├── hooks/
│   ├── useImageUpload.ts
│   ├── useMurekaAPI.ts
│   ├── useReferenceLibrary.ts
│   ├── useSingerProfiles.ts
│   └── useLemonSliceAPI.ts
└── utils/
    ├── api.ts
    ├── audioUtils.ts
    └── constants.ts
```

### Key Technical Considerations:

1. **Real-time Updates**: Use WebSockets or Server-Sent Events for generation progress
2. **File Handling**: Implement proper image compression and audio processing
3. **Error Management**: Robust error handling for API failures and timeouts
4. **Responsive Design**: Mobile-first approach for cross-device compatibility
5. **Performance**: Lazy loading, image optimization, and efficient state management

### UI/UX Patterns to Implement:
- **Suno-inspired Library**: Grid layout with play-on-hover previews
- **Step-by-step Creation**: Progressive disclosure of options
- **Real-time Feedback**: Live preview and generation status
- **Reference Track Browser**: Searchable music library with instant preview
- **Singer Profile Showcase**: Visual grid with voice previews and characteristics
- **Social Features**: Easy sharing and community gallery

## 📋 Development Phases

### Phase 1: MVP (Minimal Viable Product)
- Basic image upload and lyrics input
- Simple Mureka integration for song generation
- **Reference Track Library**: Browse and select demo tracks
- **Singer Profile Selection**: Choose from AI vocalist library
- Static image with generated audio
- Basic library view

### Phase 2: Full Avatar Integration
- LemonSlice API integration
- Real-time avatar animation
- Advanced music customization
- Enhanced library features

### Phase 3: Social & Advanced Features
- User accounts and profiles
- Social sharing and community
- Advanced editing tools
- Analytics and insights

## 🔑 API Keys & Setup Requirements

### Mureka Setup:
1. Create account at [mureka.ai](https://mureka.ai)
2. Extract session token from browser dev tools
3. Configure API account via useapi.net platform
4. Token expires every 30 days (automated refresh needed)

### LemonSlice Setup:
1. Join API waitlist at [lemonslice.com](https://lemonslice.com)
2. Currently in beta - may need direct contact
3. Real-time streaming requires WebSocket support

## 🚀 Next Steps for v0.dev Implementation

1. **Start with Creation Studio** - Build the core upload and generation flow
2. **Focus on State Management** - Implement proper data flow between components
3. **API Integration Layer** - Create abstraction for external API calls
4. **Error Handling** - Build robust error states and user feedback
5. **Progressive Enhancement** - Start with basic features, add complexity gradually

## 🎵 Unique MelodyGram Features

### Music Reference Library
- **Curated Demo Collection**: Browse professionally created reference tracks
- **Style Matching**: Generate songs that match the vibe of selected references
- **Upload Custom References**: Users can upload their own reference tracks
- **Genre Discovery**: Explore new musical styles through the reference library
- **One-Click Selection**: Easy integration into the creation workflow

### AI Singer Profiles
- **Consistent Vocals**: Maintain the same singer voice across multiple projects
- **Diverse Roster**: Male and female voices across different styles and languages
- **Voice Previews**: Hear each singer before selection
- **Multi-language Support**: English, Japanese, Korean, Spanish, Portuguese singers
- **Sonic Branding**: Build brand consistency with signature vocal choices

## 💡 Key Success Factors

### User Experience
- **Simplicity First**: One-click creation process
- **Real-time Feedback**: Show progress at every step
- **Quality Output**: High-fidelity music and smooth animations
- **Fast Processing**: Minimize wait times through optimization
- **Creative Inspiration**: Reference library provides endless creative starting points

### Technical Excellence
- **Robust APIs**: Handle failures gracefully with retry logic
- **Scalable Architecture**: Design for growth and high traffic
- **Performance**: Optimize for mobile and slow connections
- **Security**: Protect user content and API credentials

### Business Model Considerations
- **Freemium Approach**: Free tier with premium features
- **Commercial Licensing**: Clear rights for user-generated content
- **API Costs**: Monitor and optimize external API usage
- **Storage Strategy**: Efficient media file management

This architecture provides a clear foundation for building MelodyGram with v0.dev while maintaining flexibility for future enhancements and optimizations.
