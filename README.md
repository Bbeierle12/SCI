<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Apple Supply Chain Intelligence

A desktop application for analyzing Apple's supply chain using AI-powered insights.

View your app in AI Studio: https://ai.studio/apps/drive/1YO7VVx96XhCyyQr0AhAcRei3IPpXH8JD

## Desktop Application (Electron)

This app runs as a native Windows desktop application using Electron.

### Quick Start

**Prerequisites:** Node.js (v16 or higher)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   # Copy the example file
   copy .env.example .env

   # Edit .env and add your Gemini API key
   notepad .env
   ```

3. **Run the app:**
   ```bash
   npm run dev
   ```

   Or double-click `start-electron.bat`

### Building for Distribution

Build Windows executables (.exe):

```bash
npm run build
```

Or double-click `build-electron.bat`

Output will be in the `release/` folder:
- NSIS Installer (with installation wizard)
- Portable executable (no installation needed)

### Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick reference for common tasks
- **[ELECTRON_SETUP.md](ELECTRON_SETUP.md)** - Complete setup and usage guide
- **[CONVERSION_SUMMARY.md](CONVERSION_SUMMARY.md)** - Details about the Electron conversion

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run in Electron window (development mode) |
| `npm run build` | Build React app + create Windows executable |
| `npm run build:vite` | Build only the React application |
| `npm run build:electron` | Create only the Windows executable |
| `npm run preview` | Preview production build in browser |

## Features

- Native Windows desktop application
- AI-powered supply chain analysis
- Dark theme interface
- Hot reload during development
- Offline capability (after build)
- No browser required

## Tech Stack

- **Frontend:** React 19, TypeScript
- **Styling:** Tailwind CSS
- **AI:** Google Gemini API
- **Desktop:** Electron
- **Build:** Vite, electron-builder
