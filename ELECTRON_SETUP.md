# Electron Desktop App Setup

This document explains how to run and build the Apple Supply Chain Intelligence desktop application using Electron.

## Prerequisites

- Node.js (v16 or higher)
- npm (comes with Node.js)
- Windows OS (for building .exe files)

## Project Structure

```
SCI/
├── electron/
│   ├── main.js          # Electron main process
│   └── preload.js       # Preload script for security
├── build/
│   ├── icon.ico         # Windows app icon (add your own)
│   └── icon.png         # App icon (add your own)
├── dist/                # Vite build output (generated)
├── dist-electron/       # Electron compiled files (generated)
├── release/             # Built executables (generated)
├── index.html           # App entry point
├── vite.config.ts       # Vite + Electron configuration
├── package.json         # Dependencies and scripts
└── electron-builder.json # Electron Builder configuration
```

## Development Mode

To run the app in development mode with hot reload:

```bash
# Option 1: Using the custom Electron dev script
npm run electron:dev

# Option 2: Using vite-plugin-electron (integrated)
npm run dev
```

This will:
- Start the Vite dev server on `http://localhost:3001`
- Launch Electron with the app
- Enable hot module replacement (HMR)
- Open DevTools automatically

## Building for Production

### Step 1: Build the Vite app

```bash
npm run build:vite
```

This creates optimized production files in the `dist/` directory.

### Step 2: Build the Electron executable

```bash
npm run build:electron
```

Or build everything at once:

```bash
npm run build
```

### Build Output

The built executables will be in the `release/` directory:

- **NSIS Installer**: `Apple Supply Chain Intelligence-1.0.0-x64.exe`
  - Standard Windows installer with installation wizard
  - Allows user to choose installation directory
  - Creates desktop and start menu shortcuts

- **Portable Version**: `Apple Supply Chain Intelligence-1.0.0-Portable.exe`
  - Standalone executable that requires no installation
  - Can be run from USB drives or any location
  - Stores settings in the executable's directory

## Environment Variables

The app uses environment variables for API keys. Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_api_key_here
```

The `.env` file is:
- Loaded by Vite during development
- Bundled with the production build (in extraResources)
- Accessible via the preload script

**Important**: Never commit your `.env` file to version control!

## NPM Scripts Reference

| Script | Description |
|--------|-------------|
| `npm run dev` | Run Vite dev server (browser mode) |
| `npm run electron:dev` | Run app in Electron with hot reload |
| `npm run build` | Build Vite app + create executable |
| `npm run build:vite` | Build only the Vite app |
| `npm run build:electron` | Build only the Electron executable |
| `npm run preview` | Preview production build in browser |

## Application Icons

To customize the application icon:

1. Create a high-resolution icon (512x512 or larger)
2. Convert to required formats:
   - **icon.ico** for Windows (256x256 recommended)
   - **icon.png** for macOS/Linux (512x512 recommended)
3. Place in the `build/` directory

You can use online tools or:

```bash
npm install -g electron-icon-maker
electron-icon-maker --input=./source-icon.png --output=./build
```

## Security Features

The Electron app implements several security best practices:

1. **Context Isolation**: Renderer process is isolated from Node.js
2. **Preload Script**: Safe bridge between main and renderer processes
3. **No Node Integration**: Renderer doesn't have direct Node.js access
4. **Content Security Policy**: Restricts resource loading
5. **External Link Protection**: Opens links in default browser
6. **Navigation Protection**: Prevents navigation to external sites

## Customization

### Window Properties

Edit `electron/main.js` to customize the window:

```javascript
const mainWindow = new BrowserWindow({
  width: 1400,        // Initial width
  height: 900,        // Initial height
  minWidth: 1024,     // Minimum width
  minHeight: 768,     // Minimum height
  // ... other options
});
```

### Build Configuration

Edit `electron-builder.json` to customize the build:

- App ID and product name
- Output directories
- Installer options
- Icon paths
- Extra resources

### Vite Configuration

Edit `vite.config.ts` to customize bundling:

- Server port and host
- Build options
- Plugin configuration
- Environment variables

## Troubleshooting

### Build fails with icon error
- Make sure `build/icon.ico` exists
- Or remove the `icon` field from `electron-builder.json` temporarily

### App won't start in dev mode
- Check if port 3001 is available
- Kill any running Vite/Electron processes
- Delete `node_modules` and run `npm install` again

### Hot reload not working
- Make sure you're using `npm run electron:dev`
- Check that the Vite dev server is running
- Try restarting the development session

### Environment variables not working
- Ensure `.env` file exists in the root directory
- Check that variables are prefixed correctly
- Restart the development server after changing `.env`

### Build creates huge executable
- This is normal - Electron bundles Chromium and Node.js
- Typical size: 150-250 MB
- Use the portable version for a single-file executable

## Distribution

After building:

1. Test the installer on a clean Windows machine
2. Test the portable version
3. Sign the executable (optional, for Windows SmartScreen)
4. Create a distribution package with:
   - The installer/portable exe
   - README with installation instructions
   - License file

## Development Tips

1. **Use DevTools**: Press `Ctrl+Shift+I` or use the View menu
2. **Reload App**: Press `Ctrl+R` to reload without restarting
3. **Check Console**: Both main and renderer processes have separate consoles
4. **Test Production**: Always test the built executable before distribution

## Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Vite Documentation](https://vitejs.dev/)
- [Security Best Practices](https://www.electronjs.org/docs/latest/tutorial/security)

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the Electron and Vite documentation
3. Check the GitHub issues for similar problems
