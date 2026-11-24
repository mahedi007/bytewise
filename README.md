# ByteQuest: coding quests for Cambridge students (PG → O Level)

A gamified coding platform for one teacher. It includes free and paid courses for each class band, Python and web code that runs in the browser, XP, streaks, badges and a leaderboard, bKash/Nagad course unlocks, online and onsite tuition booking, and an admin panel ("Teacher HQ") where you write lessons without touching code.

It runs entirely on the **Cloudflare free plan**: Pages for the site, Pages Functions for the API, and D1 for the database. You don't need a server, and there's no build step.

---

## What's inside

| Path | What it is |
|---|---|
| `public/` | The website (plain HTML/CSS/JS). Cloudflare serves this folder. |
| `functions/api/[[route]].js` | Entry point for every `/api/*` request |
| `lib/api.js` | All API routes: courses, lessons, auth, progress, payments, bookings, admin |
| `lib/auth.js` | Sessions, password hashing, levels and badges |
| `schema.sql` | Database tables, default settings and the 5 courses |
| `content/*.md` | The 25 starter lessons (one file per course) |
| `scripts/build-seed.mjs` | Turns `content/*.md` into `seed.sql` |
| `wrangler.toml` | Cloudflare config: D1 binding + admin email |

### Courses (class bands)

| Course | Classes | Cambridge alignment | Starter lessons |
|---|---|---|---|
| 🧸 Tiny Coders | PG · Nursery · KG | Early Years, pre-coding | 3 free + 1 Pro |
| 🧭 Little Explorers | Class 1–3 | Primary Computing, Stages 1–3 | 3 free + 1 Pro |
| 🛠️ Junior Builders | Class 4–6 | Primary Computing, Stages 4–6 | 3 free + 2 Pro |
| ⚡ Code Creators | Class 7–8 | Lower Secondary Computing (0860) | 3 free + 2 Pro |
| 🎓 O Level CS 2210 | Class 9–11 | O Level 2210 / IGCSE 0478 | 3 free + 4 Pro |

Prices start at ৳1,500–5,000 per course. These are **placeholders**: change them in Admin → Courses & prices.

---

## Deploy (about 15 minutes)

You need Node.js 18+ and a free Cloudflare account.

**1. Push this folder to a new GitHub repo**

**2. Install and log in**
```bash
npm install
npx wrangler login
```

**3. Create the database**
```bash
npx wrangler d1 create bytequest-db
```
Copy the `database_id` it prints into `wrangler.toml` (replace `PASTE-YOUR-D1-DATABASE-ID-HERE`). Commit that change.

**4. Set your admin email** in `wrangler.toml` → `ADMIN_EMAILS`. It's preset to `mahedi.pro@gmail.com`. Whoever signs up with this email becomes the admin.

**5. Create the tables and load the lessons**
```bash
npm run db:init:remote
```

**6. Connect the site in Cloudflare**
Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
- Framework preset: **None**
- Build command: *(leave empty)*
- Build output directory: `public`

Cloudflare reads `wrangler.toml`, so the D1 binding (`DB`) and `ADMIN_EMAILS` are applied automatically. If the site shows *"Database binding DB is missing"*, add it by hand: Project → **Settings → Bindings → Add → D1**, with variable name `DB` and database `bytequest-db`. Then redeploy.

**7. Make yourself admin.** Open your `*.pages.dev` site → **Join free** → sign up with the admin email. An **Admin** link appears in the menu.

**8. Fill in Admin → Site settings:** your name, photo URL, WhatsApp, bKash/Nagad numbers, tuition fees, onsite area, and brand name.

> To rename the brand everywhere, change it in Site settings. Also search and replace `ByteQuest` in `public/*.html` so Google shows the new name in page titles.

From then on, every `git push` redeploys automatically.

---

## Daily use (Teacher HQ → `/admin`)

- **Payments:** a student sends money with bKash/Nagad "Send Money" and submits the TrxID. Check it in your app, then press **Approve** and the course unlocks instantly. **Reject** shows the student your reason.
- **Tuition requests:** bookings from `/tuition`. Use the one-tap WhatsApp reply, a status (new → contacted → confirmed → closed) and private notes.
- **Students:** search, **Grant** a course (cash, onsite or scholarship), remove access, or **Reset password**. There's no email system, so students who forget their password message you.
- **Lessons:** write in Markdown with a live preview. The *Insert* buttons add interactive widgets:

| Block | Becomes |
|---|---|
| ` ```python ` | Editable, runnable Python (with a loop guard and kid-friendly error hints) |
| ` ```web ` | Live HTML/CSS/JS editor with preview |
| ` ```botmaze ` | Robot maze game (`S` start, `G` goal, `#` wall, `*` gem; `"loops": true` enables ×N repeats) |
| ` ```binary ` | Binary switches with a "make this number" challenge |
| ` ```logic ` | Logic gate lab with a live truth table |
| ` ```pseudocode ` | Cambridge-style highlighted pseudocode |
| ` ```reveal ` | Tap-to-reveal answer (first line = button text) |

Quiz format (below the lesson in the editor):
```
Q: What is 17 MOD 5?
- 3
* 2
- 3.4
> 17 ÷ 5 = 3 remainder 2.
```
`*` marks the correct answer. A perfect score earns +10 bonus XP.

**Videos:** paste an *Unlisted* YouTube link or a Google Drive share link. Both are free hosting.

**Free vs Pro:** untick "Free lesson" to make a lesson Pro. Pro lesson content **never leaves the server** for students who haven't unlocked the course. They only see a short teaser.

---

## Run locally

```bash
npm install
npm run db:init:local
npm run dev            # http://localhost:8788
```

---

## Free-plan limits (check Cloudflare's pricing page for current numbers)

Workers/Pages Functions: about 100k requests a day. D1: 5 GB of storage plus generous daily read/write quotas. That is plenty for hundreds of active students. Python runs in each student's own browser, so it costs you nothing.

## When you start earning, upgrade in this order

1. **Custom domain:** buy one and add it under Pages → Custom domains (easy, about ৳1,500 a year)
2. **Payment gateway:** SSLCommerz or the bKash PGW for automatic unlocks instead of manual TrxID checks
3. **Email:** Resend or MailChannels for self-service password reset and receipts
4. **Spam protection:** Cloudflare Turnstile on the signup and booking forms (also free)
5. **File uploads:** R2 for worksheets and PDFs (the free tier needs a card on file)

---

*Lessons are aligned to Cambridge curriculum frameworks. This is an independent tutoring platform, not affiliated with or endorsed by Cambridge University Press & Assessment.*
