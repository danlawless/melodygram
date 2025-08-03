# MelodyGram v0.dev Implementation Guide
*Based on Your Exact Wireframe Design*

## 📱 Overview: Mobile-First Music Creation App

You're building a sleek, dark-themed mobile music creation app that flows perfectly from creation to library. The wireframe shows two main sections:
- **MAIN APP** (Red Section): The core creation and music library experience
- **MY SECTION/SETTINGS** (Blue Section): User profile and settings management

## 🎯 Main App Flow (Red Section)

### Screen 1: Creation Studio - Upload & Lyrics
**What you're building:**
A clean, vertical creation interface with these key elements:

```
┌─────────────────────┐
│ Song Title          │ ← Header with song name input
│ [Input field]       │
├─────────────────────┤
│                     │
│     UPLOAD          │ ← Large, prominent upload area
│   [Photo Area]      │   Make this feel inviting to tap
│                     │
├─────────────────────┤
│ Lyrics    [Generate]│ ← Section header + AI button
│                     │
│ [Large text area    │ ← Scrollable lyrics input
│  for writing        │   Dark theme, good contrast
│  lyrics here...]    │   User can type OR use AI-generated
│                     │
├─────────────────────┤
│ Navigation Controls │ ← Three circular buttons
│ 🎤 🎵 🎶          │   Singer | Custom | Music
└─────────────────────┘
```

**v0.dev Implementation Notes:**
- Dark background (`#1a1a1a` or similar)
- Upload area should be large and visually prominent
- **Lyrics Editor Features:**
  - Large, comfortable textarea for manual lyrics entry
  - **"Generate" button** next to section header for AI lyrics generation
  - Generated lyrics populate the textarea and can be edited by user
  - Placeholder text: "Write your lyrics here or tap Generate for AI assistance"
- Three circular navigation buttons at bottom:
  - **🎤 Singer**: Navigate to AI vocalist selection
  - **🎵 Custom**: Navigate to reference tracks & customization
  - **🎶 Music**: Navigate to music library/browse
- Clean typography with good contrast for readability

### Screen 2-4: Selection Screens (Singer, Custom, Music)
**Bottom Navigation with Three Main Sections:**

#### Singer Selection Screen
```
┌─────────────────────┐
│ ← Singer            │ ← Back arrow + title
├─────────────────────┤
│ [Singer Avatar 1]   │ ← Grid of singer profiles
│ Name, Details       │   Each with photo, name, style
│                     │
│ [Singer Avatar 2]   │ ← Make these tappable cards
│ Name, Details       │   Show selected state clearly
│                     │
│ [Singer Avatar 3]   │ ← 2-3 singers per row
│ Name, Details       │   Voice preview on tap
├─────────────────────┤
│ [Generate Button]   │ ← Primary action button
└─────────────────────┘
```

#### Custom Options Screen
```
┌─────────────────────┐
│ ← Custom            │
├─────────────────────┤
│ Customize your sound│ ← Friendly header text
│                     │
│ [Reference Tracks]  │ ← Scrollable list of tracks
│ • Track 1 [▶]      │   Each with play button
│ • Track 2 [▶]      │   Show selection state
│ • Track 3 [▶]      │
│                     │
│ [Upload Reference]  │ ← Option to upload custom
├─────────────────────┤
│ [Generate Button]   │
└─────────────────────┘
```

#### Music Library Screen
```
┌─────────────────────┐
│ ← Music             │
├─────────────────────┤
│ New Songs           │ ← Section header
│                     │
│ [Song Card 1]       │ ← Cards with artwork
│ [Song Card 2]       │   Title, duration, play button
│ [Song Card 3]       │   Tappable for full view
│                     │
│ Your Creations      │ ← Another section
│ [Song Card 4]       │
│ [Song Card 5]       │
├─────────────────────┤
│ [+ Create] Button   │ ← Floating action button
└─────────────────────┘
```

### Screen 5: Playback View
**Full-screen song player:**
```
┌─────────────────────┐
│ Song Title          │ ← Clean header
│ Artist Name         │
├─────────────────────┤
│                     │
│   [Large Image/     │ ← Hero image/video area
│    Video Player]    │   Your singing avatar here
│                     │
├─────────────────────┤
│ ●●● Progress ●●●●   │ ← Progress indicator
├─────────────────────┤
│   ⏮  ⏸  ⏭        │ ← Media controls
│                     │   Large, easy to tap
└─────────────────────┘
```

## 👤 My Section/Settings (Blue Section)

### Profile Management Screens
The wireframe shows a comprehensive profile system:

```
┌─────────────────────┐
│ Profile             │ ← Main profile header
├─────────────────────┤
│ [Avatar] Don Lawless│ ← User photo + name
│ @username           │   Handle/username
├─────────────────────┤
│ My Subscriptions    │ ← Navigation items
│ My Downloads        │   Clean list design
│ Account Settings    │   Easy to scan and tap
│ Help & Support      │
│ Privacy Policy      │
├─────────────────────┤
│ [Settings Gear]     │ ← Settings access
└─────────────────────┘
```

## 🎨 Visual Design Direction for v0.dev

### Color Scheme
```css
:root {
  --bg-primary: #0a0a0a;      /* Deep black background */
  --bg-secondary: #1a1a1a;    /* Card/component backgrounds */
  --bg-accent: #2a2a2a;       /* Elevated surfaces */
  
  --text-primary: #ffffff;     /* Primary text */
  --text-secondary: #b3b3b3;   /* Secondary text */
  --text-muted: #666666;       /* Muted text */
  
  --accent-purple: #8b5cf6;    /* Brand purple */
  --accent-pink: #ec4899;      /* Brand pink */
  --accent-blue: #3b82f6;      /* Information blue */
}
```

### Component Styling
```css
/* Card Components */
.card {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 16px;
  border: 1px solid rgba(255,255,255,0.1);
}

/* Buttons */
.btn-primary {
  background: linear-gradient(135deg, var(--accent-purple), var(--accent-pink));
  color: white;
  border: none;
  border-radius: 24px;
  padding: 12px 24px;
  font-weight: 600;
}

/* Input Fields */
.input {
  background: var(--bg-accent);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 8px;
  color: var(--text-primary);
  padding: 12px 16px;
}
```

## 📱 Mobile-First Implementation Strategy

### 1. Start with the Core Flow
Build these screens in order:
1. **Creation Studio** - Upload + Lyrics input
2. **Singer Selection** - Choose AI vocalist
3. **Music Library** - Browse and play results
4. **Profile/Settings** - User management

### 2. Navigation Pattern
**Primary Flow Navigation (from Creation Studio):**
```jsx
// Three main paths from creation screen
const creationPaths = [
  { icon: '🎤', label: 'Singer', route: '/singers', description: 'Choose AI vocalist' },
  { icon: '🎵', label: 'Custom', route: '/custom', description: 'Reference tracks & styles' },
  { icon: '🎶', label: 'Music', route: '/library', description: 'Browse music library' }
];
```

**User Flow Logic:**
- User uploads photo + writes lyrics in Creation Studio
- Taps one of the three circular navigation buttons
- Each button leads to a different selection/customization path
- All paths eventually lead to generation and playback

### 3. Key UX Patterns
- **Swipe navigation** between creation steps
- **Pull-to-refresh** on library screens
- **Long-press** for additional options
- **Haptic feedback** on interactions
- **Loading states** with music-themed animations
- **AI Lyrics Generation**: 
  - Generate button shows loading spinner when processing
  - Generated lyrics appear with smooth animation
  - User can immediately start editing the generated content

## 🚀 Technical Implementation Notes

### LyricsEditor Component Details:
```jsx
// Key functionality for the lyrics editor
const LyricsEditor = () => {
  const [lyrics, setLyrics] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleGenerateLyrics = async () => {
    setIsGenerating(true);
    // Call Mureka API: POST /v1/lyrics/generate
    const generated = await generateLyrics();
    setLyrics(generated); // Populate textarea
    setIsGenerating(false);
  };
  
  return (
    <div className="lyrics-section">
      <div className="lyrics-header">
        <h3>Lyrics</h3>
        <button 
          onClick={handleGenerateLyrics}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
      <textarea
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        placeholder="Write your lyrics here or tap Generate for AI assistance"
        className="lyrics-input"
      />
      <div className="character-count">{lyrics.length}/3000</div>
    </div>
  );
};
```

### Essential Components to Build:
```
components/
├── creation/
│   ├── ImageUpload.tsx
│   ├── LyricsEditor.tsx        ← Manual entry + AI generation
│   └── PathNavigation.tsx      ← Three circular nav buttons
├── selection/
│   ├── SingerGrid.tsx          ← 🎤 Singer path
│   ├── ReferenceLibrary.tsx    ← 🎵 Custom path  
│   └── GenerateButton.tsx
├── library/
│   ├── SongCard.tsx            ← 🎶 Music path
│   ├── PlaybackView.tsx
│   └── LibraryGrid.tsx
└── profile/
    ├── ProfileHeader.tsx
    ├── SettingsList.tsx
    └── NavMenu.tsx
```

### State Management Structure:
```typescript
interface AppState {
  creation: {
    image: File | null;
    lyrics: string;
    isGeneratingLyrics: boolean;
    selectedSinger: Singer | null;
    referenceTrack: Track | null;
  };
  library: {
    userSongs: Song[];
    featuredSongs: Song[];
    currentPlaying: Song | null;
  };
  user: {
    profile: UserProfile;
    settings: UserSettings;
  };
}
```

## ✨ What Makes This Stunning

### 1. Seamless Flow
The wireframe shows a perfect user journey - from upload to finished singing avatar in just a few taps. Make each transition smooth and purposeful.

### 2. Visual Hierarchy
Each screen has clear focal points - the upload area, singer profiles, song cards. Use size, color, and spacing to guide the user's eye.

### 3. Consistent Design Language
Dark theme throughout, consistent spacing, similar card designs. Everything feels like part of the same beautiful system.

### 4. Touch-Optimized
All elements are sized for easy thumb navigation. Buttons are large enough, spacing prevents mis-taps, text is readable.

## 🎯 Success Metrics for v0.dev

You'll know you've nailed it when:
- ✅ **Intuitive**: Users know what to tap without thinking
- ✅ **Fast**: Smooth transitions, no lag between screens
- ✅ **Beautiful**: Looks as good as any top-tier music app
- ✅ **Functional**: Every element in the wireframe works perfectly
- ✅ **Delightful**: Small animations and feedback make it fun to use

This wireframe is your blueprint for building something that feels both professional and magical. Focus on making each screen pixel-perfect to this design, and you'll have created something truly special! 🎵✨ 