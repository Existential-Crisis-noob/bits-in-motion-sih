import { ArrowRight, Check, Clock3, Flame, RefreshCw, Save, ScanLine } from 'lucide-react';
import FoodGuidanceCard from '../components/FoodGuidanceCard';
import ScreenHeader from '../components/ScreenHeader';
import StepRail from '../components/StepRail';
import { SQUAT_SESSION_MET } from '../utils/calories';

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

export default function ResultScreen({ result, profile, saved, onSave, onHome, onProgress, onRetry }) {
  return (
    <main className="screen-page result-page">
      <StepRail current="Result" />
      <ScreenHeader eyebrow="Step 4 of 5" title="Session complete" description="You showed up—and that is how momentum starts." />

      <section className="result-hero panel-dark">
        <div className="result-check"><Check size={30} /></div>
        <div><span className="eyebrow light">Squat coach summary</span><h2>{result.reps} complete reps</h2><p>{result.formSummary}</p></div>
      </section>

      <section className="result-stats">
        <article><ScanLine size={21} /><span>Squat repetitions</span><strong>{result.reps}</strong></article>
        <article><Clock3 size={21} /><span>Session duration</span><strong>{formatDuration(result.durationSeconds)}</strong></article>
        <article><Flame size={21} /><span>Estimated calories</span><strong>{result.calories.toFixed(1)} <small>kcal</small></strong></article>
      </section>

      <div className="result-grid">
        <section className="panel result-next">
          <span className="eyebrow">Your next action</span>
          <h2>Complete the rest of today’s plan</h2>
          <p>Move on to low-impact jumping jacks, push-ups and a supported plank. Keep the pace comfortable.</p>
          <div className="result-actions">
            <button className="button button-primary" onClick={onSave} disabled={saved}>{saved ? <><Check size={18} /> Session saved</> : <><Save size={18} /> Save session</>}</button>
            <button className="button button-secondary" onClick={onProgress}>View progress <ArrowRight size={18} /></button>
          </div>
          <button className="text-button" onClick={onRetry}><RefreshCw size={16} /> Try camera coach again</button>
        </section>
        <FoodGuidanceCard goal={profile.goal} />
      </div>

      <aside className="estimate-note"><Flame size={17} /><span><strong>Estimated calculation:</strong> {SQUAT_SESSION_MET} MET × {profile.weight} kg × session hours. Actual energy use varies by person and intensity.</span></aside>
      <button className="button button-quiet home-action" onClick={onHome}>Return home</button>
    </main>
  );
}
