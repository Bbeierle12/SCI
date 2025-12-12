# Quick Start Guide

## First Time Setup

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create environment file**:
   ```bash
   # Copy the example file
   copy .env.example .env

   # Edit .env and add your API key
   notepad .env
   ```

## Running the App

### Development Mode (Recommended for Testing)

**Option 1: Command Line**
```bash
npm run dev
```

**Option 2: Double-click**
- Double-click `start-electron.bat`

**What happens:**
- Vite dev server starts on port 3001
- Electron window opens automatically
- DevTools opens for debugging
- Hot reload is enabled (changes update instantly)

### Keyboard Shortcuts (in app)

- `Ctrl+R` - Reload the app
- `Ctrl+Shift+I` - Toggle DevTools
- `Ctrl+0` - Reset zoom
- `Ctrl++` - Zoom in
- `Ctrl+-` - Zoom out
- `Alt+F4` - Close app

## Building for Distribution

### Quick Build

**Option 1: Command Line**
```bash
npm run build
```

**Option 2: Double-click**
- Double-click `build-electron.bat`

### What You Get

After building, check the `release/` folder:

1. **NSIS Installer** (~150-250 MB)
   - `Apple Supply Chain Intelligence-1.0.0-x64.exe`
   - Full installation wizard
   - Creates desktop shortcut
   - Adds to Start Menu
   - Uninstaller included

2. **Portable Version** (~150-250 MB)
   - `Apple Supply Chain Intelligence-1.0.0-Portable.exe`
   - No installation needed
   - Run from anywhere
   - Perfect for USB drives

## Common Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | Run in Electron window (development) |
| `npm run build` | Build everything + create .exe |
| `npm run build:vite` | Only build the React app |
| `npm run build:electron` | Only create the .exe (requires build:vite first) |

## File Sizes

- **Development:** Uses ~200-300 MB RAM
- **Executable:** ~150-250 MB per .exe file
- **Installed:** ~300-400 MB on disk

This is normal for Electron apps (includes Chromium + Node.js).

## Testing Your Build

1. **Test the Installer:**
   - Run the NSIS installer .exe
   - Follow installation wizard
   - Launch app from desktop shortcut
   - Verify all features work
   - Test uninstaller

2. **Test the Portable:**
   - Copy portable .exe to new folder
   - Double-click to run
   - Verify it works without installation
   - Move to USB drive and test

## Distribution Checklist

Before sharing your app:

- [ ] Test on a clean Windows machine
- [ ] Verify API keys work
- [ ] Check all features function correctly
- [ ] Test both installer and portable versions
- [ ] Create README for users
- [ ] Consider code signing (for Windows SmartScreen)

## Troubleshooting

**App won't start in dev mode:**
```bash
# Kill any running processes
taskkill /F /IM node.exe
taskkill /F /IM electron.exe

# Clear cache and restart
npm run dev
```

**Build fails:**
```bash
# Clean build
npm run build:vite

# If successful, then:
npm run build:electron
```

**Port 3001 in use:**
- Edit `vite.config.ts` and change the port number
- Or kill the process using port 3001

## Need Help?

1. Check `ELECTRON_SETUP.md` for detailed documentation
2. Check `CONVERSION_SUMMARY.md` for what changed
3. Review `electron/main.js` for app configuration
4. Check the troubleshooting section in `ELECTRON_SETUP.md`

## Creating Desktop Shortcut for Dev Mode

**PowerShell (Run as Administrator):**
```powershell
.\create-dev-shortcut.ps1
```

This creates a "SCI Dev" shortcut on your desktop for quick access.

---

**That's it!** You're ready to develop and distribute your Electron app.
