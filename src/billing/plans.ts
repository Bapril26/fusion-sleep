/**
 * Fusion Sleep Free vs Fusion Sleep Pro.
 *
 * No payment system is connected yet, so `getEntitlement()` reports the free
 * plan and `purchasePremium()` refuses. Nobody can be charged.
 *
 * TEST BUILDS ONLY: testers can switch on "Unlock Pro for testing" in
 * Settings → Tester tools. That switch only exists when the app is built with
 * VITE_TEST_BUILD=true (the GitHub test APK). Play Store builds never show it.
 *
 * To launch Pro on Google Play:
 *   1. Play Console → Monetise → Subscriptions: create
 *        fusion_sleep_pro  with base plans  monthly (R59.99) and yearly (R399.99),
 *        and a 7-day free-trial offer.
 *   2. Add a Google Play Billing plugin for Capacitor (for example RevenueCat's
 *      Capacitor SDK, or cordova-plugin-purchase).
 *   3. Implement getEntitlement / purchasePremium / restorePurchases below and
 *      verify purchases on a server before unlocking.
 */

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
export const TEST_BUILD = env.VITE_TEST_BUILD === 'true';

export const PLAN_NAME = 'Fusion Sleep Pro';

/** Recommended launch prices for South Africa (Google Play sets other countries from these). */
export const PRO_PRICES = {
  monthly: 'R59.99',
  yearly: 'R399.99',
  trialDays: 7,
};

export const FREE_LIMITS = {
  savedMixes: 3,
  mixLayers: 3,
  previewSeconds: 30,
  storiesPerDay: 1,
  storyMinutes: [5, 10] as number[],
};

export const PREMIUM_LIMITS = {
  savedMixes: Infinity,
  mixLayers: 6,
  storiesPerDay: 5,
  storyMinutes: [5, 10, 20, 30] as number[],
};

export const BILLING_CONFIGURED = false;

export interface Entitlement { premium: boolean; source: 'none' | 'google-play' | 'test' }

export async function getEntitlement(): Promise<Entitlement> {
  return { premium: false, source: 'none' };
}

export async function purchasePremium(): Promise<never> {
  throw new Error('Subscriptions are not available yet.');
}

export async function restorePurchases(): Promise<Entitlement> {
  return getEntitlement();
}
