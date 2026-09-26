/**
 * Plain-language legal pages shown in Settings → About.
 * These are sensible starting drafts — have them reviewed by a lawyer before launch and edit freely.
 */
export const LEGAL = {
  terms: {
    title: "Terms of Service",
    body: `By creating an account you agree to these terms.

1. Your account. You must give accurate information and keep your password and two-factor codes private. You are responsible for activity on your account.

2. Acceptable use. Don't post illegal, hateful, sexual-abuse, scam or malware content. Don't spam, harass others, impersonate people, or try to break, scrape or overload ScottyWorld.

3. Scotty Coins. Coins are a virtual in-app currency with no cash value outside ScottyWorld. Coins earned from tasks are subject to verification. Submitting fake, edited or duplicated proof, multiple accounts or referral abuse leads to rejected rewards and suspension. Deposits are non-refundable once coins are credited, unless required by law.

4. Marketplace. Sellers are responsible for the items they sell and must own the rights to them. ScottyWorld keeps a 5% fee on every sale. We may remove items that break these terms.

5. Bots. Bot hosting is provided as a service and can be paused when hosting time runs out. Use bots only on accounts you own and follow the rules of the platform they connect to (e.g. WhatsApp).

6. Pro plans. Paid plans last for the period purchased and are not automatically renewed.

7. Content. You keep ownership of what you post, and give ScottyWorld permission to display it in the app. We may remove content and suspend accounts that break these terms.

8. Availability. We work hard to keep ScottyWorld running but can't promise it will always be available or error-free.

Questions? Contact support from the Help & Support page.`,
  },
  privacy: {
    title: "Privacy Policy",
    body: `We collect only what we need to run ScottyWorld.

What we collect: your name, username, email, password (stored hashed — never in plain text), profile details you add, content you post, messages you send, wallet and marketplace activity, device/session information (browser, last active time) and screenshots you upload as task proof.

How we use it: to run your account, show your content, keep the platform secure, detect fraud and fake task submissions (including automated AI checks), and respond to support requests.

Sharing: your public profile and posts are visible to other members according to your privacy settings. We don't sell your personal data. Service providers (hosting, email, AI, storage and payment providers) process data on our behalf.

AI: messages you send to Scotty AI are processed by an AI provider to generate answers. Don't share passwords or secrets in chats.

Your controls: you can make your account private, block users, turn on two-factor authentication, review and end sessions, and delete content. To delete your account or get a copy of your data, contact support.

We keep data while your account is active and as required for security and legal reasons.`,
  },
  guidelines: {
    title: "Community Guidelines",
    body: `Be respectful. Help each other build and learn.

Do:
• Share useful projects, questions, ideas and news.
• Give credit and respect other people's work.
• Report content that breaks the rules.

Don't:
• Harass, threaten or discriminate against anyone.
• Post sexual content, graphic violence, or anything involving minors that is unsafe.
• Share scams, phishing, malware, stolen accounts or pirated paid software.
• Spam, buy/sell fake engagement, or run multiple accounts to farm coins.
• Share other people's private information.

Moderators may remove content, limit features or suspend accounts that break these guidelines.`,
  },
} as const;
