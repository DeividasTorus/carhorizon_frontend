# CarHorizon Frontend (Expo)

This repository contains a minimal Expo app scaffold for CarHorizon.

## Prerequisites
- Node.js (LTS recommended)
- npm (or Yarn)
- Optional: Android Studio / Xcode for emulators / simulators

## Setup and Run
1. Install dependencies:

```bash
npm install
# or
# yarn
```

2. Start the Expo dev server (after installing dependencies):

```bash
npx expo start
```

3. Run on a device or emulator:

- Open the project in Expo Go from your phone (scan QR code in the terminal) or use an emulator:

```bash
npx expo start --android
npx expo start --ios
npx expo start --web
```

## Notes
- This is a basic scaffold. To ensure compatibility with the latest SDK and templates, it's recommended to use `npx create-expo-app` or `npx expo init` if you want to reinitialize the project with a full starter template.
- This scaffold was updated to Expo SDK 54.0.0. You can run the interactive upgrade command to keep these packages in sync:

```bash
npx expo upgrade
```
or install the specific versions used in this scaffold:

```bash
npm install expo@^54.0.0 react@19.1.0 react-native@0.81.0
npx expo install
```
- Add icons and splash images in the `assets/` folder or update `app.json` for customization.

## Troubleshooting: dependency conflicts and ERESOLVE errors ⚠️

If `npm install` fails with ERESOLVE or reports conflicting dependency versions (for example, you see `expo@49.0.23` installed while `package.json` requires `^54.0.0`), follow these steps to clean and reinstall:

1. Remove `node_modules` and `package-lock.json` (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
```

2. Clean npm cache (optional but helpful):

```powershell
npm cache clean --force
```

3. Run the interactive Expo upgrade (recommended) to align dependencies with the correct SDK:

```powershell
npx expo upgrade
```

4. Install dependencies and fix versions with Expo helper:

```powershell
npm install
npx expo install
npx expo doctor
```

If `npx expo upgrade` doesn't finish or `npm install` still complains about peer dependency conflicts, you can try the fallback option (not recommended unless you know the risks):

```powershell
npm install --legacy-peer-deps
```

### Quick npm script for Windows PowerShell
We've added a `clean-install` script to `package.json` to do the cleanup and reinstall for you (PowerShell only):

```bash
npm run clean-install
```

### Dev client
If you use `expo-dev-client`, install it and re-add the import in `index.js`:

```powershell
npm install expo-dev-client
```

Then re-add `import 'expo-dev-client'` to `index.js`.

If you'd like me to actually run the upgrade steps here and update lockfiles in the repository, tell me to proceed and I'll apply the changes and provide a list of commands to run locally.
