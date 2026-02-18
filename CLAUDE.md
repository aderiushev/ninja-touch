# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ninja-Msg is a peer-to-peer BLE (Bluetooth Low Energy) walkie-talkie messenger built with React Native and Expo. Two phones discover each other via BLE, negotiate roles (central vs peripheral), and exchange short text messages without internet.

## Commands

```bash
# Development
npx expo start                    # Start Expo dev server
npx expo run:ios                  # Build and run on iOS
npx expo run:android              # Build and run on Android

# Release
npm run release:js                # OTA update: bump patch version + publish via expo-updates
npm run release:store             # App Store: bump minor version + local iOS build + submit

# Version bumping
node scripts/bump-version.js patch|minor|major

# iOS native rebuild (after native dependency changes)
cd ios && pod install && cd ..
```

No test framework is configured.

## Architecture

### BLE Communication Stack

```
ChatScreen (UI) → useChat → useDiscovery → DiscoveryEngine
                                              ↓
                                    Central (scanner)  +  Peripheral (advertiser)
                                         ↓                      ↓
                                  react-native-ble-plx    Custom Expo native module
                                                          (modules/ble-peripheral/)
```

**Discovery protocol:** Both devices advertise and scan simultaneously. They compare randomly generated device IDs — the smaller ID becomes the central (connector), the larger becomes the peripheral (advertiser). This prevents connection conflicts.

**Message protocol:** Messages are fragmented by MTU (default 20 bytes). Each fragment has a 3-byte header: `[flag, msgID_high, msgID_low, ...payload]`. Flag `0x01` = more fragments, `0x00` = last fragment. Max message size: 512 bytes. Data is base64-encoded for BLE characteristic transport.

### Key Directories

- `src/ble/` — BLE protocol layer: discovery, central/peripheral roles, message fragmentation, base64 encoding
- `src/hooks/` — `useDiscovery` (BLE lifecycle), `useChat` (message state management)
- `src/components/` — Single-screen UI with neubrutalism design
- `src/theme.ts` — Design system: dark background, bright accents (yellow/pink/mint/cyan), hard shadows, thick borders, no border-radius
- `modules/ble-peripheral/` — Custom Expo native module for BLE peripheral mode (Swift for iOS, Kotlin for Android)

### BLE UUIDs (src/ble/constants.ts)

Service and characteristic UUIDs are defined in `constants.ts`. The message characteristic UUID is `00001338-0000-1000-8000-00805f9b34fb`.

### Platform Requirements

- **iOS:** Deployment target 15.1+, requires `NSBluetoothAlwaysUsageDescription` and `NSBluetoothPeripheralUsageDescription`
- **Android:** Min SDK 23, requires BLUETOOTH_SCAN, BLUETOOTH_CONNECT, BLUETOOTH_ADVERTISE, ACCESS_FINE_LOCATION permissions (requested at runtime in App.tsx)

## Tech Stack

- Expo ~54 with New Architecture enabled
- React Native 0.81, React 19.1
- TypeScript (strict mode)
- react-native-ble-plx for central role BLE
- expo-updates for OTA updates
- EAS Build for App Store submissions
