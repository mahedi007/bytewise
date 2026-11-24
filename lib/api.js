import {
  json, fail, readBody, str, int, isEmail, normalizePhone, slugify, dhakaDate,
  hashPassword, verifyPassword,
} from './util.js';
import {
  currentUser, startSession, endSession, requireUser, requireAdmin, publicUser,
  computeBadges, unlockedTrackIds, levelInfo, adminEmails,
} from './auth.js';

// Settings that are safe to show on the public site.
const PUBLIC_SETTINGS = [
  'brand_name', 'tagline', 'teacher_name', 'teacher_title', 'teacher_bio', 'teacher_photo',
  'phone', 'whatsapp', 'email', 'facebook_url', 'youtube_url', 'bkash_number', 'nagad_number',
  'payment_note', 'onsite_location', 'online_fee', 'online_fee_note', 'onsite_fee', 'onsite_fee_note',
  'announcement',
];

const CLASS_LEVELS = [
  'PG', 'Nursery', 'KG', 'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Other',
];

const now = () => Date.now();

// ======================================================================
// Router
// ======================================================================
const routes = [];
const route = (method, pattern, handler) => {
  const keys = [];
  const re = new RegExp(
    '^' + pattern.replace(/:(\w+)/g, (_, k) => (keys.push(k), '([^/]+)')) + '/?$'
  );
  routes.push({ method, re, keys, handler });
};

export async function handle(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  try {
    if (!env.DB) fail(500, 'Database binding "DB" is missing. See README → Bind D1.');
    for (const r of routes) {
      if (r.method !== request.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      const user = await currentUser(request, env);
      return await r.handler({ request, env, url, params, user });
    }
    fail(404, 'Not found');
  } catch (err) {
    const status = err.status || 500;
    if (status === 500) console.error(err);
    const message = status === 500 ? 'Something went wrong on our side. Please try again.' : err.message;
    return json({ error: message }, status);
  }
}

// ======================================================================
// Public
// ======================================================================
async function getSettings(env, keys = null) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const all = Object.fromEntries(results.map((r) => [r.key, r.value]));
  if (!keys) return all;
  return Object.fromEntries(keys.map((k) => [k, all[k] ?? '']));
}

route('GET', '/api/config', async ({ env }) => {
  return json({ settings: await getSettings(env, PUBLIC_SETTINGS), class_levels: CLASS_LEVELS });
});

route('GET', '/api/tracks', async ({ env, user }) => {
  const { results } = await env.DB.prepare(
    `SELECT t.*,
       (SELECT COUNT(*) FROM lessons l WHERE l.track_id = t.id AND l.is_published = 1) AS lesson_count,
       (SELECT COUNT(*) FROM lessons l WHERE l.track_id = t.id AND l.is_published = 1 AND l.is_free = 1) AS free_count,
       (SELECT COALESCE(SUM(xp),0) FROM lessons l WHERE l.track_id = t.id AND l.is_published = 1) AS total_xp
     FROM tracks t WHERE t.is_published = 1 ORDER BY t.sort, t.id`
  ).all();
  const unlocked = await unlockedTrackIds(env, user);
  const status = await enrollmentStatusMap(env, user);
  const done = await doneCountByTrack(env, user);
  return json({
    tracks: results.map((t) => ({
      ...t,
      unlocked: unlocked.has(t.id),
      enrollment: status[t.id] || null,
      done: done[t.id] || 0,
    })),
  });
});

route('GET', '/api/tracks/:slug', async ({ env, params, user }) => {
  const track = await env.DB.prepare('SELECT * FROM tracks WHERE slug = ? AND is_published = 1')
    .bind(params.slug)
    .first();
  if (!track) fail(404, 'Course not found');
  const { results: lessons } = await env.DB.prepare(
    `SELECT id, slug, title, summary, sort, is_free, xp, kind, minutes
     FROM lessons WHERE track_id = ? AND is_published = 1 ORDER BY sort, id`
  )
    .bind(track.id)
    .all();
  const unlocked = (await unlockedTrackIds(env, user)).has(track.id);
  const doneSet = await doneLessonIds(env, user);
  const status = await enrollmentStatusMap(env, user);
  return json({
    track: { ...track, unlocked, enrollment: status[track.id] || null },
    lessons: lessons.map((l) => ({
      ...l,
      locked: !l.is_free && !unlocked,
      completed: doneSet.has(l.id),
    })),
  });
});

route('GET', '/api/lessons/:slug', async ({ env, params, user }) => {
  const lesson = await env.DB.prepare(
    `SELECT l.*, t.slug AS track_slug, t.title AS track_title, t.emoji AS track_emoji,
            t.color AS track_color, t.price_bdt, t.classes AS track_classes
     FROM lessons l JOIN tracks t ON t.id = l.track_id
     WHERE l.slug = ? AND l.is_published = 1`
  )
    .bind(params.slug)
    .first();
  if (!lesson) fail(404, 'Lesson not found');

  const unlocked = lesson.is_free === 1 || (await unlockedTrackIds(env, user)).has(lesson.track_id);
  const { results: siblings } = await env.DB.prepare(
    `SELECT slug, title, is_free FROM lessons WHERE track_id = ? AND is_published = 1 ORDER BY sort, id`
  )
    .bind(lesson.track_id)
    .all();
  const idx = siblings.findIndex((s) => s.slug === lesson.slug);
  const done = user
    ? await env.DB.prepare('SELECT quiz_score FROM progress WHERE user_id = ? AND lesson_id = ?')
        .bind(user.id, lesson.id)
        .first()
    : null;
  const status = await enrollmentStatusMap(env, user);

  const base = {
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary,
    xp: lesson.xp,
    kind: lesson.kind,
    minutes: lesson.minutes,
    is_free: lesson.is_free,
    track: {
      slug: lesson.track_slug, title: lesson.track_title, emoji: lesson.track_emoji,
      color: lesson.track_color, price_bdt: lesson.price_bdt, classes: lesson.track_classes,
      enrollment: status[lesson.track_id] || null,
    },
    position: idx + 1,
    total: siblings.length,
    prev: siblings[idx - 1] || null,
    next: siblings[idx + 1] || null,
    completed: !!done,
    quiz_score: done?.quiz_score ?? null,
    locked: !unlocked,
  };
  if (!unlocked) {
    // Premium content never leaves the server for locked users. Send a short teaser only.
    const teaser = lesson.content_md.split(/\n```/)[0].slice(0, 600);
    return json({ lesson: { ...base, teaser } });
  }
  return json({
    lesson: { ...base, content_md: lesson.content_md, quiz_text: lesson.quiz_text, video_url: lesson.video_url },
  });
});

route('GET', '/api/leaderboard', async ({ env }) => {
  const { results } = await env.DB.prepare(
    `SELECT name, class_level, xp, streak FROM users WHERE role = 'student' AND xp > 0
     ORDER BY xp DESC, id ASC LIMIT 10`
  ).all();
  // Students are children: only show first name + last initial.
  return json({
    leaders: results.map((r) => {
      const parts = r.name.trim().split(/\s+/);
      const display = parts[0] + (parts[1] ? ' ' + parts[1][0].toUpperCase() + '.' : '');
      return { name: display, class_level: r.class_level, xp: r.xp, streak: r.streak, ...levelInfo(r.xp) };
    }),
  });
});

route('POST', '/api/bookings', async ({ env, request, user }) => {
  const b = await readBody(request);
  if (str(b.website)) return json({ ok: true }); // honeypot: silently drop bots
  const student_name = str(b.student_name, 100);
  const phone = normalizePhone(b.phone);
  const mode = ['online', 'onsite'].includes(b.mode) ? b.mode : null;
  if (!student_name) fail(400, "Please enter the student's name");
  if (!phone) fail(400, 'Please enter a valid phone / WhatsApp number');
  if (!mode) fail(400, 'Choose online or onsite');
  const email = str(b.email, 120).toLowerCase();
  if (email && !isEmail(email)) fail(400, 'That email looks off');

  const recent = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM bookings WHERE phone = ? AND created_at > ?'
  )
    .bind(phone, now() - 86400 * 1000)
    .first();
  if ((recent?.n || 0) >= 3) fail(429, "We've already got your request. We'll contact you soon!");

  await env.DB.prepare(
    `INSERT INTO bookings (user_id, student_name, guardian_name, phone, email, class_level, mode, focus,
       preferred_days, preferred_time, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      user?.id ?? null, student_name, str(b.guardian_name, 100), phone, email || null,
      str(b.class_level, 30), mode, str(b.focus, 100), str(b.preferred_days, 100),
      str(b.preferred_time, 60), str(b.message, 1000), now()
    )
    .run();
  return json({ ok: true });
});

// ======================================================================
// Auth
// ======================================================================
async function roleFor(env, email, current = 'student') {
  return adminEmails(env).includes(email) ? 'admin' : current === 'admin' ? 'admin' : 'student';
}

route('POST', '/api/auth/signup', async ({ env, request }) => {
  const b = await readBody(request);
  const name = str(b.name, 80);
  const email = str(b.email, 120).toLowerCase();
  const password = String(b.password || '');
  const class_level = CLASS_LEVELS.includes(b.class_level) ? b.class_level : null;
  const phone = b.phone ? normalizePhone(b.phone) : '';
  if (name.length < 2) fail(400, 'Please enter your name');
  if (!isEmail(email)) fail(400, 'Please enter a valid email');
  if (password.length < 8) fail(400, 'Password needs at least 8 characters');
  if (!class_level) fail(400, 'Pick your class');
  if (b.phone && !phone) fail(400, 'Phone number looks off');

  const exists = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (exists) fail(409, 'That email already has an account. Try logging in.');

  const role = await roleFor(env, email);
  const res = await env.DB.prepare(
    `INSERT INTO users (name, email, phone, class_level, password_hash, role, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(name, email, phone || null, class_level, await hashPassword(password), role, now())
    .run();
  const userId = res.meta.last_row_id;
  const synced = await syncGuestProgress(env, userId, b.guest_completed);
  const cookie = await startSession(env, userId);
  const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
  return json({ user: publicUser(user), synced }, 201, { 'set-cookie': cookie });
});

route('POST', '/api/auth/login', async ({ env, request }) => {
  const b = await readBody(request);
  const email = str(b.email, 120).toLowerCase();
  const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
  if (!user || !(await verifyPassword(String(b.password || ''), user.password_hash))) {
    fail(401, 'Email or password is incorrect');
  }
  const role = await roleFor(env, email, user.role);
  if (role !== user.role) await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?').bind(role, user.id).run();
  const synced = await syncGuestProgress(env, user.id, b.guest_completed);
  const cookie = await startSession(env, user.id);
  const fresh = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  return json({ user: publicUser(fresh), synced }, 200, { 'set-cookie': cookie });
});

route('POST', '/api/auth/logout', async ({ env, request }) => {
  return json({ ok: true }, 200, { 'set-cookie': await endSession(request, env) });
});

route('POST', '/api/me/password', async ({ env, request, user }) => {
  requireUser(user);
  const b = await readBody(request);
  if (!(await verifyPassword(String(b.current || ''), user.password_hash))) fail(400, 'Current password is wrong');
  if (String(b.next || '').length < 8) fail(400, 'New password needs at least 8 characters');
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(String(b.next)), user.id),
  ]);
  return json({ ok: true });
});

route('POST', '/api/me/profile', async ({ env, request, user }) => {
  requireUser(user);
  const b = await readBody(request);
  const name = str(b.name, 80) || user.name;
  const class_level = CLASS_LEVELS.includes(b.class_level) ? b.class_level : user.class_level;
  const phone = b.phone ? normalizePhone(b.phone) : user.phone;
  await env.DB.prepare('UPDATE users SET name = ?, class_level = ?, phone = ? WHERE id = ?')
    .bind(name, class_level, phone || null, user.id)
    .run();
  return json({ ok: true });
});

// ======================================================================
// Student
// ======================================================================
route('GET', '/api/me', async ({ env, user }) => {
  if (!user) return json({ user: null });
  const { results: enrollments } = await env.DB.prepare(
    `SELECT e.id, e.status, e.method, e.amount, e.txn_id, e.note, e.created_at, e.reviewed_at,
            t.slug AS track_slug, t.title AS track_title, t.emoji AS track_emoji
     FROM enrollments e JOIN tracks t ON t.id = e.track_id
     WHERE e.user_id = ? ORDER BY e.created_at DESC`
  )
    .bind(user.id)
    .all();
  const { results: done } = await env.DB.prepare(
    `SELECT l.slug, p.quiz_score, p.completed_at FROM progress p JOIN lessons l ON l.id = p.lesson_id
     WHERE p.user_id = ? ORDER BY p.completed_at DESC`
  )
    .bind(user.id)
    .all();
  // Streak shown as 0 if the student missed yesterday and hasn't been active today.
  const streakAlive = user.last_active === dhakaDate(0) || user.last_active === dhakaDate(-1);
  return json({
    user: { ...publicUser(user), streak: streakAlive ? user.streak : 0 },
    badges: await computeBadges(env, user),
    enrollments,
    completed: done,
  });
});

/** Award XP for finishing a lesson. Returns the reward details for the celebration UI. */
async function completeLesson(env, user, lesson, quizScore) {
  const prev = await env.DB.prepare('SELECT quiz_score FROM progress WHERE user_id = ? AND lesson_id = ?')
    .bind(user.id, lesson.id)
    .first();
  let gained = 0;
  const score = quizScore === null || quizScore === undefined ? null : Math.max(0, Math.min(100, int(quizScore)));
  if (!prev) {
    gained += lesson.xp;
    if (score === 100) gained += 10;
    await env.DB.prepare('INSERT INTO progress (user_id, lesson_id, quiz_score, completed_at) VALUES (?, ?, ?, ?)')
      .bind(user.id, lesson.id, score, now())
      .run();
  } else if (score !== null && (prev.quiz_score ?? -1) < score) {
    if (score === 100 && prev.quiz_score !== 100) gained += 10; // perfect-score bonus, once
    await env.DB.prepare('UPDATE progress SET quiz_score = ? WHERE user_id = ? AND lesson_id = ?')
      .bind(score, user.id, lesson.id)
      .run();
  }

  // streak (Asia/Dhaka calendar days)
  const today = dhakaDate(0);
  let streak = user.streak || 0;
  if (user.last_active !== today) streak = user.last_active === dhakaDate(-1) ? streak + 1 : 1;
  const best = Math.max(user.best_streak || 0, streak);
  const xp = (user.xp || 0) + gained;
  await env.DB.prepare('UPDATE users SET xp = ?, streak = ?, best_streak = ?, last_active = ? WHERE id = ?')
    .bind(xp, streak, best, today, user.id)
    .run();
  const before = levelInfo(user.xp || 0).level;
  const after = levelInfo(xp);
  return { gained, xp, streak, leveled_up: after.level > before, ...after, first_time: !prev };
}

route('POST', '/api/progress', async ({ env, request, user }) => {
  requireUser(user);
  const b = await readBody(request);
  const lesson = await env.DB.prepare('SELECT * FROM lessons WHERE slug = ? AND is_published = 1')
    .bind(str(b.slug, 100))
    .first();
  if (!lesson) fail(404, 'Lesson not found');
  if (!lesson.is_free && !(await unlockedTrackIds(env, user)).has(lesson.track_id)) fail(403, 'Unlock this course first');
  const oldBadges = (await computeBadges(env, user)).filter((x) => x.earned).map((x) => x.id);
  const reward = await completeLesson(env, user, lesson, b.quiz_score);
  const fresh = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(user.id).first();
  const newBadges = (await computeBadges(env, fresh)).filter((x) => x.earned && !oldBadges.includes(x.id));
  return json({ reward, new_badges: newBadges });
});

/** Guest progress lives in localStorage; on signup/login we import completed FREE lessons. */
async function syncGuestProgress(env, userId, slugs) {
  if (!Array.isArray(slugs) || !slugs.length) return 0;
  const clean = [...new Set(slugs.map((s) => str(s, 100)).filter(Boolean))].slice(0, 100);
  const placeholders = clean.map(() => '?').join(',');
  const { results: lessons } = await env.DB.prepare(
    `SELECT id, xp FROM lessons WHERE is_free = 1 AND is_published = 1 AND slug IN (${placeholders})`
  )
    .bind(...clean)
    .all();
  let gained = 0;
  for (const l of lessons) {
    const r = await env.DB.prepare(
      'INSERT OR IGNORE INTO progress (user_id, lesson_id, quiz_score, completed_at) VALUES (?, ?, NULL, ?)'
    )
      .bind(userId, l.id, now())
      .run();
    if (r.meta.changes) gained += l.xp;
  }
  if (gained) {
    await env.DB.prepare('UPDATE users SET xp = xp + ?, streak = MAX(streak, 1), best_streak = MAX(best_streak, 1), last_active = ? WHERE id = ?')
      .bind(gained, dhakaDate(0), userId)
      .run();
  }
  return gained;
}

route('POST', '/api/enroll', async ({ env, request, user }) => {
  requireUser(user);
  const b = await readBody(request);
  const track = await env.DB.prepare('SELECT * FROM tracks WHERE slug = ? AND is_published = 1')
    .bind(str(b.track_slug, 80))
    .first();
  if (!track) fail(404, 'Course not found');
  const method = ['bkash', 'nagad'].includes(b.method) ? b.method : null;
  const txn = str(b.txn_id, 40).toUpperCase().replace(/\s+/g, '');
  const sender = normalizePhone(b.sender_number);
  if (!method) fail(400, 'Choose bKash or Nagad');
  if (!sender) fail(400, 'Enter the number you paid from');
  if (txn.length < 6) fail(400, 'Enter the Transaction ID (TrxID) from your payment SMS');

  const existing = await env.DB.prepare(
    `SELECT status FROM enrollments WHERE user_id = ? AND track_id = ? AND status IN ('pending','active')`
  )
    .bind(user.id, track.id)
    .first();
  if (existing?.status === 'active') fail(409, 'You already have this course unlocked 🎉');
  if (existing?.status === 'pending') fail(409, 'Your payment is already being checked. Hang tight!');
  const dup = await env.DB.prepare('SELECT id FROM enrollments WHERE txn_id = ?').bind(txn).first();
  if (dup) fail(409, 'That Transaction ID has already been submitted');

  await env.DB.prepare(
    `INSERT INTO enrollments (user_id, track_id, status, method, sender_number, txn_id, amount, created_at)
     VALUES (?, ?, 'pending', ?, ?, ?, ?, ?)`
  )
    .bind(user.id, track.id, method, sender, txn, track.price_bdt, now())
    .run();
  return json({ ok: true, status: 'pending' }, 201);
});

// helpers ------------------------------------------------------------
async function enrollmentStatusMap(env, user) {
  if (!user) return {};
  const { results } = await env.DB.prepare(
    `SELECT track_id, status FROM enrollments WHERE user_id = ? ORDER BY created_at ASC`
  )
    .bind(user.id)
    .all();
  const map = {};
  for (const r of results) {
    // active beats pending beats rejected
    const rank = { active: 3, pending: 2, rejected: 1 };
    if (!map[r.track_id] || rank[r.status] >= rank[map[r.track_id]]) map[r.track_id] = r.status;
  }
  return map;
}

async function doneLessonIds(env, user) {
  if (!user) return new Set();
  const { results } = await env.DB.prepare('SELECT lesson_id FROM progress WHERE user_id = ?').bind(user.id).all();
  return new Set(results.map((r) => r.lesson_id));
}

async function doneCountByTrack(env, user) {
  if (!user) return {};
  const { results } = await env.DB.prepare(
    `SELECT l.track_id, COUNT(*) AS n FROM progress p JOIN lessons l ON l.id = p.lesson_id
     WHERE p.user_id = ? GROUP BY l.track_id`
  )
    .bind(user.id)
    .all();
  return Object.fromEntries(results.map((r) => [r.track_id, r.n]));
}

// ======================================================================
// Admin
// ======================================================================
route('GET', '/api/admin/overview', async ({ env, user }) => {
  requireAdmin(user);
  const q = (sql) => env.DB.prepare(sql).first();
  const [students, pending, newBookings, revenue, lessons, active] = await Promise.all([
    q(`SELECT COUNT(*) AS n FROM users WHERE role = 'student'`),
    q(`SELECT COUNT(*) AS n FROM enrollments WHERE status = 'pending'`),
    q(`SELECT COUNT(*) AS n FROM bookings WHERE status = 'new'`),
    q(`SELECT COALESCE(SUM(amount),0) AS n FROM enrollments WHERE status = 'active'`),
    q(`SELECT COUNT(*) AS n FROM lessons`),
    q(`SELECT COUNT(*) AS n FROM users WHERE last_active >= date('now','-7 day')`),
  ]);
  return json({
    students: students.n, pending_payments: pending.n, new_bookings: newBookings.n,
    revenue: revenue.n, lessons: lessons.n, active_7d: active.n,
  });
});

route('GET', '/api/admin/enrollments', async ({ env, user, url }) => {
  requireAdmin(user);
  const status = url.searchParams.get('status');
  const where = ['pending', 'active', 'rejected'].includes(status) ? 'WHERE e.status = ?' : '';
  const stmt = env.DB.prepare(
    `SELECT e.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone, u.class_level,
            t.title AS track_title, t.emoji AS track_emoji
     FROM enrollments e JOIN users u ON u.id = e.user_id JOIN tracks t ON t.id = e.track_id
     ${where} ORDER BY CASE e.status WHEN 'pending' THEN 0 ELSE 1 END, e.created_at DESC LIMIT 300`
  );
  const { results } = await (where ? stmt.bind(status) : stmt).all();
  return json({ enrollments: results });
});

route('POST', '/api/admin/enrollments/:id', async ({ env, user, params, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  if (!['active', 'rejected', 'pending'].includes(b.status)) fail(400, 'Invalid status');
  await env.DB.prepare('UPDATE enrollments SET status = ?, note = ?, reviewed_at = ? WHERE id = ?')
    .bind(b.status, str(b.note, 300) || null, now(), int(params.id))
    .run();
  return json({ ok: true });
});

route('POST', '/api/admin/grant', async ({ env, user, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const track = await env.DB.prepare('SELECT * FROM tracks WHERE slug = ?').bind(str(b.track_slug, 80)).first();
  const student = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(int(b.user_id)).first();
  if (!track || !student) fail(404, 'Student or course not found');
  const has = await env.DB.prepare(`SELECT id FROM enrollments WHERE user_id = ? AND track_id = ? AND status = 'active'`)
    .bind(student.id, track.id)
    .first();
  if (has) return json({ ok: true, already: true });
  await env.DB.prepare(
    `INSERT INTO enrollments (user_id, track_id, status, method, amount, note, created_at, reviewed_at)
     VALUES (?, ?, 'active', ?, ?, ?, ?, ?)`
  )
    .bind(student.id, track.id, b.method === 'cash' ? 'cash' : 'manual', int(b.amount), str(b.note, 300) || null, now(), now())
    .run();
  return json({ ok: true });
});

route('POST', '/api/admin/revoke', async ({ env, user, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  await env.DB.prepare(
    `UPDATE enrollments SET status = 'rejected', note = 'Access removed by admin', reviewed_at = ?
     WHERE user_id = ? AND track_id = (SELECT id FROM tracks WHERE slug = ?) AND status = 'active'`
  )
    .bind(now(), int(b.user_id), str(b.track_slug, 80))
    .run();
  return json({ ok: true });
});

route('GET', '/api/admin/bookings', async ({ env, user }) => {
  requireAdmin(user);
  const { results } = await env.DB.prepare(
    `SELECT * FROM bookings ORDER BY CASE status WHEN 'new' THEN 0 WHEN 'contacted' THEN 1 ELSE 2 END, created_at DESC LIMIT 300`
  ).all();
  return json({ bookings: results });
});

route('POST', '/api/admin/bookings/:id', async ({ env, user, params, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  if (!['new', 'contacted', 'confirmed', 'closed'].includes(b.status)) fail(400, 'Invalid status');
  await env.DB.prepare('UPDATE bookings SET status = ?, admin_note = ? WHERE id = ?')
    .bind(b.status, str(b.admin_note, 500) || null, int(params.id))
    .run();
  return json({ ok: true });
});

route('GET', '/api/admin/students', async ({ env, user }) => {
  requireAdmin(user);
  const { results } = await env.DB.prepare(
    `SELECT u.id, u.name, u.email, u.phone, u.class_level, u.role, u.xp, u.streak, u.last_active, u.created_at,
       (SELECT COUNT(*) FROM progress p WHERE p.user_id = u.id) AS lessons_done,
       (SELECT GROUP_CONCAT(t.slug) FROM enrollments e JOIN tracks t ON t.id = e.track_id
         WHERE e.user_id = u.id AND e.status = 'active') AS unlocked
     FROM users u ORDER BY u.created_at DESC LIMIT 1000`
  ).all();
  return json({ students: results });
});

route('POST', '/api/admin/students/:id/password', async ({ env, user, params, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const pw = String(b.password || '');
  if (pw.length < 8) fail(400, 'Password needs at least 8 characters');
  await env.DB.batch([
    env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(pw), int(params.id)),
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ?').bind(int(params.id)),
  ]);
  return json({ ok: true });
});

route('GET', '/api/admin/tracks', async ({ env, user }) => {
  requireAdmin(user);
  const { results } = await env.DB.prepare(
    `SELECT t.*, (SELECT COUNT(*) FROM lessons l WHERE l.track_id = t.id) AS lesson_count
     FROM tracks t ORDER BY t.sort, t.id`
  ).all();
  return json({ tracks: results });
});

route('POST', '/api/admin/tracks', async ({ env, user, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const fields = {
    title: str(b.title, 80), emoji: str(b.emoji, 8) || '🚀', classes: str(b.classes, 60), ages: str(b.ages, 40),
    cambridge: str(b.cambridge, 120), tagline: str(b.tagline, 160), description: str(b.description, 1200),
    color: ['sun', 'sky', 'lime', 'pink', 'violet', 'orange'].includes(b.color) ? b.color : 'lime',
    price_bdt: Math.max(0, int(b.price_bdt)), sort: int(b.sort), is_published: b.is_published ? 1 : 0,
  };
  if (!fields.title) fail(400, 'Title is required');
  if (b.id) {
    const sets = Object.keys(fields).map((k) => `${k} = ?`).join(', ');
    await env.DB.prepare(`UPDATE tracks SET ${sets} WHERE id = ?`).bind(...Object.values(fields), int(b.id)).run();
    return json({ ok: true, id: int(b.id) });
  }
  const slug = slugify(b.slug || fields.title);
  if (!slug) fail(400, 'Slug is required');
  const cols = ['slug', ...Object.keys(fields)];
  const r = await env.DB.prepare(
    `INSERT INTO tracks (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
  )
    .bind(slug, ...Object.values(fields))
    .run()
    .catch(() => fail(409, 'A course with that slug already exists'));
  return json({ ok: true, id: r.meta.last_row_id }, 201);
});

route('GET', '/api/admin/lessons', async ({ env, user, url }) => {
  requireAdmin(user);
  const track = int(url.searchParams.get('track_id'));
  const stmt = env.DB.prepare(
    `SELECT l.id, l.slug, l.title, l.sort, l.is_free, l.xp, l.kind, l.is_published, l.track_id, l.updated_at,
            t.title AS track_title, t.emoji AS track_emoji
     FROM lessons l JOIN tracks t ON t.id = l.track_id
     ${track ? 'WHERE l.track_id = ?' : ''} ORDER BY t.sort, l.sort, l.id`
  );
  const { results } = await (track ? stmt.bind(track) : stmt).all();
  return json({ lessons: results });
});

route('GET', '/api/admin/lessons/:id', async ({ env, user, params }) => {
  requireAdmin(user);
  const lesson = await env.DB.prepare('SELECT * FROM lessons WHERE id = ?').bind(int(params.id)).first();
  if (!lesson) fail(404, 'Lesson not found');
  return json({ lesson });
});

route('POST', '/api/admin/lessons', async ({ env, user, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const f = {
    track_id: int(b.track_id),
    slug: slugify(b.slug || b.title),
    title: str(b.title, 120),
    summary: str(b.summary, 300),
    sort: int(b.sort),
    is_free: b.is_free ? 1 : 0,
    xp: Math.max(0, Math.min(500, int(b.xp, 20))),
    kind: ['lesson', 'game', 'project', 'exam'].includes(b.kind) ? b.kind : 'lesson',
    minutes: Math.max(1, int(b.minutes, 10)),
    video_url: str(b.video_url, 300) || null,
    content_md: String(b.content_md || '').slice(0, 100000),
    quiz_text: String(b.quiz_text || '').slice(0, 20000),
    is_published: b.is_published ? 1 : 0,
    updated_at: now(),
  };
  if (!f.title) fail(400, 'Title is required');
  if (!f.slug) fail(400, 'Slug is required');
  const track = await env.DB.prepare('SELECT id FROM tracks WHERE id = ?').bind(f.track_id).first();
  if (!track) fail(400, 'Choose a course');
  const clash = await env.DB.prepare('SELECT id FROM lessons WHERE slug = ? AND id != ?').bind(f.slug, int(b.id)).first();
  if (clash) fail(409, 'Another lesson already uses that slug');

  if (b.id) {
    const sets = Object.keys(f).map((k) => `${k} = ?`).join(', ');
    await env.DB.prepare(`UPDATE lessons SET ${sets} WHERE id = ?`).bind(...Object.values(f), int(b.id)).run();
    return json({ ok: true, id: int(b.id), slug: f.slug });
  }
  const cols = Object.keys(f);
  const r = await env.DB.prepare(
    `INSERT INTO lessons (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`
  )
    .bind(...Object.values(f))
    .run();
  return json({ ok: true, id: r.meta.last_row_id, slug: f.slug }, 201);
});

route('DELETE', '/api/admin/lessons/:id', async ({ env, user, params }) => {
  requireAdmin(user);
  await env.DB.batch([
    env.DB.prepare('DELETE FROM progress WHERE lesson_id = ?').bind(int(params.id)),
    env.DB.prepare('DELETE FROM lessons WHERE id = ?').bind(int(params.id)),
  ]);
  return json({ ok: true });
});

route('GET', '/api/admin/settings', async ({ env, user }) => {
  requireAdmin(user);
  return json({ settings: await getSettings(env) });
});

route('POST', '/api/admin/settings', async ({ env, user, request }) => {
  requireAdmin(user);
  const b = await readBody(request);
  const entries = Object.entries(b.settings || {}).filter(([k]) => PUBLIC_SETTINGS.includes(k));
  if (!entries.length) fail(400, 'Nothing to save');
  await env.DB.batch(
    entries.map(([k, v]) =>
      env.DB.prepare(
        'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
      ).bind(k, str(v, 3000))
    )
  );
  return json({ ok: true });
});
