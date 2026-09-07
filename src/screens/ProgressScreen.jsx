import { CalendarDays, ChevronRight, Dumbbell, Flame, History, Sparkles, Trophy } from 'lucide-react';
import ScreenHeader from '../components/ScreenHeader';
import StepRail from '../components/StepRail';
import { getProgressSummary } from '../utils/storage';

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

export default function ProgressScreen({ sessions, onHome, onStart }) {
  const summary = getProgressSummary(sessions);
  return (
    <main className="screen-page progress-page">
      <StepRail current="Progress" />
      <ScreenHeader eyebrow="Step 5 of 5" title="Momentum, made visible" description="A simple view of the consistency you are building." onBack={onHome} />

      <section className="progress-stats">
        <article className="progress-stat-main"><Dumbbell size={24} /><span>Total workouts</span><strong>{summary.workouts}</strong><small>Includes clearly labelled demo history</small></article>
        <article><CalendarDays size={22} /><span>Weekly active days</span><strong>{summary.weeklyActiveDays}</strong><small>out of 7 days</small></article>
        <article><Trophy size={22} /><span>Total squat reps</span><strong>{summary.reps}</strong><small>tracked sessions</small></article>
        <article><Flame size={22} /><span>Current streak</span><strong>{summary.streak}</strong><small>{summary.streak === 1 ? 'day' : 'days'} in a row</small></article>
      </section>

      <section className="history-panel panel">
        <div className="history-heading"><div><span className="eyebrow">Workout history</span><h2>Recent sessions</h2></div><History size={23} /></div>
        {sessions.length ? (
          <div className="history-list">
            {sessions.slice(0, 6).map((session) => (
              <article className="history-row" key={session.id}>
                <div className={`history-icon ${session.source === 'sample' ? 'sample' : ''}`}>{session.source === 'sample' ? <Sparkles size={19} /> : <Dumbbell size={19} />}</div>
                <div className="history-copy">
                  <div><strong>Squat coach session</strong>{session.source === 'sample' && <span className="sample-label">Sample history</span>}</div>
                  <small>{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(session.completedAt))} · {formatDuration(session.durationSeconds)}</small>
                </div>
                <div className="history-reps"><strong>{session.reps}</strong><small>reps</small></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-history"><Dumbbell size={28} /><h3>Your first session starts here</h3><p>Finish and save a camera-coach session to see it in progress.</p></div>
        )}
      </section>

      <section className="progress-cta"><div><span className="eyebrow light">Keep the streak going</span><h2>Ready for another short session?</h2></div><button className="button button-white" onClick={onStart}>Start a workout <ChevronRight size={18} /></button></section>
    </main>
  );
}
