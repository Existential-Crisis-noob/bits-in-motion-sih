import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadProfile, loadSessions, saveProfile, saveSession, seedJudgeDemoHistory } from './storage';

let values;

beforeEach(() => {
  values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('local persistence', () => {
  it('keeps the profile after a fresh read', () => {
    const profile = { age: '20', height: '175', weight: '70' };
    expect(saveProfile(profile)).toBe(true);
    expect(loadProfile()).toEqual(profile);
  });

  it('distinguishes real sessions from judge sample history', () => {
    saveSession({ id: 'real-1', completedAt: new Date().toISOString(), reps: 3, source: 'real' });
    seedJudgeDemoHistory();
    const sessions = loadSessions();
    expect(sessions).toHaveLength(4);
    expect(sessions.filter((session) => session.source === 'real')).toHaveLength(1);
    expect(sessions.filter((session) => session.source === 'sample')).toHaveLength(3);
  });
});
