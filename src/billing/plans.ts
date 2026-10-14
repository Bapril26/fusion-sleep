/**
 * Free vs Premium.
 *
 * No payment system is connected yet, so `getEntitlement()` always reports the
 * free plan and `purchasePremium()` refuses. Nobody can be charged.
 *
 * To launch subscriptions later through Google Play:
 *   1. Create a subscription product in Google Play Console (e.g. id
 *      "fusion_sleep_premium_monthly").
 *   2. Add a billing plugin that wraps Google Play Billing Library
 *      (for example a RevenueCat or cordova-plugin-purchase Capacitor plugin).
 *   3. Implement getEntitlement()/purchasePremium()/restorePurchases() below
 *      with that plugin, and verify purchases on a server before unlocking.
 * Every other part of the app already reads premium status from here.
 */

export const FREE_LIMITS = {
  savedMixes: 3,
  mixLayers: 3,
  previewSeconds: 30,
};

export const PREMIUM_LIMITS = {
  savedMixes: Infinity,
  mixLayers: 6,
};

export const BILLING_CONFIGURED = false;

export interface Entitlement { premium: boolean; source: 'none' | 'google-play' }

export async function getEntitlement(): Promise<Entitlement> {
  return { premium: false, source: 'none' };
}

export async function purchasePremium(): Promise<never> {
  throw new Error('Subscriptions are not available yet.');
}

export async function restorePurchases(): Promise<Entitlement> {
  return getEntitlement();
}
