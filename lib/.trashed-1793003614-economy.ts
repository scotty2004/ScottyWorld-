/**
 * Single source of truth for the ScottyCoins economy.
 * Change a number here and it changes everywhere (API + UI).
 */
export const ECONOMY = {
  /** 20 coins = $0.50  →  40 coins = $1 */
  COINS_PER_USD: 40,
  REFERRAL_REWARD: 6,
  REFERRAL_CLICK_REWARD: 2,
  /** anti-abuse: max rewarded clicks per referrer per 24h */
  REFERRAL_CLICK_DAILY_CAP: 10,
  /** admin/platform cut on every marketplace sale */
  MARKET_FEE_PERCENT: 5,
  /** every bot gets this many free days, then must be renewed with coins */
  BOT_FREE_DAYS: 6,
  BOT_RENEW_DAYS: 6,
  BOT_RENEW_COINS: 20,
  /** max WhatsApp numbers (devices) a person may keep paired to Scotty_C at once — enforced by the bot panel itself */
  BOT_DEVICE_LIMIT: 2,
  /** Scotty AI bot-file generator is free during the first N days of an account */
  BOT_GENERATOR_FREE_DAYS: 4,
  BOT_GENERATOR_COST: 10,
  MIN_TRANSFER: 1,
  MAX_TRANSFER: 100_000,
  MIN_DEPOSIT_USD: 1,
  MAX_DEPOSIT_USD: 500,
} as const;

export const usdToCoins = (usd: number) => Math.round(usd * ECONOMY.COINS_PER_USD);
export const coinsToUsd = (coins: number) => coins / ECONOMY.COINS_PER_USD;
export const formatUsd = (v: number) => `$${v.toFixed(2)}`;

export const SUPPORT = {
  whatsapp: "+263788114185",
  whatsappLink: "https://wa.me/263788114185",
  responseTime: "20 minutes to 2 hours",
} as const;

/** Platform cut on a sale (rounded up, never the whole price). */
export const marketFee = (price: number) => (price > 1 ? Math.ceil((price * ECONOMY.MARKET_FEE_PERCENT) / 100) : 0);
