import { parseCookies, makeCookie, randomToken, sha256, fail } from './util.js';

export const SESSION_COOKIE = 'bq_session';
const SESSION_DAYS = 30;

export function adminEmails(env) {
  return String(env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function currentUser(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (!token) return null;
  const row = await env.DB.prepare(
    `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.token_hash = ? AND s.expires_at > ?`
  )
    .bind(await sha256(token), Date.now())
    .first();
  return row || null;
}

export async function startSession(env, userId) {
  const token = randomToken();
  const expires = Date.now() + SESSION_DAYS * 86400 * 1000;
  await env.DB.batch([
    // tidy up expired sessions for this user while we're here
    env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND expires_at < ?').bind(userId, Date.now()),
    env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(
      await sha256(token),
      userId,
      expires
    ),
  ]);
  return makeCookie(SESSION_COOKIE, token, SESSION_DAYS * 86400);
}

export async function endSession(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
  return makeCookie(SESSION_COOKIE, '', 0);
}

export function requireUser(user) {
  if (!user) fail(401, 'Please log in first');
  return user;
}

export function requireAdmin(user) {
  if (!user) fail(401, 'Please log in first');
  if (user.role !== 'admin') fail(403, 'Admins only');
  return user;
}

/** Safe public shape of a user record. */
export function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    class_level: u.class_level,
    role: u.role,
    xp: u.xp,
    streak: u.streak,
    best_streak: u.best_streak,
    last_active: u.last_active,
    ...levelInfo(u.xp),
  };
}

// ---------------- gamification ----------------
const LEVEL_NAMES = [
  'Newbie', 'Rookie', 'Explorer', 'Builder', 'Hacker', 'Coder', 'Wizard', 'Ninja', 'Master', 'Legend',
];

export function levelInfo(xp = 0) {
  const level = Math.floor(xp / 100) + 1;
  return {
    level,
    level_name: LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] + (level > LEVEL_NAMES.length ? ` ${level}` : ''),
    level_progress: xp % 100, // out of 100
  };
}

export const BADGES = [
  { id: 'first-steps', emoji: '👣', name: 'First Steps', desc: 'Finish your first quest' },
  { id: 'five-alive', emoji: '🖐️', name: 'Five Alive', desc: 'Finish 5 quests' },
  { id: 'ten-strong', emoji: '💪', name: 'Ten Strong', desc: 'Finish 10 quests' },
  { id: 'on-fire', emoji: '🔥', name: 'On Fire', desc: '3-day streak' },
  { id: 'week-warrior', emoji: '⚡', name: 'Week Warrior', desc: '7-day streak' },
  { id: 'quiz-whiz', emoji: '🧠', name: 'Quiz Whiz', desc: '3 perfect quizzes' },
  { id: 'xp-500', emoji: '🚀', name: 'Rocket Fuel', desc: 'Earn 500 XP' },
  { id: 'pro-member', emoji: '💎', name: 'Pro Member', desc: 'Unlock a full course' },
];

export async function computeBadges(env, user) {
  const stats = await env.DB.prepare(
    `SELECT COUNT(*) AS done, SUM(CASE WHEN quiz_score = 100 THEN 1 ELSE 0 END) AS perfect
     FROM progress WHERE user_id = ?`
  )
    .bind(user.id)
    .first();
  const pro = await env.DB.prepare(`SELECT COUNT(*) AS n FROM enrollments WHERE user_id = ? AND status = 'active'`)
    .bind(user.id)
    .first();
  const done = stats?.done || 0;
  const perfect = stats?.perfect || 0;
  const best = Math.max(user.best_streak || 0, user.streak || 0);
  const earned = new Set();
  if (done >= 1) earned.add('first-steps');
  if (done >= 5) earned.add('five-alive');
  if (done >= 10) earned.add('ten-strong');
  if (best >= 3) earned.add('on-fire');
  if (best >= 7) earned.add('week-warrior');
  if (perfect >= 3) earned.add('quiz-whiz');
  if ((user.xp || 0) >= 500) earned.add('xp-500');
  if ((pro?.n || 0) > 0 || user.role === 'admin') earned.add('pro-member');
  return BADGES.map((b) => ({ ...b, earned: earned.has(b.id) }));
}

/** Track ids the user can open in full. Admins can open everything. */
export async function unlockedTrackIds(env, user) {
  if (!user) return new Set();
  if (user.role === 'admin') {
    const { results } = await env.DB.prepare('SELECT id FROM tracks').all();
    return new Set(results.map((r) => r.id));
  }
  const { results } = await env.DB.prepare(
    `SELECT track_id FROM enrollments WHERE user_id = ? AND status = 'active'`
  )
    .bind(user.id)
    .all();
  return new Set(results.map((r) => r.track_id));
}
