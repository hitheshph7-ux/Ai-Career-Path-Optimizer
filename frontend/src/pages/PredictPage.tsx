import React, { useState } from 'react';
import { api } from '../api/client';
import { Brain, ChevronRight, ChevronLeft, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const STEPS = ['Basic Info', 'Technical Skills', 'Cloud & DevOps', 'ML & Data', 'Profile'];

const DEFAULTS = {
  Python_Skill:5, Java_Skill:5, JavaScript_Skill:5, SQL_Skill:5, C___Skill:3,
  React_Skill:4, Node_js_Skill:4, Django_Skill:3, FastAPI_Skill:3, R_Skill:2,
  Docker_Skill:3, AWS_Skill:3, Azure_Skill:3, GCP_Skill:2, Kubernetes_Skill:2, Terraform_Skill:2,
  Machine_Learning_Skill:4, Deep_Learning_Skill:3, NLP_Skill:3, Computer_Vision_Skill:3,
  TensorFlow_Skill:3, PyTorch_Skill:3, Scikit_learn_Skill:4, Pandas_Skill:5, NumPy_Skill:5,
  System_Design_Skill:3, Data_Structures_Skill:6, Algorithms_Skill:6, Statistics_Skill:5, Linear_Algebra_Skill:4,
  CGPA:7.5, Experience_Years:0, Certifications:1, Projects_Completed:3,
  GitHub_Repos:8, Hackathons:1, Internships:0,
  Primary_Interest:'AI/ML', Personality_Type:'Analytical', Education_Level:'B.Tech',
};

type Result = Record<string, unknown>;

function SkillSlider({ label, fieldKey, value, onChange }: { label:string; fieldKey:string; value:number; onChange:(k:string,v:number)=>void }) {
  const color = value >= 7 ? '#10b981' : value >= 4 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ fontSize:13, fontWeight:500, color:'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color, minWidth:20, textAlign:'right' }}>{value}</span>
      </div>
      <input type="range" min={1} max={10} value={value} onChange={e => onChange(fieldKey, +e.target.value)} style={{ width:'100%' }} />
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--text-muted)', marginTop:2 }}>
        <span>Beginner</span><span>Expert</span>
      </div>
    </div>
  );
}

export default function PredictPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string, v: number | string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    setLoading(true); setError('');
    try {
      const r = await api.predict(form as Record<string,unknown>);
      setResult(r as Result);
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : 'Backend not available — run training first');
    } finally { setLoading(false); }
  };

  const SELECT_STYLE = { background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-color)', borderRadius:8, padding:'10px 14px', color:'var(--text-primary)', fontSize:14, fontFamily:'inherit', width:'100%', outline:'none' };

  if (result) return <ResultView result={result} onReset={() => { setResult(null); setStep(0); }} />;

  return (
    <div style={{ padding:32, maxWidth:800 }}>
      <div className="fade-up" style={{ marginBottom:32 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", display:'flex', alignItems:'center', gap:12 }}>
          <Brain size={28} color="var(--accent-primary)"/> AI Career Predictor
        </h1>
        <p style={{ color:'var(--text-muted)', marginTop:6 }}>Answer a few questions — our ML model will predict your ideal career path</p>
      </div>

      {/* Stepper */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, fontWeight:700,
                background: i < step ? 'var(--accent-green)' : i === step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.06)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
                transition:'var(--transition)',
              }}>
                {i < step ? <CheckCircle size={16}/> : i+1}
              </div>
              <span style={{ fontSize:11, color: i===step ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{s}</span>
            </div>
            {i < STEPS.length-1 && (
              <div style={{ height:2, flex:1, background: i < step ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)', marginBottom:22, transition:'var(--transition)' }}/>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="card fade-in">
        {step === 0 && (
          <div>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Basic Information</h3>
            <div className="grid-2">
              {[['Primary Interest','Primary_Interest',['AI/ML','Web Development','Mobile Apps','Cybersecurity','Cloud Computing','Blockchain','IoT','AR/VR','Data Analytics','Product Design']],
                ['Personality Type','Personality_Type',['Analytical','Creative','Leadership','Detail-oriented','Innovative','Collaborative']],
                ['Education Level','Education_Level',['B.Tech','B.Sc','BCA','M.Tech','M.Sc','MCA']],
              ].map(([label, key, opts]) => (
                <div key={key as string} className="form-group">
                  <label className="form-label">{label as string}</label>
                  <select style={SELECT_STYLE} value={(form as Record<string,unknown>)[key as string] as string} onChange={e => set(key as string, e.target.value)}>
                    {(opts as string[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <div className="grid-3" style={{ marginTop:16 }}>
              {[['CGPA (0-10)','CGPA',0,10,0.1],['Experience (years)','Experience_Years',0,10,1],
                ['Certifications','Certifications',0,20,1],['Projects Done','Projects_Completed',0,50,1],
                ['GitHub Repos','GitHub_Repos',0,200,1],['Internships','Internships',0,5,1]].map(([label,key,min,max,step]) => (
                <div key={key as string} className="form-group">
                  <label className="form-label">{label as string}</label>
                  <input className="form-input" type="number" min={min as number} max={max as number} step={step as number}
                    value={(form as Record<string,unknown>)[key as string] as number}
                    onChange={e => set(key as string, +e.target.value)} />
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Technical Skills (1 = Beginner, 10 = Expert)</h3>
            <div className="grid-2">
              {[['Python','Python_Skill'],['Java','Java_Skill'],['JavaScript','JavaScript_Skill'],['SQL','SQL_Skill'],
                ['C++','C___Skill'],['R','R_Skill'],['React','React_Skill'],['Node.js','Node_js_Skill'],
                ['Django','Django_Skill'],['FastAPI','FastAPI_Skill']].map(([l,k]) => (
                <SkillSlider key={k} label={l} fieldKey={k} value={(form as unknown as Record<string,number>)[k]} onChange={set}/>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Cloud & DevOps Skills</h3>
            <div className="grid-2">
              {[['Docker','Docker_Skill'],['Kubernetes','Kubernetes_Skill'],['AWS','AWS_Skill'],
                ['Azure','Azure_Skill'],['GCP','GCP_Skill'],['Terraform','Terraform_Skill'],
                ['System Design','System_Design_Skill'],['Data Structures','Data_Structures_Skill'],
                ['Algorithms','Algorithms_Skill'],['Linux/Shell','C___Skill']].map(([l,k]) => (
                <SkillSlider key={k} label={l} fieldKey={k} value={(form as unknown as Record<string,number>)[k]} onChange={set}/>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h3 style={{ fontWeight:700, marginBottom:20 }}>Machine Learning & Data Skills</h3>
            <div className="grid-2">
              {[['Machine Learning','Machine_Learning_Skill'],['Deep Learning','Deep_Learning_Skill'],
                ['NLP','NLP_Skill'],['Computer Vision','Computer_Vision_Skill'],
                ['TensorFlow','TensorFlow_Skill'],['PyTorch','PyTorch_Skill'],
                ['Scikit-learn','Scikit_learn_Skill'],['Pandas','Pandas_Skill'],
                ['NumPy','NumPy_Skill'],['Statistics','Statistics_Skill'],
                ['Linear Algebra','Linear_Algebra_Skill']].map(([l,k]) => (
                <SkillSlider key={k} label={l} fieldKey={k} value={(form as unknown as Record<string,number>)[k]} onChange={set}/>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:64, marginBottom:16 }}>🚀</div>
            <h3 style={{ fontWeight:800, fontSize:22, marginBottom:12 }}>Ready to Predict!</h3>
            <p style={{ color:'var(--text-muted)', marginBottom:24 }}>
              Our trained ML model will analyze your profile and predict the best career path for you.
            </p>
            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, padding:12, color:'#f87171', marginBottom:16, display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={16}/> {error}
              </div>
            )}
            <button className="btn btn-primary" onClick={submit} disabled={loading} style={{ fontSize:16, padding:'14px 40px' }}>
              {loading ? <><Loader size={16} className="spin"/> Analyzing Profile...</> : '🧠 Predict My Career Path'}
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display:'flex', justifyContent:'space-between', marginTop:20 }}>
        <button className="btn btn-secondary" onClick={() => setStep(s => Math.max(0, s-1))} disabled={step===0}>
          <ChevronLeft size={16}/> Previous
        </button>
        {step < STEPS.length-1 && (
          <button className="btn btn-primary" onClick={() => setStep(s => Math.min(STEPS.length-1, s+1))}>
            Next <ChevronRight size={16}/>
          </button>
        )}
      </div>
    </div>
  );
}

function ResultView({ result, onReset }: { result: Result; onReset: () => void }) {
  const gaps = (result.skill_gaps as Record<string,unknown>[] | undefined) || [];
  const roadmap = (result.learning_roadmap as Record<string,unknown>[] | undefined) || [];
  const topMatches = (result.top_matches as Record<string,unknown>[] | undefined) || [];

  return (
    <div style={{ padding:32, maxWidth:960 }} className="fade-up">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontSize:26, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>🎯 Your AI Career Prediction</h1>
        <button className="btn btn-secondary" onClick={onReset}>← Try Again</button>
      </div>

      {/* Primary result */}
      <div className="card" style={{ marginBottom:20, background:'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', borderColor:'rgba(99,102,241,0.3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:4 }}>Primary Career Match</p>
            <h2 style={{ fontSize:32, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }} className="gradient-text">
              {result.primary_career as string}
            </h2>
            <p style={{ color:'var(--text-secondary)', marginTop:8, maxWidth:500 }}>{result.description as string}</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:48, fontWeight:900, background:'var(--grad-primary)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              {result.confidence as number}%
            </div>
            <div style={{ color:'var(--text-muted)', fontSize:13 }}>Confidence Score</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:20 }}>
        {[
          { label:'Avg Salary', value:`$${((result.avg_salary as number)||0).toLocaleString()}`, icon:'💰' },
          { label:'Market Demand', value:`${result.market_demand}%`, icon:'📈' },
          { label:'Industry Growth', value:result.growth as string, icon:'🚀' },
          { label:'Predicted Salary', value:`$${((result.predicted_salary as number)||0).toLocaleString()}`, icon:'🎯' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign:'center' }}>
            <div style={{ fontSize:24, marginBottom:8 }}>{s.icon}</div>
            <div style={{ fontWeight:800, fontSize:18, fontFamily:"'Space Grotesk',sans-serif" }}>{s.value}</div>
            <div style={{ color:'var(--text-muted)', fontSize:12, marginTop:4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Alternative matches */}
      {topMatches.length > 1 && (
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontWeight:700, marginBottom:16 }}>🔄 Alternative Career Matches</h3>
          {topMatches.slice(1).map((m, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <span style={{ fontWeight:500 }}>{m.career as string}</span>
              <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, marginLeft:20 }}>
                <div className="progress-bar" style={{ flex:1 }}>
                  <div className="progress-fill" style={{ width:`${((m.confidence as number)*100).toFixed(0)}%` }}/>
                </div>
                <span style={{ fontSize:13, color:'var(--text-muted)', minWidth:40 }}>{((m.confidence as number)*100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Skill Gap */}
      {gaps.length > 0 && (
        <div className="card" style={{ marginBottom:20 }}>
          <h3 style={{ fontWeight:700, marginBottom:16 }}>📊 Skill Gap Analysis</h3>
          {gaps.map((g, i) => (
            <div key={i} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontWeight:600 }}>{g.skill as string}</span>
                  <span className={`badge badge-${(g.priority as string).toLowerCase()}`}>{g.priority as string}</span>
                </div>
                <span style={{ fontSize:13, color:'var(--text-muted)' }}>{g.current as number}/10 → {g.required as number}/10</span>
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <div className="progress-bar" style={{ flex:1 }}>
                  <div className="progress-fill" style={{ width:`${((g.current as number)/10)*100}%`, background:(g.gap as number)>2?'var(--grad-amber)':'var(--grad-green)' }}/>
                </div>
                <div className="progress-bar" style={{ flex:1, background:'rgba(99,102,241,0.15)' }}>
                  <div className="progress-fill" style={{ width:`${((g.required as number)/10)*100}%` }}/>
                </div>
              </div>
              <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:4 }}>⏱ ~{g.weeks_to_close as number} weeks to close · {g.resources as number} resources</p>
            </div>
          ))}
        </div>
      )}

      {/* Roadmap */}
      {roadmap.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:20 }}>🗺️ Personalized Learning Roadmap</h3>
          <div style={{ position:'relative', paddingLeft:24 }}>
            <div style={{ position:'absolute', left:8, top:0, bottom:0, width:2, background:'rgba(99,102,241,0.2)' }}/>
            {roadmap.map((r, i) => (
              <div key={i} style={{ position:'relative', marginBottom:24, paddingLeft:20 }}>
                <div style={{ position:'absolute', left:-24+8-6, top:4, width:12, height:12, borderRadius:'50%',
                  background: i===0 ? 'var(--accent-primary)' : 'rgba(99,102,241,0.4)', border:'2px solid var(--bg-primary)' }}/>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:8 }}>
                  <div>
                    <h4 style={{ fontWeight:700, marginBottom:4 }}>{r.phase as string}</h4>
                    <p style={{ fontSize:13, color:'var(--accent-primary)', marginBottom:6 }}>📅 {r.weeks as string}</p>
                    <ul style={{ listStyle:'none', padding:0 }}>
                      {(r.activities as string[]).map((a, j) => (
                        <li key={j} style={{ fontSize:13, color:'var(--text-secondary)', marginBottom:3, display:'flex', gap:8 }}>
                          <span>•</span>{a}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <span className={`badge badge-${(r.priority as string).toLowerCase()}`}>{r.priority as string}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
