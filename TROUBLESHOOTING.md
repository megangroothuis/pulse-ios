# Troubleshooting "Could not connect to server" Error

## The Issue
You're getting a "could not connect to server" error because the Metro bundler isn't starting properly, likely due to the EMFILE (too many open files) error on macOS.

## Solutions (try in order):

### Solution 1: Install Watchman (Recommended)
Watchman is Facebook's file watching service that solves the EMFILE issue:

```bash
# Install Homebrew if you don't have it:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install watchman:
brew install watchman
```

After installing watchman, restart the Expo server:
```bash
cd ~/Desktop/PULSE
npm start
```

### Solution 2: Manually Start Server to See Errors
Open a terminal and run:
```bash
cd ~/Desktop/PULSE
npx expo start --clear
```

This will show you the actual error messages so we can fix them.

### Solution 3: Increase File Limit (Temporary)
In your terminal, before starting Expo:
```bash
ulimit -n 4096
cd ~/Desktop/PULSE
npm start
```

### Solution 4: Use Web Version First
Try running the web version to test if the app works:
```bash
cd ~/Desktop/PULSE
npm run web
```

This will open the app in your browser and help isolate if it's a mobile-specific issue.

## Current Status
- ✅ Dependencies installed and fixed
- ✅ Code is correct (TypeScript checks pass)
- ✅ Images are in place
- ⚠️ Metro bundler needs watchman or file limit increase

## Next Steps
1. Try installing watchman (Solution 1) - this is the best long-term solution
2. If that doesn't work, manually start the server (Solution 2) and share the error output
3. Once the server is running, you should see a QR code and be able to connect
