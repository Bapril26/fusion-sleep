// Web-only stand-in for @capacitor/app, used ONLY by the browser preview build.
export const App = {
  addListener: async (_event: string, _cb: () => void) => ({ remove: async () => undefined }),
  exitApp: async () => undefined,
  minimizeApp: async () => undefined,
};
