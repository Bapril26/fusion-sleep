// Web-only stand-in for @capacitor/core, used ONLY by the browser preview build.
// The real Android build uses the actual @capacitor/core package.
export const Capacitor = {
  isNativePlatform: () => false,
  getPlatform: () => 'web',
};
export function registerPlugin<T>(_name: string): T {
  return new Proxy({}, {
    get: (_t, prop) => (prop === 'addListener'
      ? async () => ({ remove: async () => undefined })
      : async () => undefined),
  }) as T;
}
