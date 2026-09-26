export const integrationConfig = {
  ai: Boolean(process.env.OPENROUTER_API_KEY || process.env.AI_API_KEY),
  botRuntime: Boolean(process.env.BOT_RUNTIME_ENDPOINT && process.env.BOT_RUNTIME_SECRET),
  storage: Boolean(process.env.S3_ENDPOINT && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID),
  payments: Boolean(process.env.PAYMENT_PROVIDER && process.env.PAYMENT_SECRET),
  email: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
  push: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
  googleAuth: Boolean(process.env.GOOGLE_CLIENT_ID),
};
