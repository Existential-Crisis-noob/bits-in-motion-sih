export const SQUAT_SESSION_MET = 3.8;

export function estimateCalories({ weightKg, durationSeconds, met = SQUAT_SESSION_MET }) {
  const weight = Number(weightKg);
  const seconds = Number(durationSeconds);

  if (!Number.isFinite(weight) || !Number.isFinite(seconds) || weight <= 0 || seconds <= 0) {
    return 0;
  }

  return Math.round(met * weight * (seconds / 3600) * 10) / 10;
}
