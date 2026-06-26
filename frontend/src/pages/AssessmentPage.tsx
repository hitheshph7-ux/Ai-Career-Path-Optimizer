import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import {
  ClipboardList, CheckCircle, XCircle, RotateCcw,
  Clock, Zap, ChevronLeft, ChevronRight, Award, BarChart2, BookOpen
} from 'lucide-react';

type Phase = 'pick' | 'quiz' | 'done';
type QuestionData = { id: string; question: string; options: string[]; difficulty: string; time_limit: number };
type EvalResult = Record<string, unknown>;
type SkillMeta = { question_count: number; difficulties: string[]; avg_time: number };

const DIFF_COLOR: Record<string, string> = { Easy: '#10b981', Medium: '#f59e0b', Hard: '#ef4444' };
const SKILL_ICONS: Record<string, string> = {
  Python:'🐍', JavaScript:'🌐', 'Machine Learning':'🤖', SQL:'🗄️',
  Docker:'🐋', AWS:'☁️', React:'⚛️', Git:'🔀', 'System Design':'🏗️',
};

export default function AssessmentPage() {
  const [phase, setPhase]       = useState<Phase>('pick');
  const [skills, setSkills]     = useState<string[]>([]);
  const [skillMeta, setMeta]    = useState<Record<string, SkillMeta>>({});
  const [skill, setSkill]       = useState('');
  const [questions, setQs]      = useState<QuestionData[]>([]);
  const [answers, setAnswers]   = useState<number[]>([]);
  const [flash, setFlash]       = useState<'correct' | 'wrong' | null>(null);
  const [result, setResult]     = useState<EvalResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [qLoading, setQLoading]  = useState(false);
  const [current, setCurrent]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotal]   = useState(0);

  // Load skills + meta
  useEffect(() => {
    api.availableSkills().then(r => {
      const res = r as Record<string, unknown>;
      setSkills((res.skills as string[]) || []);
      setMeta((res.meta as Record<string, SkillMeta>) || {});
    }).catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (phase !== 'quiz' || !questions[current]) return;
    const limit = questions[current].time_limit;
    setTimeLeft(limit);
    setTotal(limit);
    const id = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(id);
          // Auto-advance on timeout
          if (answers[current] === -1) {
            setAnswers(a => { const n = [...a]; n[current] = -1; return n; });
          }
          if (current < questions.length - 1) setTimeout(() => setCurrent(c => c + 1), 300);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, phase, questions.length]);

  // Keyboard navigation
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (phase !== 'quiz') return;
    if (['1','2','3','4'].includes(e.key)) {
      const idx = parseInt(e.key) - 1;
      if (idx < questions[current].options.length) selectAnswer(idx);
    }
    if (e.key === 'ArrowRight' && answers[current] !== -1 && current < questions.length - 1) setCurrent(c => c + 1);
    if (e.key === 'ArrowLeft' && current > 0) setCurrent(c => c - 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current, questions, answers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  const startQuiz = async () => {
    if (!skill) return;
    setQLoading(true);
    try {
      const r = await api.getQuestions(skill);
      const qs = (r as Record<string, QuestionData[]>).questions || [];
      setQs(qs);
      setAnswers(new Array(qs.length).fill(-1));
      setCurrent(0);
      setPhase('quiz');
    } catch { alert('Backend not reachable — ensure server is running'); }
    finally { setQLoading(false); }
  };

  const selectAnswer = (idx: number) => {
    if (answers[current] !== -1) return; // locked once answered
    setAnswers(a => { const n = [...a]; n[current] = idx; return n; });
    setFlash('correct'); // optimistic — will clear after 400ms
    setTimeout(() => setFlash(null), 400);
  };

  const submitQuiz = async () => {
    setLoading(true);
    try {
      const r = await api.evaluate(skill, answers.map(a => Math.max(a, 0)));
      setResult(r as EvalResult);
      setPhase('done');
    } catch { alert('Evaluation failed — try again'); }
    finally { setLoading(false); }
  };

  const reset = () => { setPhase('pick'); setSkill(''); setQs([]); setAnswers([]); setResult(null); setCurrent(0); };

  const answeredCount = answers.filter(a => a !== -1).length;
  const progressPct   = ((current) / (questions.length || 1)) * 100;
  const timerPct      = totalTime > 0 ? (timeLeft / totalTime) * 100 : 100;
  const timerColor    = timeLeft > (totalTime * 0.5) ? '#10b981' : timeLeft > (totalTime * 0.25) ? '#f59e0b' : '#ef4444';

  // ── PHASE: PICK ─────────────────────────────────────────────────────────
  if (phase === 'pick') return (
    <div style={{ padding:32, maxWidth:900 }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', gap:12 }}>
          <ClipboardList size={28} color="var(--accent-primary)"/> Skill Assessment Quiz
        </h1>
        <p style={{ color:'var(--text-muted)', marginTop:6 }}>
          8 questions per skill · Countdown timer · Instant AI feedback · Skill badge on completion
        </p>
      </div>

      {/* Stats bar */}
      <div className="grid-3 fade-up" style={{ marginBottom:24 }}>
        {[
          { icon:'📚', label:'Available Skills', value: skills.length },
          { icon:'❓', label:'Questions per Skill', value:'8' },
          { icon:'⏱️', label:'Avg Time per Quiz', value:'3 min' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign:'center', padding:'16px 20px' }}>
            <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
            <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card fade-up">
        <h3 style={{ fontWeight:700, marginBottom:6 }}>Choose a Skill to Assess</h3>
        <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>Tip: use keyboard 1–4 to select answers, ← → to navigate</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:12, marginBottom:24 }}>
          {skills.map(s => {
            const meta = skillMeta[s];
            const diffs = meta?.difficulties || [];
            return (
              <button key={s} onClick={() => setSkill(s)} style={{
                padding:'16px', borderRadius:12,
                border:`2px solid ${skill===s ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                background: skill===s ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                cursor:'pointer', fontFamily:'inherit', transition:'var(--transition)',
                textAlign:'left', position:'relative', overflow:'hidden',
              }}
                onMouseEnter={e => { if (skill!==s) (e.currentTarget as HTMLElement).style.borderColor='rgba(99,102,241,0.4)'; }}
                onMouseLeave={e => { if (skill!==s) (e.currentTarget as HTMLElement).style.borderColor='var(--border-color)'; }}
              >
                {skill===s && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--grad-primary)' }}/>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <span style={{ fontSize:24 }}>{SKILL_ICONS[s] || '💡'}</span>
                  {skill===s && <CheckCircle size={16} color="var(--accent-primary)"/>}
                </div>
                <div style={{ fontWeight:700, fontSize:15, color: skill===s ? '#fff' : 'var(--text-primary)', marginBottom:6 }}>{s}</div>
                <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
                  {diffs.sort().map(d => (
                    <span key={d} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:`${DIFF_COLOR[d]}22`, color:DIFF_COLOR[d], fontWeight:700 }}>{d}</span>
                  ))}
                </div>
                {meta && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:6 }}>⏱ ~{meta.avg_time}s/q</p>}
              </button>
            );
          })}
          {skills.length === 0 && <p style={{ color:'var(--text-muted)', fontSize:13, gridColumn:'1/-1' }}>Loading skills...</p>}
        </div>

        <button className="btn btn-primary" onClick={startQuiz} disabled={!skill || qLoading}
          style={{ width:'100%', justifyContent:'center', fontSize:16, padding:'14px' }}>
          {qLoading
            ? <><span className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block' }}/> Loading...</>
            : <><Zap size={16}/> Start {skill || 'Assessment'} Quiz</>}
        </button>
      </div>
    </div>
  );

  // ── PHASE: QUIZ ──────────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const q = questions[current];
    const answered = answers[current] !== -1;
    return (
      <div style={{ padding:32, maxWidth:780 }}>
        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:22 }}>{SKILL_ICONS[skill] || '💡'}</span>
              <h1 style={{ fontSize:20, fontWeight:800 }}>{skill} Assessment</h1>
              <span style={{ fontSize:12, padding:'3px 10px', borderRadius:20, background:`${DIFF_COLOR[q.difficulty]}22`, color:DIFF_COLOR[q.difficulty], fontWeight:700 }}>{q.difficulty}</span>
            </div>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginTop:4 }}>
              {answeredCount}/{questions.length} answered · press 1-4 to select
            </p>
          </div>

          {/* Circular timer */}
          <div style={{ position:'relative', width:60, height:60 }}>
            <svg width="60" height="60" style={{ transform:'rotate(-90deg)' }}>
              <circle cx="30" cy="30" r="24" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5"/>
              <circle cx="30" cy="30" r="24" fill="none" stroke={timerColor} strokeWidth="5"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerPct / 100)}`}
                style={{ transition:'stroke-dashoffset 1s linear, stroke 0.3s' }}/>
            </svg>
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:timerColor, fontFamily:"'Space Grotesk',sans-serif" }}>
              {timeLeft}
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:5, marginBottom:16, flexWrap:'wrap' }}>
          {questions.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} style={{
              width:28, height:8, borderRadius:4, border:'none', cursor:'pointer',
              background: i === current ? 'var(--accent-primary)' : answers[i] !== -1 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.1)',
              transition:'all 0.2s', flexShrink:0,
            }}/>
          ))}
        </div>

        {/* Linear progress */}
        <div className="progress-bar" style={{ marginBottom:20 }}>
          <div className="progress-fill" style={{ width:`${progressPct}%` }}/>
        </div>

        {/* Question card */}
        <div className="card fade-in" style={{
          borderColor: flash === 'correct' ? 'rgba(16,185,129,0.5)' : flash === 'wrong' ? 'rgba(239,68,68,0.5)' : undefined,
          transition:'border-color 0.3s',
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <span style={{ fontSize:11, color:'var(--accent-primary)', fontWeight:700, textTransform:'uppercase', letterSpacing:'.06em' }}>
              Question {current + 1} of {questions.length}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'var(--text-muted)' }}>
              <Clock size={12}/> {q.time_limit}s
            </span>
          </div>

          <h3 style={{ fontWeight:700, fontSize:18, marginBottom:24, lineHeight:1.6, color:'var(--text-primary)' }}>
            {q.question}
          </h3>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {q.options.map((opt, i) => {
              const isSelected = answers[current] === i;
              return (
                <button key={i} onClick={() => selectAnswer(i)}
                  disabled={answered}
                  style={{
                    padding:'14px 18px', borderRadius:12,
                    border:`2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                    background: isSelected ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.03)',
                    color: isSelected ? '#fff' : 'var(--text-secondary)',
                    cursor: answered ? 'default' : 'pointer',
                    textAlign:'left', fontFamily:'inherit', fontWeight:500, fontSize:14,
                    transition:'all 0.2s', display:'flex', alignItems:'center', gap:12,
                    opacity: answered && !isSelected ? 0.5 : 1,
                  }}
                  onMouseEnter={e => { if (!answered) (e.currentTarget as HTMLElement).style.borderColor='rgba(99,102,241,0.5)'; }}
                  onMouseLeave={e => { if (!answered && !isSelected) (e.currentTarget as HTMLElement).style.borderColor='var(--border-color)'; }}
                >
                  <span style={{
                    width:28, height:28, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center',
                    background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                    color: isSelected ? '#fff' : 'var(--text-muted)', fontWeight:800, fontSize:13, flexShrink:0,
                  }}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span style={{ flex:1 }}>{opt}</span>
                  {isSelected && <CheckCircle size={16} color="var(--accent-primary)" style={{ flexShrink:0 }}/>}
                </button>
              );
            })}
          </div>

          {/* Keyboard hint */}
          <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:16, textAlign:'center' }}>
            Press <kbd style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4 }}>1</kbd>
            –<kbd style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4 }}>4</kbd> to select &nbsp;·&nbsp;
            <kbd style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:4 }}>← →</kbd> to navigate
          </p>
        </div>

        {/* Nav */}
        <div style={{ display:'flex', justifyContent:'space-between', marginTop:16, gap:12 }}>
          <button className="btn btn-secondary" onClick={() => setCurrent(c => c - 1)} disabled={current === 0}>
            <ChevronLeft size={16}/> Prev
          </button>
          <button className="btn btn-secondary" onClick={reset} style={{ color:'var(--text-muted)' }}>Quit</button>
          {current < questions.length - 1
            ? <button className="btn btn-primary" onClick={() => setCurrent(c => c + 1)} disabled={!answered}>
                Next <ChevronRight size={16}/>
              </button>
            : <button className="btn btn-primary" onClick={submitQuiz}
                disabled={answeredCount < questions.length || loading}
                style={{ background: answeredCount === questions.length ? undefined : 'rgba(99,102,241,0.4)' }}>
                {loading
                  ? <><span className="spin" style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block' }}/> Scoring...</>
                  : '✅ Submit'}
              </button>
          }
        </div>
      </div>
    );
  }

  // ── PHASE: DONE ──────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const pct    = result.score as number;
    const color  = pct >= 90 ? '#10b981' : pct >= 75 ? '#6366f1' : pct >= 55 ? '#f59e0b' : '#ef4444';
    const byDiff = result.by_difficulty as Record<string, { correct: number; total: number }>;
    const results = result.results as Record<string, unknown>[];
    const badge   = result.badge as string;

    return (
      <div style={{ padding:32, maxWidth:780 }} className="fade-up">
        {/* Title row */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <h1 style={{ fontSize:24, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>
            {SKILL_ICONS[skill] || '📊'} {skill} Results
          </h1>
          <div style={{ display:'flex', gap:10 }}>
            <button className="btn btn-secondary" onClick={startQuiz}><RotateCcw size={14}/> Retake</button>
            <button className="btn btn-secondary" onClick={reset}><BookOpen size={14}/> New Skill</button>
          </div>
        </div>

        {/* Score hero */}
        <div className="card" style={{
          marginBottom:20, textAlign:'center', padding:'32px 24px',
          background:`linear-gradient(135deg, rgba(${color==='#10b981'?'16,185,129':color==='#6366f1'?'99,102,241':color==='#f59e0b'?'245,158,11':'239,68,68'},0.12), rgba(0,0,0,0)`,
          borderColor:`rgba(${color==='#10b981'?'16,185,129':color==='#6366f1'?'99,102,241':color==='#f59e0b'?'245,158,11':'239,68,68'},0.35)`,
        }}>
          <div style={{ fontSize:80, fontWeight:900, fontFamily:"'Space Grotesk',sans-serif", color, lineHeight:1, marginBottom:8 }}>
            {pct.toFixed(0)}%
          </div>
          <div style={{ fontSize:28, marginBottom:6 }}>{badge}</div>
          <div style={{ fontSize:20, fontWeight:700, color:'var(--text-primary)', marginBottom:8 }}>{result.level as string}</div>
          <div style={{ color:'var(--text-muted)', fontSize:14 }}>
            {result.correct as number}/{result.total as number} correct &nbsp;·&nbsp;
            <span style={{ color: result.passed ? '#34d399' : '#f87171' }}>
              {result.passed ? '✅ Passed' : '❌ Not Passed'}
            </span>
          </div>
        </div>

        {/* Difficulty breakdown */}
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <BarChart2 size={18} color="var(--accent-primary)"/> Performance by Difficulty
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {Object.entries(byDiff).filter(([, v]) => v.total > 0).map(([diff, v]) => {
              const pctD = v.total > 0 ? (v.correct / v.total) * 100 : 0;
              return (
                <div key={diff}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontWeight:700, color:DIFF_COLOR[diff], fontSize:14 }}>{diff}</span>
                    </div>
                    <span style={{ fontSize:13, color:'var(--text-muted)' }}>{v.correct}/{v.total} correct · {pctD.toFixed(0)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width:`${pctD}%`, background:`linear-gradient(90deg,${DIFF_COLOR[diff]},${DIFF_COLOR[diff]}99)` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed review */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
            <Award size={18} color="var(--accent-primary)"/> Detailed Question Review
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {results.map((r, i) => {
              const ok = r.correct as boolean;
              return (
                <div key={i} style={{
                  padding:'14px 16px', borderRadius:12,
                  background: ok ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                  border:`1px solid ${ok ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                    <div style={{ display:'flex', gap:10, alignItems:'flex-start', flex:1 }}>
                      {ok
                        ? <CheckCircle size={16} color="#10b981" style={{ flexShrink:0, marginTop:2 }}/>
                        : <XCircle size={16} color="#ef4444" style={{ flexShrink:0, marginTop:2 }}/>}
                      <div style={{ flex:1 }}>
                        <p style={{ fontWeight:600, fontSize:14, marginBottom:4, color:'var(--text-primary)' }}>
                          Q{i + 1} — Your answer:{' '}
                          <span style={{ color: ok ? '#34d399' : '#f87171' }}>{r.your_answer as string}</span>
                        </p>
                        {!ok && (
                          <p style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:4 }}>
                            ✅ Correct: <span style={{ color:'#34d399', fontWeight:600 }}>{r.correct_answer as string}</span>
                          </p>
                        )}
                        <p style={{ fontSize:12, color:'var(--text-muted)', fontStyle:'italic', lineHeight:1.5 }}>
                          💡 {r.explanation as string}
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize:10, padding:'3px 8px', borderRadius:4, background:`${DIFF_COLOR[r.difficulty as string]}22`, color:DIFF_COLOR[r.difficulty as string], fontWeight:700, flexShrink:0, marginLeft:8 }}>
                      {r.difficulty as string}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
