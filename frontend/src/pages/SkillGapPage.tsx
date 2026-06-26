import { useState } from 'react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const CAREERS = ['Data Scientist','Full Stack Developer','AI/ML Engineer','Cloud Architect','Cybersecurity Analyst','DevOps Engineer'];

const SKILL_REQUIREMENTS: Record<string, Record<string,number>> = {
  'Data Scientist':       { Python:9, ML:9, Statistics:9, SQL:8, Visualization:7, Communication:7 },
  'Full Stack Developer': { JavaScript:9, React:9, NodeJS:9, SQL:7, Docker:7, Communication:8 },
  'AI/ML Engineer':       { Python:9, TensorFlow:9, Math:9, ML:9, CloudML:7, Communication:6 },
  'Cloud Architect':      { AWS:9, Kubernetes:9, Terraform:9, Networking:8, Security:7, Communication:7 },
  'Cybersecurity Analyst':{ Networking:9, Python:7, Security:9, Linux:8, Compliance:7, Communication:7 },
  'DevOps Engineer':      { Docker:9, Kubernetes:9, AWS:8, CI_CD:9, Python:7, Communication:7 },
};

const USER_SKILLS_DEFAULT: Record<string,number> = {
  Python:7, ML:5, Statistics:6, SQL:7, Visualization:5, Communication:7,
  JavaScript:6, React:6, NodeJS:5, Docker:4, AWS:4, Kubernetes:3,
  Terraform:2, Networking:4, Security:3, Linux:5, Math:5, TensorFlow:4,
  CloudML:3, CI_CD:4, Compliance:3, NodeJs:5, TFjs:3, 'CI/CD':4,
};

export default function SkillGapPage() {
  const [selectedCareer, setSelectedCareer] = useState('Data Scientist');
  const [view, setView] = useState<'radar'|'bar'>('radar');

  const requirements = SKILL_REQUIREMENTS[selectedCareer] || {};
  const skillNames   = Object.keys(requirements);

  const radarData = skillNames.map(s => ({
    skill:s, current: USER_SKILLS_DEFAULT[s] || 4, required: requirements[s],
  }));

  const barData = skillNames.map(s => ({
    skill:s, current: USER_SKILLS_DEFAULT[s] || 4, required: requirements[s],
    gap: Math.max(0, requirements[s] - (USER_SKILLS_DEFAULT[s] || 4)),
  })).sort((a,b) => b.gap - a.gap);

  return (
    <div style={{ padding:32, maxWidth:1100 }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>📊 Skill Gap Analysis</h1>
        <p style={{ color:'var(--text-muted)', marginTop:6 }}>See exactly what skills you need to close for your target role</p>
      </div>

      {/* Controls */}
      <div className="card fade-up" style={{ marginBottom:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
        <div className="form-group" style={{ flex:1, minWidth:220, marginBottom:0 }}>
          <label className="form-label">Target Career</label>
          <select className="form-input" value={selectedCareer} onChange={e => setSelectedCareer(e.target.value)}>
            {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className={`btn ${view==='radar'?'btn-primary':'btn-secondary'}`} onClick={() => setView('radar')}>🎯 Radar</button>
          <button className={`btn ${view==='bar'?'btn-primary':'btn-secondary'}`} onClick={() => setView('bar')}>📊 Bar Chart</button>
        </div>
      </div>

      {/* Chart */}
      <div className="card fade-up" style={{ marginBottom:24 }}>
        <h3 style={{ fontWeight:700, marginBottom:20 }}>
          {view==='radar' ? 'Skill Radar — Current vs Required' : 'Skill Bar — Current vs Required'}
        </h3>
        {view === 'radar' ? (
          <ResponsiveContainer width="100%" height={360}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.08)"/>
              <PolarAngleAxis dataKey="skill" tick={{ fill:'var(--text-secondary)', fontSize:12 }}/>
              <Radar name="Your Level" dataKey="current" stroke="#6366f1" fill="#6366f1" fillOpacity={0.35}/>
              <Radar name="Required" dataKey="required" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeDasharray="5 5"/>
              <Legend/>
              <Tooltip/>
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={barData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="skill" tick={{ fill:'var(--text-secondary)', fontSize:12 }}/>
              <YAxis domain={[0,10]}/>
              <Tooltip/>
              <Legend/>
              <Bar dataKey="current" name="Your Level" fill="#6366f1" radius={[4,4,0,0]}/>
              <Bar dataKey="required" name="Required" fill="#10b981" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Gap priority list */}
      <div className="card fade-up">
        <h3 style={{ fontWeight:700, marginBottom:20 }}>🎓 Prioritized Learning Plan</h3>
        {barData.filter(d => d.gap > 0).map((d, i) => (
          <div key={i} style={{ marginBottom:20, padding:16, background:'rgba(255,255,255,0.03)', borderRadius:12, border:'1px solid var(--border-color)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontWeight:700 }}>{d.skill}</span>
                <span className={`badge badge-${d.gap>=3?'high':d.gap>=1?'medium':'low'}`}>
                  {d.gap>=3?'High':d.gap>=1?'Medium':'Low'} Priority
                </span>
              </div>
              <span style={{ color:'var(--text-muted)', fontSize:13 }}>+{d.gap} levels needed · ~{d.gap*3} weeks</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width:`${(d.current/10)*100}%`, background:d.gap>=3?'var(--grad-amber)':'var(--grad-primary)' }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:12, color:'var(--text-muted)' }}>
              <span>Current: {d.current}/10</span>
              <span>Target: {d.required}/10</span>
            </div>
          </div>
        ))}
        {barData.filter(d => d.gap===0).length > 0 && (
          <div style={{ marginTop:16, padding:14, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:10 }}>
            <p style={{ color:'#34d399', fontSize:14, fontWeight:600 }}>
              ✅ Skills at required level: {barData.filter(d=>d.gap===0).map(d=>d.skill).join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
