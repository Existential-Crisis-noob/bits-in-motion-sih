import { ArrowRight, Camera, ChartNoAxesCombined, ShieldCheck, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onStart, onJudgeDemo, onProgress }) {
  return (
    <main className="welcome-screen">
      <section className="welcome-hero">
        <div className="welcome-identity">
          <img className="welcome-logo" src="/logo.png" alt="BITS in Motion logo" />
          <div><span className="eyebrow light">Smart India Hackathon 2026</span><strong>BITS in Motion</strong></div>
        </div>

        <div className="welcome-grid">
          <div className="welcome-copy">
            <span className="status-pill dark"><Camera size={16} /> Camera-guided movement</span>
            <h1>Your hostel-friendly fitness companion</h1>
            <p>Get a practical plan for your space, then use your camera for real-time squat counting and basic observable pose feedback.</p>
            <div className="welcome-actions">
              <button className="button button-primary button-large" onClick={onStart}>Start my workout <ArrowRight size={19} /></button>
              <button className="button button-on-dark" onClick={onJudgeDemo}><Sparkles size={18} /> Try judge demo</button>
            </div>
          </div>

          <div className="flow-preview" aria-label="How BITS in Motion works">
            <div className="flow-card flow-card-main">
              <span className="eyebrow light">Today’s loop</span>
              <strong>Plan. Move. Improve.</strong>
              <div className="flow-line"><span className="active">1</span><i /><span>2</span><i /><span>3</span></div>
              <div className="flow-labels"><small>Profile</small><small>Coach</small><small>Progress</small></div>
            </div>
            <div className="flow-card flow-card-stat"><ChartNoAxesCombined size={22} /><div><strong>3 day</strong><small>active streak</small></div></div>
          </div>
        </div>

        <div className="privacy-banner"><ShieldCheck size={20} /><span><strong>Your movement stays yours.</strong> Camera frames are processed locally in your browser and are not recorded.</span></div>
      </section>

      <section className="welcome-details">
        <div><span>01</span><h2>Built for real student spaces</h2><p>Short sessions, minimal equipment and no need for a dedicated gym floor.</p></div>
        <div><span>02</span><h2>Explainable recommendations</h2><p>Clear rules use your level, goal, time, location and equipment—not a black box.</p></div>
        <div><span>03</span><h2>Basic live movement feedback</h2><p>MediaPipe landmarks power squat depth cues and complete-cycle rep counting.</p></div>
      </section>

      <button className="progress-shortcut" onClick={onProgress}><ChartNoAxesCombined size={18} /> View progress</button>
    </main>
  );
}
