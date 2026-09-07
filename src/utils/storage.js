const PROFILE_KEY = 'bits-motion-profile-v1';
const SESSION_KEY = 'bits-motion-sessions-v1';
const SAMPLE_KEY = 'bits-motion-sample-history-v1';

function readJson(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadProfile() {
  return readJson(PROFILE_KEY, null);
}

export function saveProfile(profile) {
  return writeJson(PROFILE_KEY, profile);
}

export function loadSessions() {
  const real = readJson(SESSION_KEY, []);
  const sample = readJson(SAMPLE_KEY, []);
  return [...real, ...sample].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

export function saveSession(session) {
  const sessions = readJson(SESSION_KEY, []);
  return writeJson(SESSION_KEY, [session, ...sessions]);
}

function toLocalIsoDate(daysAgo) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(18, 30, 0, 0);
  return date.toISOString();
}

export function seedJudgeDemoHistory() {
  const existing = readJson(SAMPLE_KEY, []);
  if (existing.length) return existing;

  const sample = [
    {
      id: 'sample-1',
      completedAt: toLocalIsoDate(1),
      reps: 12,
      durationSeconds: 510,
      calories: 54.5,
      formSummary: 'Good depth reached on most tracked repetitions.',
      source: 'sample',
    },
    {
      id: 'sample-2',
      completedAt: toLocalIsoDate(3),
      reps: 10,
      durationSeconds: 430,
      calories: 46,
      formSummary: 'A steady session with one framing reminder.',
      source: 'sample',
    },
    {
      id: 'sample-3',
      completedAt: toLocalIsoDate(4),
      reps: 8,
      durationSeconds: 390,
      calories: 41.7,
      formSummary: 'Completed at a controlled pace.',
      source: 'sample',
    },
  ];

  writeJson(SAMPLE_KEY, sample);
  return sample;
}

export function getProgressSummary(sessions) {
  const totals = sessions.reduce(
    (accumulator, session) => ({
      workouts: accumulator.workouts + 1,
      reps: accumulator.reps + (Number(session.reps) || 0),
    }),
    { workouts: 0, reps: 0 },
  );

  const dayKeys = new Set(sessions.map((session) => new Date(session.completedAt).toDateString()));
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);
  const weeklyActiveDays = new Set(
    sessions
      .filter((session) => new Date(session.completedAt) >= weekAgo)
      .map((session) => new Date(session.completedAt).toDateString()),
  ).size;

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!dayKeys.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (dayKeys.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return { ...totals, weeklyActiveDays, streak };
}
