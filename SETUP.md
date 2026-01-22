# Pulse App Setup Instructions

## Prerequisites

Make sure you have the following installed:
- Node.js (v16 or higher) - [Download](https://nodejs.org/)
- npm (comes with Node.js) or yarn
- Expo CLI (will be installed globally or via npx)

## Installation Steps

1. **Install dependencies:**
   ```bash
   npm install
   ```
   
   Or if you prefer yarn:
   ```bash
   yarn install
   ```

2. **Start the Expo development server:**
   ```bash
   npm start
   ```
   
   Or:
   ```bash
   yarn start
   ```

3. **Run on your device/simulator:**
   - **iOS Simulator**: Press `i` in the terminal (requires Xcode on macOS)
   - **Android Emulator**: Press `a` in the terminal (requires Android Studio)
   - **Physical Device**: 
     - Install the "Expo Go" app from App Store (iOS) or Play Store (Android)
     - Scan the QR code shown in the terminal

## Adding Playlist Cover Images (Optional)

The app works with gradient placeholders, but you can add custom cover images:

1. Add your cover images to `src/assets/images/`
2. Name them: `cover1.png`, `cover2.png`, `cover3.png`, etc.
3. Open `src/components/SetlistCard.tsx`
4. Uncomment the `require()` statements in the `defaultCoverImages` array
5. Add or remove entries to match your image files

Example:
```typescript
const defaultCoverImages: any[] = [
  require('../assets/images/cover1.png'),
  require('../assets/images/cover2.png'),
  require('../assets/images/cover3.png'),
];
```

## Project Structure

```
PULSE/
├── App.tsx                 # Main app entry with navigation
├── src/
│   ├── screens/            # Screen components
│   │   └── MixdownScreen.tsx
│   ├── components/         # Reusable components
│   │   ├── SessionCard.tsx
│   │   └── SetlistCard.tsx
│   ├── types/              # TypeScript definitions
│   │   └── index.ts
│   ├── data/               # Mock data
│   │   └── mockData.ts
│   └── assets/             # Images and assets
│       └── images/
└── package.json
```

## Troubleshooting

- **npm not found**: Install Node.js from [nodejs.org](https://nodejs.org/)
- **Expo CLI issues**: Try using `npx expo start` instead of `npm start`
- **Metro bundler errors**: Clear cache with `npx expo start -c`
- **Image loading issues**: Make sure image paths are correct and images are in the right format (PNG, JPG)

## Next Steps

- Build the Studio page for workout insights and playlist creation
- Build the You section for account management
- Add navigation between all pages
