# 🌿 PocketLedger — Smart Budget & Friend Money Tracker

> **PocketLedger** helps you manage daily expenses AND track money you lend to or borrow from friends (especially for boarding house / shared flat life), so you never forget who owes whom, how many times, and how much.

Built with **Next.js 16 (App Router)**, **TypeScript**, **PostgreSQL & Prisma**, **Auth.js**, **Tailwind CSS**, and the curated **Emerald Night** design system.

---

## ✨ Features

- 📊 **Excel-style Budget Sheet (`/budget`)**
  - Inline cell editing, keyboard navigation, and auto-calculating sticky footer totals.
  - Month tabs (Jan, Feb, Mar...) and custom category filtering.
  - Export to **Excel (XLSX)** and **CSV**.
  - Direct import from Excel/CSV files (`/api/budget/import`).
  - Manage custom categories with custom icons and color swatches (`/budget/categories`).

- 👥 **Friends & Money Ledger (`/friends`, `/friends/[id]`, `/ledger/new`)**
  - Track 4 transaction types: `I_GAVE` (lent), `I_BORROWED`, `THEY_REPAID`, `I_REPAID`.
  - Precise net balance calculations:
    - $\text{owedToMe} = \sum \text{I\_GAVE} - \sum \text{THEY\_REPAID}$
    - $\text{iOwe} = \sum \text{I\_BORROWED} - \sum \text{I\_REPAID}$
    - $\text{net} = \text{owedToMe} - \text{iOwe}$
  - Green for money owed to you, Red for money you owe.
  - Full chronological ledger timeline with running balance per transaction.
  - One-click **"Settle Up"** button that creates the exact balancing transaction and settles history.

- 💬 **Reminders (`/reminders`)**
  - **WhatsApp**: instant `wa.me` click-to-chat deep links with pre-filled polite reminder messages.
  - **Email**: HTML email notifications with balance highlights and full statement table.
  - Customizable reminder message templates for *"They owe me"*, *"I owe them"*, and *"All settled"*.
  - Anti-spam guard: prevents duplicate reminders to the same friend within 24 hours.
  - Complete reminder history log with channel status.

- 📈 **Reports & Analytics (`/reports`)**
  - Monthly Income vs. Expense comparison chart.
  - Category spending donut chart.
  - Daily spending bar charts.
  - Top pending friend balances.
  - Export reports to **PDF**, **Excel**, or **CSV**.

- ⚙️ **Settings & Data Privacy (`/settings`)**
  - Manage user profile, WhatsApp phone number, and avatar.
  - Multi-currency support (`LKR`, `USD`, `INR`, `EUR`, `GBP`, `SGD`, `AED`, `AUD`, `CAD`).
  - Light mode & Dark mode toggle (**Emerald Night** theme).
  - Change password securely (bcrypt).
  - **Complete JSON data export** (all budgets, categories, friends, transactions, and logs).
  - Permanent account deletion (Danger zone with confirmation).

- 📱 **Mobile PWA Ready**
  - Responsive mobile bottom bar and desktop sidebar.
  - `manifest.json` configured for "Add to Home Screen".

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- PostgreSQL database (Supabase, Neon, or local PostgreSQL)

### 2. Environment Setup
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Example `.env.local`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pocketledger"
NEXTAUTH_SECRET="your-generated-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Optional: Google OAuth
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Optional: Resend for Email Reminders
RESEND_API_KEY=""
EMAIL_FROM="PocketLedger <noreply@pocketledger.app>"
```

### 3. Database Migration & Client Generation
```bash
npx prisma db push
npx prisma generate
```

*(Optional) Seed initial demo user and default categories:*
```bash
npx tsx prisma/seed.ts
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Unit Tests
To run unit tests verifying ledger balance calculations and timeline logic:
```bash
npm test
```

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
pocketledger/
├── prisma/
│   ├── schema.prisma       # Database schema (PostgreSQL)
│   └── seed.ts             # Demo data & category seed script
├── public/
│   ├── favicon.ico
│   └── manifest.json       # PWA web manifest
├── src/
│   ├── app/
│   │   ├── (marketing)/    # Landing page (/)
│   │   ├── (auth)/         # Auth pages (login, signup, forgot-password)
│   │   ├── (app)/          # Protected app pages
│   │   │   ├── dashboard/  # Dashboard with summary & charts
│   │   │   ├── budget/     # Excel-style sheet & /budget/categories
│   │   │   ├── friends/    # Friends list & [id] detail page
│   │   │   ├── ledger/new/ # Quick-add lend/borrow form
│   │   │   ├── reminders/  # Reminders history
│   │   │   ├── reports/    # Reports, charts, PDF/Excel/CSV export
│   │   │   └── settings/   # Profile, preferences, templates, export, delete
│   │   ├── api/            # Route handlers (auth, budget, friends, ledger, etc.)
│   │   ├── globals.css     # Emerald Night design tokens
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   └── shared/AppShell.tsx # Sidebar, header, mobile bottom nav
│   ├── lib/
│   │   ├── auth.ts         # Auth.js / NextAuth configuration
│   │   ├── categories.ts   # Default categories
│   │   ├── email.ts        # Resend email templates & sender
│   │   ├── format.ts       # Currency, date, and name formatting
│   │   ├── ledger.ts       # Core ledger balance mathematics
│   │   ├── ledger.test.ts  # Unit tests for ledger math
│   │   ├── messages.ts     # Reminder message template engine
│   │   ├── prisma.ts       # Prisma Client singleton
│   │   └── validators.ts   # Zod validation schemas
│   └── middleware.ts       # Route protection middleware
└── package.json
```

---

## 🎨 Theme: Emerald Night

- **Primary Green**: `#0F9D78` (Light) / `#2DD4A4` (Dark)
- **Gold Accent**: `#F5B83D`
- **Income / They Owe Me**: `#16A34A` (Light) / `#4ADE80` (Dark)
- **Expense / I Owe Them**: `#E5484D` (Light) / `#FF6B70` (Dark)
- **Headings**: `Poppins` font
- **Body & Numbers**: `Inter` font with tabular numbers for currency formatting
