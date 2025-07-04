/**
 * Entry point for the app
 * Ensures `global` is defined to prevent React Native Hermes errors
 * and registers the main App component with Expo.
 */

// Define `global` if missing (fixes "global not installed" error)
if (typeof global === 'undefined') {
  // @ts-ignore
  global = globalThis;
}

import { registerRootComponent } from 'expo';
import App from './App';

// Register main app component for Expo environment (Expo Go or native builds)
registerRootComponent(App);
