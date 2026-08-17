/**
 * Best-effort haptics. Supported on Android/Chrome; a silent no-op on iOS,
 * which never exposes the Vibration API to web pages.
 */
export function tap(pattern: number | number[] = 8): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* unsupported — ignore */
  }
}

export const haptics = {
  light: () => tap(6),
  medium: () => tap(14),
  success: () => tap([8, 40, 14]),
  error: () => tap([20, 60, 20]),
};
