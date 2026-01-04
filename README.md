# Cross-Platform Location App

A React Native application built with Expo that runs on Android and Web from a single codebase.

## Tech Stack
- **Framework**: React Native & Expo
- **Maps**: React Native Maps
- **Location**: Expo Location
- **Web Support**: React Native Web

## Features
- **Cross-Platform**: Works on Android and Web.
- **Location Tracking**: Fetches user's current latitude and longitude.
- **Interactive Map**: Displays user location on a map with a marker.
- **Responsive Layout**: Split screen design using Flexbox.

## Prerequisites
- Node.js (v14 or later)
- Expo Go app on Android (for testing)

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <https://github.com/ritiku2004/Radah-Genesis>
   cd location-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the project:**
   - **Web**:
     ```bash
     npx expo start --web
     ```
   - **Android**:
     ```bash
     npx expo start --android
     ```

## Building for Production

### Android (APK)
To build an APK using EAS Build:
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

### Web
To export static web files:
```bash
npx expo export --platform web
```
The output will be in the `dist` directory.

## Troubleshooting
- **Web Map Issues**: If the map does not load on web, ensure you have a valid Google Maps API key configured in `app.json` or fallback to OpenStreetMap if customized. For this demo, it attempts to load standard Google Maps.
