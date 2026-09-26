import { SUPPORT } from "@/lib/economy";

/** Official ScottyWorld channels — auto-created the first time the Channels page is opened. */
export const DEFAULT_CHANNELS = [
  { name: "ScottyWorld WhatsApp Group", platform: "WHATSAPP", kind: "GROUP", url: "https://chat.whatsapp.com/I7s0nsnwShA9cPLZcQVzJR?s=cl&p=a&mlu=4&ilr=4", description: "Chat with the community, get help and share ideas." },
  { name: "ScottyWorld WhatsApp Channel", platform: "WHATSAPP", kind: "CHANNEL", url: "https://whatsapp.com/channel/0029VbDV71RIN9ipC3dmGX0R", description: "Official announcements, drops and tech updates." },
  { name: "ScottyWorld WhatsApp Channel 2", platform: "WHATSAPP", kind: "CHANNEL", url: "https://whatsapp.com/channel/0029VbCuz94EwEjpo1O0aB0q", description: "More updates, bots and tutorials." },
  { name: "TikTok · @courage.cm", platform: "TIKTOK", kind: "PROFILE", url: "https://www.tiktok.com/@courage.cm", description: "Watch and follow for videos and giveaways." },
  { name: "Telegram · ScottyCode", platform: "TELEGRAM", kind: "CHANNEL", url: "https://t.me/ScottyCode", description: "Code, bots and resources on Telegram." },
] as const;

export const DEFAULT_TASKS = [
  { title: "Join the ScottyWorld WhatsApp group", platform: "WHATSAPP", kind: "JOIN", url: DEFAULT_CHANNELS[0].url, rewardCoins: 5, description: "Join the group, then screenshot the group page showing you're a member." },
  { title: "Follow the WhatsApp channel", platform: "WHATSAPP", kind: "FOLLOW", url: DEFAULT_CHANNELS[1].url, rewardCoins: 5, description: "Follow the channel and screenshot it showing 'Following'." },
  { title: "Follow the second WhatsApp channel", platform: "WHATSAPP", kind: "FOLLOW", url: DEFAULT_CHANNELS[2].url, rewardCoins: 5, description: "Follow the channel and screenshot it showing 'Following'." },
  { title: "Follow @courage.cm on TikTok", platform: "TIKTOK", kind: "FOLLOW", url: DEFAULT_CHANNELS[3].url, rewardCoins: 5, description: "Follow the profile and screenshot it showing 'Following'." },
  { title: "Join the Telegram channel", platform: "TELEGRAM", kind: "JOIN", url: DEFAULT_CHANNELS[4].url, rewardCoins: 5, description: "Join and screenshot the channel showing 'Joined'." },
] as const;

export const DEFAULT_FAQ: Array<{ question: string; answer: string; category: string }> = [
  { category: "Coins", question: "What are Scotty Coins (SC)?", answer: "Scotty Coins are the currency of ScottyWorld. Use them to renew bot hosting, buy items in the marketplace, unlock Pro, and send to friends. 20 SC = $0.50." },
  { category: "Coins", question: "How do I earn coins?", answer: "Complete tasks in Scotty Coins → Earn coins (follow channels, join groups, watch videos), invite friends with your referral link (6 SC per signup, 2 SC per click), or sell items in the marketplace." },
  { category: "Coins", question: "How do task rewards work?", answer: "Do the task, then upload a clear screenshot as proof. Our AI and admin team check it and your coins are added once approved. Fake, edited or reused screenshots are rejected and can lead to a ban." },
  { category: "Coins", question: "How do I send coins to someone?", answer: "Open Scotty Coins → Send, enter the person's 6-digit account number (shown on their wallet card), confirm their name, choose an amount and send." },
  { category: "Coins", question: "How do I deposit real money?", answer: "Open Scotty Coins → Deposit, choose an amount and follow the payment instructions. Coins are added after the payment is confirmed." },
  { category: "Bots", question: "How does bot hosting work?", answer: "Every bot is hosted free for 6 days. After that, renew for 20 SC per 6 days from the Bots page. If hosting ends, the bot shuts down until you renew." },
  { category: "Bots", question: "Can Scotty AI create a bot for me?", answer: "Yes. Open Bots → Generate with AI, pick features and Scotty AI builds a ready-to-run bot file. Generation is free during your first 4 days on ScottyWorld (and always free on Gold and Platinum)." },
  { category: "Marketplace", question: "Can I sell my own files?", answer: "Yes — anyone can sell bot files, templates, scripts and other digital items. ScottyWorld keeps a 5% fee on every sale; the rest goes to you in Scotty Coins." },
  { category: "Pro", question: "What do the Pro plans include?", answer: "Silver ($1), Bronze ($2), Gold ($3) and Platinum ($4) unlock more AI messages, bots, cloud storage, marketplace listings and task bonuses. Platinum gives full access to everything." },
  { category: "Account", question: "How do I keep my account safe?", answer: "Turn on two-factor authentication in Settings → Privacy & Security, and review your active sessions in the Security Center. Never share your password or codes." },
  { category: "Support", question: "How do I contact support?", answer: `Message us on WhatsApp ${SUPPORT.whatsapp} or send a ticket from Help & Support. We reply in ${SUPPORT.responseTime}.` },
];
