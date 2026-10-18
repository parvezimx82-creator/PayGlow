# PayGlow — Full-stack starter

A modular bilingual (Bangla/English) micro-job and referral platform starter built with:
- Node.js + Express REST API
- MySQL schema + transaction-oriented wallet service
- React + Vite frontend
- JWT authentication, bcrypt, rate limiting, Helmet, CORS allowlist
- Optional Telegram admin notifications

## Important setup notes
This is a **starter implementation**, not a deployment-certified financial platform. Before real-money launch, complete the production checklist below, run security tests, configure HTTPS/secrets/backups, and integrate a legitimate payment provider. Withdrawal records are tracked in the database; this starter does **not** automatically send money through bKash/Nagad/Rocket.

The "Gmail Sale" category is intentionally not implemented as account buying/selling. Use the task engine only for lawful tasks that do not require selling accounts, sharing passwords, or violating third-party terms.

## Requirements
- Node.js 20+
- MySQL 8+
- npm

## Backend
```bash
cd backend
cp .env.example .env
# Edit .env with database credentials and a long random JWT_SECRET
npm install
npm run db:init
npm run dev
```
API defaults to `http://localhost:4000/api`.

Create an admin by registering a user, then update their role in MySQL:
```sql
UPDATE users SET role = 'admin' WHERE username = 'your_username';
```

## Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `VITE_API_URL=http://localhost:4000/api` in `frontend/.env` if needed.

## Core API routes
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/me`
- `GET /api/wallet`
- `GET /api/tasks`
- `POST /api/tasks/:id/submissions`
- `GET /api/referrals/leaderboard`
- `POST /api/withdrawals`
- `POST /api/deposits` (manual payment claim; credits only after admin verification)
- `GET /api/history/ledger` and `/api/history/submissions`
- Admin: `GET /api/admin/deposits`, `POST /api/admin/deposits/:id/review`
- Admin: `/api/admin/tasks`, `/api/admin/submissions`, `/api/admin/withdrawals`, `/api/admin/users`

## Production checklist
- Use a managed MySQL instance with private networking and TLS.
- Put behind HTTPS reverse proxy; set `CORS_ORIGIN` to exact frontend origin.
- Store secrets in a secret manager, never commit `.env`.
- Add email verification, password reset, admin MFA, and independent security review. Admin deposit decisions are audit-logged. Use a strict reverse proxy and TLS.
- Proof-image binary upload is not enabled in this build; only text/URL proof is accepted. Before enabling binary uploads, add private object storage, MIME sniffing, size limits, malware scanning, and authenticated access.
- Add KYC/AML and local legal review if required for payouts; publish terms, privacy policy, dispute rules, and task policies.
- Deposit claims are manually reviewed and do not auto-credit funds. Withdrawal status “completed” is an admin bookkeeping action only; it does not send money. Integrate an authorized payment provider with signed webhook verification before automating deposits or payouts.
- Review referral abuse, duplicate accounts, chargebacks, and wallet ledger reconciliation.
- Add automated tests and load/security testing before production.


## Migration v2 Report (সম্পন্ন/অসম্পূর্ণ তালিকা)

**✅ সম্পন্ন (v2):**
- থিম সিস্টেম: `GET /api/settings/theme` (পাবলিক, রিফ্রেশ-পার্সিস্টেন্ট), `GET/PUT /api/admin/theme` (হেক্স+দিক ভ্যালিডেশন, অডিট লগ)
- টাস্ক ক্যাটাগরি: `GET/POST/PATCH/DELETE /api/admin/categories` + ৫টি ডিফল্ট ক্যাটাগরি সিড
- টাস্ক বিস্তারিত ফিল্ড: নির্দেশনা, লিংক, total/per-user লিমিট, শুরু-শেষ সময়, সিরিয়াল, Active/Paused/Closed
- সাবমিশন স্ট্যাটাস: pending → processing → approved/completed / rejected (idempotent, FOR UPDATE, ledger)
- ডিপোজিট: +১০ BDT ফি-প্রিভিউ (`GET /api/deposits/quote`), usdt/bitcoin মেথড, Pending/Processing/Completed/Rejected, লেজার-ক্রেডিট
- উইথড্রল: Processing/Completed/Rejected + tx_ref + অটো-রিফান্ড লেজার
- ইউজার স্ট্যাটস: `GET /api/user/stats`
- অ্যাডমিন ড্যাশবোর্ড: `GET /api/admin/dashboard`
- ফ্রন্টএন্ড: ভাষা-অনুযায়ী কারেন্সি (bn→৳, en→$), থিম CSS ভেরিয়েবল অটো-লোড

**⚠️ আংশিক / পরবর্তী ধাপ:**
- অ্যাডমিন থিম এডিটর UI (লাইভ প্রিভিউ ফর্ম) — API প্রস্তুত, UI বাকি
- ডিপোজিট ফর্মে ফি-প্রিভিউ বক্স — quote API প্রস্তুত
- ফিল্টার/রিপোর্ট CSV ডাউনলোড

**🔌 তৃতীয়-পক্ষ নির্ভর (ঘোষিত):**
- আসল bKash/Nagad/Rocket গেটওয়ে API ইন্টিগ্রেশন
- অন-চেইন ক্রিপ্টো ট্রানজ্যাকশন যাচাই (TxID ম্যানুয়াল অ্যাডমিন ভেরিফিকেশন — স্বয়ংক্রিয় 'completed' নিষিদ্ধ)


## PayGlow v2 UI Rebuild (রেফারেন্স-ডিজাইন)

- **পুরো ফ্রন্টএন্ড রিবিল্ড** (main.jsx + styles.css): হেডার (হ্যামবার্গার/লোগো/নোটিফিকেশন/প্রোফাইল), ২৮-আইটেম স্লাইড সাইডবার (রিয়েল ব্যালেন্সসহ), হোম (গ্রিন গ্রেডিয়েন্ট ব্যানার, ব্যালেন্স কার্ড, Telegram/YouTube, গাইড কার্ড, ৩-কলাম সার্ভিস গ্রিড, সাপোর্ট কার্ড), বটম নেভ, ব্যাক বাটন
- **ফন্ট:** Hind Siliguri (বাংলা) + Inter (English), index.html-এ লোড
- **কারেন্সি:** bn → ৳, en → $ (single money() helper)
- **FB/IG/Gmail ধাপ-ফ্লো অক্ষত:** FB = UID (14–16) → Cookies (c_user/datr) → সাবমিট · IG = 2FA Key → সার্ভার TOTP কোড + কপি → সাবমিট · Gmail = সরাসরি সাবমিট (নতুন `GET /api/tasks/totp`)
- **থিম:** অ্যাডমিন থিম এডিটর (লাইভ প্রিভিউ + সেভ + রিসেট), CSS ভেরিয়েবল, রিফ্রেশ-পার্সিস্টেন্ট
- **ডিপোজিট:** মেথড চিপ (bKash/Nagad/Rocket/USDT/BTC), `GET /api/deposits/quote` দিয়ে +১০ BDT ফি প্রিভিউ, TxID, Pending/Processing/Completed/Rejected ব্যাজ
- **Admin ট্যাব:** Dashboard (14 স্ট্যাট), Submissions/Deposits/Withdrawals রিভিউ (কারণসহ রিজেক্ট), Users, Categories CRUD, New Task ফর্ম (লিমিট/সময়সূচীসহ), Theme
- **নতুন এন্ডপয়েন্ট:** GET /api/user/stats, GET /api/user/submissions, GET /api/tasks/totp, GET /api/settings/theme, admin theme/categories/dashboard (v2)

**টেস্ট নোট:** ব্যাকএন্ড `node --check` ✅। ফ্রন্টএন্ড বিল্ডের জন্য `frontend`-এ `npm i && npm run build` চালান (নতুন ডিপেনডেন্সি লাগেনি)। পেমেন্ট গেটওয়ে/চেইন-ভেরিফিকেশন তৃতীয়-পক্ষ API-নির্ভর — ম্যানুয়াল অ্যাডমিন ভেরিফিকেশন বজায়।
