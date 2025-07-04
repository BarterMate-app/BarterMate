// File: src/navigation/RootNavigation.ts
import { createNavigationContainerRef, NavigationState } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Navigate to a screen by name, optionally with params.
 * Safe to call only when navigation is ready.
 *
 * @param name - Screen name defined in RootStackParamList
 * @param params - Optional params for the route
 */
export function navigate<K extends keyof RootStackParamList>(
  name: K,
  params?: RootStackParamList[K]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}
