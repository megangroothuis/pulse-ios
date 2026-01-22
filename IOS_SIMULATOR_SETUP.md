# Running Pulse App in iOS Simulator

## Option 1: Web Version (Easiest - No Installation Required)
The web version is starting now. It should automatically open in your browser, or you can visit:
- http://localhost:19006

This gives you a quick preview of the app without needing Xcode.

## Option 2: iOS Simulator (Full Native Experience)

To run the app in the iOS Simulator, you need to install Xcode:

### Step 1: Install Xcode
1. Open the **App Store** on your Mac
2. Search for "Xcode"
3. Click "Get" or "Install" (it's free but large ~15GB)
4. Wait for installation to complete

### Step 2: Install Xcode Command Line Tools
After Xcode is installed, open Terminal and run:
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
```

### Step 3: Accept Xcode License
```bash
sudo xcodebuild -license accept
```

### Step 4: Run the App in Simulator
Once Xcode is installed, you can run:
```bash
cd ~/Desktop/PULSE
npm run ios
```

Or:
```bash
npx expo start --ios
```

This will:
- Start the Expo development server
- Automatically open the iOS Simulator
- Install and launch your app

### Step 5: Choose a Simulator
If multiple simulators are available, you'll see a menu. Choose an iPhone (e.g., iPhone 15 Pro).

## Troubleshooting

### If simulator doesn't open:
1. Open Xcode manually
2. Go to **Xcode > Settings > Platforms**
3. Download iOS simulator if needed
4. Or manually open Simulator: **Xcode > Open Developer Tool > Simulator**

### If you get "No devices found":
```bash
# List available simulators
xcrun simctl list devices available

# Boot a specific simulator
xcrun simctl boot "iPhone 15 Pro"
```

## Current Status
- ✅ Web version starting (check http://localhost:19006)
- ⏳ iOS Simulator requires Xcode installation
