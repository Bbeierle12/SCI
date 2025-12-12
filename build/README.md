# Build Resources

This directory contains resources needed for building the Electron application.

## Required Files

- **icon.ico**: Windows application icon (256x256 or higher recommended)
- **icon.png**: Application icon for other platforms (512x512 or higher recommended)

## Icon Creation

You can create icons using tools like:
- [Electron Icon Maker](https://www.npmjs.com/package/electron-icon-maker)
- [Icon Generator](https://www.npmjs.com/package/icon-gen)
- Online converters

Or use the following npm script to generate icons from a source image:
```bash
npm install -g electron-icon-maker
electron-icon-maker --input=./source-icon.png --output=./build
```

## Placeholder

Until proper icons are added, the application will use Electron's default icons.
