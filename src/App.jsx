import { useCallback, useEffect, useMemo, useState } from 'react';
import AppHeader from './components/AppHeader';
import BottomNav from './components/BottomNav';
import CoachScreen from './screens/CoachScreen';
import PlanScreen from './screens/PlanScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProgressScreen from './screens/ProgressScreen';
import ResultScreen from './screens/ResultScreen';
import WelcomeScreen from './screens/WelcomeScreen';
import { estimateCalories } from './utils/calories';
import { generateWorkoutPlan } from './utils/workoutRecommendation';
import { loadProfile, loadSessions, saveProfile, saveSession, seedJudgeDemoHistory } from './utils/storage';

const EMPTY_PROFILE = {
  age: '',
  height: '',
  weight: '',
  level: '',
  goal: '',
  time: '',
  location: '',
  equipment: '',
};

const JUDGE_PROFILE = {
  age: '20',
  height: '175',
  weight: '70',
  level: 'Beginner',
  goal: 'Stay fit',
  time: '20',
  location: 'Hostel room',
  equipment: 'None',
};

export default function App() {
  const [screen, setScreen] = useState('welcome');
  const [profile, setProfile] = useState(() => loadProfile() || EMPTY_PROFILE);
  const [plan, setPlan] = useState(null);
  const [result, setResult] = useState(null);
  const [sessions, setSessions] = useState(() => loadSessions());
  const [resultSaved, setResultSaved] = useState(false);

  const refreshSessions = useCallback(() => setSessions(loadSessions()), []);

  const navigate = useCallback((nextScreen) => {
    if (nextScreen === 'progress') refreshSessions();
    setScreen(nextScreen);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [refreshSessions]);

  const startJudgeDemo = useCallback(() => {
    setProfile(JUDGE_PROFILE);
    saveProfile(JUDGE_PROFILE);
    seedJudgeDemoHistory();
    refreshSessions();
    navigate('profile');
  }, [navigate, refreshSessions]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return undefined;
    const lifecycle = new AbortController();

    void Promise.resolve(context.registerTool({
      name: 'start_judge_demo',
      title: 'Start judge demo',
      description: 'Preload the official BITS in Motion judge profile and open the profile step.',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute() {
        startJudgeDemo();
        return { screen: 'profile', profile: JUDGE_PROFILE };
      },
    }, { signal: lifecycle.signal })).catch(() => {});

    return () => lifecycle.abort();
  }, [startJudgeDemo]);

  function handleProfileSubmit(nextProfile) {
    setProfile(nextProfile);
    saveProfile(nextProfile);
    setPlan(generateWorkoutPlan(nextProfile));
    navigate('plan');
  }

  function handleEndSession(sessionMetrics) {
    const nextResult = {
      ...sessionMetrics,
      calories: estimateCalories({ weightKg: profile.weight, durationSeconds: sessionMetrics.durationSeconds }),
    };
    setResult(nextResult);
    setResultSaved(false);
    navigate('result');
  }

  function handleSaveResult() {
    if (!result || resultSaved) return;
    const session = {
      ...result,
      id: globalThis.crypto?.randomUUID?.() || `session-${Date.now()}`,
      completedAt: new Date().toISOString(),
      source: 'real',
    };
    saveSession(session);
    setResultSaved(true);
    refreshSessions();
  }

  const currentPlan = useMemo(() => plan || generateWorkoutPlan(profile), [plan, profile]);
  const showShellNavigation = !['welcome', 'coach'].includes(screen);

  return (
    <div className={`app ${screen === 'coach' ? 'app-coach' : ''}`}>
      {showShellNavigation && <AppHeader screen={screen} onNavigate={navigate} />}

      {screen === 'welcome' && (
        <WelcomeScreen
          onStart={() => navigate('profile')}
          onJudgeDemo={startJudgeDemo}
          onProgress={() => navigate('progress')}
        />
      )}
      {screen === 'profile' && (
        <ProfileScreen initialProfile={profile} onSubmit={handleProfileSubmit} onBack={() => navigate('welcome')} />
      )}
      {screen === 'plan' && (
        <PlanScreen profile={profile} plan={currentPlan} onStartCoach={() => navigate('coach')} onBack={() => navigate('profile')} />
      )}
      {screen === 'coach' && (
        <CoachScreen onBack={() => navigate('plan')} onEndSession={handleEndSession} />
      )}
      {screen === 'result' && result && (
        <ResultScreen
          result={result}
          profile={profile}
          saved={resultSaved}
          onSave={handleSaveResult}
          onHome={() => navigate('welcome')}
          onProgress={() => navigate('progress')}
          onRetry={() => navigate('coach')}
        />
      )}
      {screen === 'progress' && (
        <ProgressScreen sessions={sessions} onHome={() => navigate('welcome')} onStart={() => navigate('profile')} />
      )}

      {showShellNavigation && <BottomNav screen={screen} onNavigate={navigate} />}
    </div>
  );
}
