# PocketLedger — A to Z Build Prompt

> Copy this whole file into your AI coding tool (Claude Code, Cursor, etc.) and say:
> **"Read this spec fully and build the application phase by phase. Finish and test each phase before starting the next."**

---

## 1. Project Summary

**App name:** PocketLedger
**Type:** Responsive web portal (works well on phone and desktop)
**Purpose:** Manage daily budget AND track money that I lend to / borrow from friends (boarding house life), so I never forget who owes whom, how many times, and how much. Send friends a reminder by **Email** or **WhatsApp**.

**Main user problem:**
> "In my boarding house I give money to friends and friends give money to me. I forget how many times and how much. I want one place that records everything, shows the net balance per friend, and lets me send a message like *'You owe me Rs. 1,500'* or *'I owe you Rs. 800'*."

---

## 2. Core Features (Modules)

1. **Authentication & Account Creation**
2. **Home Dashboard**
3. **Budget Sheet** (Excel-like editable grid)
4. **Friends & Money Ledger** (lend / borrow tracker)
5. **Reminders** (Email + WhatsApp)
6. **Reports & Export** (CSV / Excel / PDF)
7. **Settings & Profile**

---

## 3. Recommended Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui + lucide-react icons |
| Database | PostgreSQL (Supabase or Neon) |
| ORM | Prisma |
| Auth | Auth.js (NextAuth) — Email+Password and Google login |
| Spreadsheet grid | TanStack Table + inline editing (or AG Grid Community) |
| Charts | Recharts |
| Email | Resend (or Nodemailer + SMTP) |
| WhatsApp | Phase 1: `wa.me` click-to-chat link (free, no API). Phase 2 (optional): WhatsApp Cloud API |
| Export | SheetJS (xlsx), jsPDF |
| Validation | Zod |
| Forms | React Hook Form |
| Deploy | Vercel + Supabase/Neon |

---

## 4. Theme & Design System (my choice)

**Theme name:** *Emerald Night*
Calm, money-positive green with a warm gold accent. Light mode default, dark mode supported.

### Color tokens

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | `#F6FAF8` | `#0B1412` | Page background |
| `--surface` | `#FFFFFF` | `#121F1B` | Cards |
| `--surface-2` | `#EAF3EF` | `#1A2B26` | Table headers, hover |
| `--primary` | `#0F9D78` | `#2DD4A4` | Buttons, links, active nav |
| `--primary-dark` | `#0A6E54` | `#0F9D78` | Hover |
| `--accent` | `#F5B83D` | `#F5B83D` | Highlights, badges, FAB |
| `--income / they-owe-me` | `#16A34A` | `#4ADE80` | Positive money |
| `--expense / I-owe-them` | `#E5484D` | `#FF6B70` | Negative money |
| `--text` | `#10231D` | `#E6F4EE` | Main text |
| `--muted` | `#6B7F77` | `#8FA89F` | Secondary text |
| `--border` | `#D8E6E0` | `#243832` | Borders |

### Typography
- Headings: **Poppins** (600/700)
- Body & numbers: **Inter** (use tabular numbers for money)

### UI rules
- Rounded corners `12px`, soft shadow, 8px spacing grid.
- Green = money coming to me, Red = money I must pay. Always use this consistently.
- Mobile-first: bottom navigation on phone, left sidebar on desktop.
- Floating "+" button (gold) for quick add on every main page.
- Currency is configurable in settings (default: LKR, support USD, INR, SGD, etc.). Format using `Intl.NumberFormat`.

---

## 5. Database Schema (Prisma)

```prisma
model User {
  id            String   @id @default(cuid())
  name          String
  email         String   @unique
  passwordHash  String?
  phone         String?              // WhatsApp number with country code
  currency      String   @default("LKR")
  theme         String   @default("light")
  createdAt     DateTime @default(now())
  budgets       BudgetEntry[]
  categories    Category[]
  friends       Friend[]
  transactions  LedgerTransaction[]
  reminders     ReminderLog[]
}

model Category {
  id      String @id @default(cuid())
  userId  String
  name    String
  type    EntryType            // INCOME or EXPENSE
  color   String?
  icon    String?
  user    User   @relation(fields: [userId], references: [id])
  entries BudgetEntry[]
}

model BudgetEntry {            // rows of the Excel-like sheet
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  title       String
  categoryId  String?
  type        EntryType        // INCOME / EXPENSE
  amount      Decimal  @db.Decimal(12,2)
  method      String?          // Cash, Card, Bank, Wallet
  note        String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id])
  category    Category? @relation(fields: [categoryId], references: [id])
}

model Friend {
  id        String @id @default(cuid())
  userId    String
  name      String
  email     String?
  phone     String?            // WhatsApp number
  note      String?
  archived  Boolean @default(false)
  user      User   @relation(fields: [userId], references: [id])
  transactions LedgerTransaction[]
  reminders ReminderLog[]
}

model LedgerTransaction {      // every single lend/borrow/repay
  id        String   @id @default(cuid())
  userId    String
  friendId  String
  direction LedgerDirection    // I_GAVE, I_RECEIVED(borrowed), THEY_REPAID, I_REPAID
  amount    Decimal  @db.Decimal(12,2)
  date      DateTime
  reason    String?
  dueDate   DateTime?
  settled   Boolean  @default(false)
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  friend    Friend   @relation(fields: [friendId], references: [id])
}

model ReminderLog {
  id        String   @id @default(cuid())
  userId    String
  friendId  String
  channel   Channel            // EMAIL or WHATSAPP
  message   String
  status    String             // SENT, OPENED, FAILED
  sentAt    DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  friend    Friend   @relation(fields: [friendId], references: [id])
}

enum EntryType { INCOME EXPENSE }
enum LedgerDirection { I_GAVE I_BORROWED THEY_REPAID I_REPAID }
enum Channel { EMAIL WHATSAPP }
```

---

## 6. Ledger Logic (very important)

For each friend, compute the **net balance**:

Use this exact rule:

```
owedToMe  = Σ I_GAVE      − Σ THEY_REPAID
iOwe      = Σ I_BORROWED  − Σ I_REPAID
net       = owedToMe − iOwe
```

- `net > 0` → **"Friend owes me Rs. X"** (green)
- `net < 0` → **"I owe friend Rs. X"** (red)
- `net = 0` → **"All settled ✅"**

Also show per friend:
- Number of times I gave (count)
- Number of times I borrowed (count)
- Total ever given / total ever borrowed
- Last transaction date
- Full history timeline

Support **partial repayments** and a **"Settle up"** button that creates the balancing transaction and marks all as settled.

---

## 7. Pages & Routes

```
/                      → Landing page (short intro + Login / Sign up)
/auth/signup           → Account creation
/auth/login            → Login
/auth/forgot-password  → Reset password via email
/dashboard             → Home screen
/budget                → Excel-like budget sheet
/budget/categories     → Manage categories
/friends               → Friends list with balances
/friends/[id]          → Friend detail + ledger history + send reminder
/ledger/new            → Quick add lend/borrow/repay form (also a modal)
/reminders             → Reminder history
/reports               → Monthly report, charts, export
/settings              → Profile, currency, theme, password, delete account
```

---

## 8. Screen-by-Screen Specification

### 8.1 Account Creation (`/auth/signup`)
Fields: Full name, Email, WhatsApp number (optional, with country code picker), Password (min 8, strength meter), Confirm password, Preferred currency.
- Zod validation + inline errors.
- "Continue with Google" button.
- After signup: auto-create default categories (Food, Transport, Rent, Bills, Shopping, Health, Study, Fun, Salary, Allowance, Other).
- Send a welcome email. Redirect to `/dashboard` with a 3-step onboarding tip card (Add budget → Add friend → Record first lend).

### 8.2 Home Screen / Dashboard (`/dashboard`)
Top → bottom:
1. **Greeting bar:** "Good evening, {name}" + month selector.
2. **Summary cards (4):** Balance this month · Total Income · Total Expense · Net with friends.
3. **Friends Money Snapshot (two big cards):**
   - 🟢 *Friends owe me:* total + count of friends
   - 🔴 *I owe friends:* total + count of friends
4. **Charts:** Expense by category (donut), Daily spending (line/bar for the month).
5. **Top 5 people** with the largest pending balance, each with a quick **"Remind"** button.
6. **Recent activity** (last 10 budget + ledger items mixed).
7. **Overdue alerts** (ledger items past due date).
8. Gold floating "+" button → Quick add (Expense / Income / Gave money / Borrowed money / Repayment).

### 8.3 Budget Sheet — Excel-style (`/budget`)
A spreadsheet-like grid with these columns:

| Date | Title | Category | Type | Amount | Method | Note | Running Balance |

Requirements:
- **Inline cell editing** (click a cell to edit, Enter to save, Tab to move right, Esc to cancel).
- **Add row** at the bottom (always one empty row ready) and with keyboard shortcut `Ctrl+Enter`.
- **Sort, filter, search**, group by date or category.
- **Month tabs** at the bottom like Excel sheets (Jan, Feb, Mar…) plus a "+ New month".
- **Footer totals row:** total income, total expense, balance (auto-calc, sticky).
- Color amounts: income green, expense red.
- Row actions: duplicate, delete (with undo toast).
- Bulk select + delete.
- Copy/paste from Excel supported.
- **Daily budget limit:** set a daily limit; rows/days that exceed it highlight in red and the day shows "Over by X".
- Import CSV/XLSX, export XLSX/CSV.
- Auto-save with a "Saved ✓" indicator.

### 8.4 Friends List (`/friends`)
- Search bar + filter chips: All · They owe me · I owe them · Settled.
- Card/list per friend: avatar (initials), name, balance with color, number of transactions, last activity.
- **Add friend** modal: name, WhatsApp, email, note.
- Tap a friend → detail page.

### 8.5 Friend Detail (`/friends/[id]`)
- Header: avatar, name, contacts, **big net balance** ("Kasun owes you Rs. 2,500").
- Stats: times I gave · times I borrowed · total given · total borrowed.
- **Action buttons:** `+ I gave` · `+ I borrowed` · `They paid me` · `I paid them` · `Settle up`.
- **Timeline / table of every transaction** with date, type, amount, reason, running balance, edit/delete.
- **Send Reminder panel** (see section 9).

### 8.6 Quick Add Ledger Form (modal)
Fields: Friend (searchable select or "+ new"), Direction (4 segmented buttons with colors), Amount, Date (default today), Reason, Due date (optional).
Show a live preview: *"After this, Kasun will owe you Rs. 3,000."*

### 8.7 Reminders (`/reminders`)
Table of everything sent: date, friend, channel, message preview, status. "Resend" button.

### 8.8 Reports (`/reports`)
- Month/Year picker.
- Income vs Expense bar chart, category breakdown, top spending days.
- Friend ledger summary table.
- Export buttons: PDF, Excel, CSV.

### 8.9 Settings (`/settings`)
Profile (name, phone, avatar), currency, light/dark theme, default reminder message templates, change password, export all my data, delete account.

---

## 9. Reminder & Messaging System

### Message templates (editable in Settings)
**They owe me:**
```
Hi {friend}, hope you're doing well! 😊
Just a gentle reminder — you owe me {currency} {amount}.
Details: {count} transactions, last on {lastDate}.
Please send it when you can. Thanks!
— {myName}
```
**I owe them:**
```
Hi {friend}, I'm noting that I owe you {currency} {amount}.
I'll pay it back by {date}. Thanks for helping me! 🙏
— {myName}
```
**Settled:**
```
Hi {friend}, all settled between us ✅ Thanks!
```
Optional: attach a **full statement** listing each transaction (date, reason, amount).

### Channels
1. **WhatsApp (Phase 1):** open `https://wa.me/{phoneDigitsOnly}?text={encodeURIComponent(message)}` in a new tab. Log it as `SENT`.
2. **WhatsApp (Phase 2, optional):** WhatsApp Cloud API with approved message templates — requires Meta Business account.
3. **Email:** server route `POST /api/reminders/email` using Resend; HTML email with the Emerald Night look, balance highlighted, and statement table.

### UX
- Reminder panel shows: channel toggle (Email / WhatsApp), editable message preview, "Send" button.
- Show **"Send to all who owe me"** bulk action with a confirm dialog.
- Prevent spam: warn if a reminder was sent to the same friend in the last 24 hours.
- Optional: scheduled auto-reminder on due date (cron job).

---

## 10. API Endpoints (Next.js Route Handlers)

```
POST   /api/auth/signup
POST   /api/auth/[...nextauth]
GET    /api/dashboard/summary?month=YYYY-MM

GET    /api/budget?month=YYYY-MM
POST   /api/budget
PATCH  /api/budget/:id
DELETE /api/budget/:id
POST   /api/budget/import
GET    /api/budget/export?format=xlsx|csv

GET    /api/categories
POST   /api/categories
PATCH  /api/categories/:id
DELETE /api/categories/:id

GET    /api/friends
POST   /api/friends
GET    /api/friends/:id           (includes computed balance + history)
PATCH  /api/friends/:id
DELETE /api/friends/:id           (archive, not hard delete)

POST   /api/ledger
PATCH  /api/ledger/:id
DELETE /api/ledger/:id
POST   /api/ledger/settle/:friendId

POST   /api/reminders/email
POST   /api/reminders/whatsapp-log
GET    /api/reminders

GET    /api/reports?month=YYYY-MM
```

Every route: check session → scope all queries by `userId` → validate with Zod → return consistent `{ data, error }` JSON.

---

## 11. Folder Structure

```
pocketledger/
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ (marketing)/page.tsx
│  │  ├─ (auth)/auth/{login,signup,forgot-password}/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx            # sidebar + bottom nav
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ budget/page.tsx
│  │  │  ├─ friends/page.tsx
│  │  │  ├─ friends/[id]/page.tsx
│  │  │  ├─ reminders/page.tsx
│  │  │  ├─ reports/page.tsx
│  │  │  └─ settings/page.tsx
│  │  └─ api/...
│  ├─ components/
│  │  ├─ ui/                      # shadcn components
│  │  ├─ budget/BudgetGrid.tsx
│  │  ├─ friends/{FriendCard,LedgerTimeline,ReminderPanel}.tsx
│  │  ├─ dashboard/{SummaryCard,DonutChart,SnapshotCards}.tsx
│  │  └─ shared/{QuickAddFab,MoneyText,EmptyState}.tsx
│  ├─ lib/
│  │  ├─ prisma.ts
│  │  ├─ auth.ts
│  │  ├─ ledger.ts                # balance calculation functions
│  │  ├─ format.ts                # currency/date formatting
│  │  ├─ messages.ts              # reminder template renderer
│  │  ├─ email.ts
│  │  └─ validators.ts            # Zod schemas
│  └─ styles/globals.css          # theme tokens
├─ .env.example
└─ README.md
```

`.env.example`:
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
```

---

## 12. Security & Privacy

- Hash passwords with bcrypt/argon2. Never store plain text.
- Every DB query filtered by the logged-in `userId`.
- Rate-limit login and reminder routes.
- Sanitize all user text (prevent XSS), use parameterized queries (Prisma).
- Friend phone/email are private; never expose to other users.
- HTTPS only; secure, httpOnly cookies.
- "Delete my account" removes all data permanently.
- Add a small note: reminders are sent only when *I* press send (no automatic messages unless I enable it).

---

## 13. Build Phases (follow in order)

**Phase 1 — Foundation**
1. Create Next.js + TypeScript + Tailwind + shadcn/ui project.
2. Add theme tokens (Section 4) with light/dark toggle.
3. Set up Prisma + PostgreSQL, run first migration, seed default categories.

**Phase 2 — Auth & Account**
4. Build signup, login, forgot password, Google login.
5. Protect `(app)` routes with middleware.
6. App shell: sidebar (desktop), bottom nav (mobile), topbar with avatar menu.

**Phase 3 — Budget Sheet**
7. Category CRUD.
8. Budget API + Excel-style grid with inline editing, totals, month tabs, daily limit.
9. Import/export XLSX & CSV.

**Phase 4 — Friends & Ledger**
10. Friends CRUD.
11. Ledger transactions API + `lib/ledger.ts` balance logic with unit tests.
12. Friends list and friend detail page with timeline and quick-add modal.
13. Settle-up flow.

**Phase 5 — Dashboard**
14. Summary endpoint + cards, charts, top owed list, overdue alerts, recent activity, floating quick-add.

**Phase 6 — Reminders**
15. Message template engine + editable templates in Settings.
16. WhatsApp click-to-chat sending + logging.
17. Email sending via Resend with HTML template + statement.
18. Bulk reminders + 24-hour spam warning + reminder history page.

**Phase 7 — Reports & Polish**
19. Reports page with charts + PDF/Excel export.
20. Empty states, loading skeletons, toasts, error boundaries.
21. Accessibility (labels, focus states, contrast), responsive QA on 360px, 768px, 1280px widths.
22. PWA setup (installable on phone, "Add to Home Screen").

**Phase 8 — Test & Deploy**
23. Unit tests for ledger math, Zod schemas; Playwright E2E for signup → add friend → lend → remind.
24. Deploy to Vercel, connect production DB, set env variables.
25. Write README with setup steps and screenshots.

---

## 14. Acceptance Criteria (Definition of Done)

- [ ] I can create an account and log in securely.
- [ ] Dashboard shows my month balance, income, expense, and total friends owe me / I owe friends.
- [ ] Budget sheet behaves like Excel: inline edit, totals, month tabs, import/export.
- [ ] I can add friends and record: I gave, I borrowed, they repaid, I repaid.
- [ ] Each friend shows **how many times** I gave/borrowed, **how much** in total, and the **net balance** with correct colors.
- [ ] Partial repayments and Settle-up work correctly (unit-tested).
- [ ] I can send a reminder via **WhatsApp** (pre-filled message) and **Email**, and see the history.
- [ ] Works smoothly on my phone and on desktop; dark mode works.
- [ ] No user can see another user's data.

---

## 15. Nice-to-Have (Future)

- Shared ledger: invite a friend to confirm the entries (both sides agree).
- Receipt photo upload per transaction.
- Boarding-house group mode: split rent/bills/groceries among housemates automatically.
- Monthly savings goals and budget per category with alerts.
- Push notifications for due dates.
- Multi-language (English / Sinhala / Tamil / Hindi).
- Biometric/PIN lock on mobile.

---

## 16. Instruction to the AI Builder

> Build this exactly as specified. Use the Emerald Night theme. Write clean, typed, commented code. After each phase, run the app, fix errors, and summarize what was completed and what is next. Ask me only if something is truly blocking; otherwise make a sensible choice and note it in the README.
