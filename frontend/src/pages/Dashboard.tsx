import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { BarChart3, Brain, Briefcase, CheckCircle2, Circle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type Stat = { icon: string; label: string; value: string; gradient: string; sub: string };
type ChartItem = { name: string; value?: number; demand?: number; color?: string; avg?: number; year?: string };

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    api.getDashboardStats()
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 1400 }}>
        <div style={{ height: 80, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 1.5s infinite' }}/>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 120, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 1.5s infinite' }}/>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 1.5s infinite' }}/>
          <div style={{ height: 300, background: 'rgba(255,255,255,0.03)', borderRadius: 16, animation: 'pulse 1.5s infinite' }}/>
        </div>
      </div>
    );
  }

  const stats = (data?.stats as Stat[]) || [];
  const salaryTrend = (data?.salary_trend as ChartItem[]) || [];
  const skillMix = (data?.skill_mix as ChartItem[]) || [];
  const careerDemand = (data?.career_demand as ChartItem[]) || [];
  const primaryCareer = (data?.primary_career as string) || "No Prediction Yet";
  const hasData = !!data?.has_data;

  // Determine which actions are completed
  const isPredicted = primaryCareer !== "No Prediction Yet";
  const isAssessed = skillMix.some(item => item.name === "Assessed Skills");
  const isResumeUploaded = stats[1]?.value !== "0" && !isPredicted && isAssessed; // fallback proxy detection

  return (
    <div style={{ padding: 32, maxWidth: 1400 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 4 }}>Good morning — {time}</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif", lineHeight: 1.2 }}>
            Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            {hasData ? "Your personalized AI career workspace is live and calibrated." : "Get started by running a prediction or uploading a resume to calibrate your dashboard."}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, color: '#34d399', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }}/>
            AI Engine Online
          </div>
        </div>
      </div>

      {/* Onboarding Wizard banner if no personalized data yet */}
      {!hasData && (
        <div className="card fade-up" style={{ marginBottom: 28, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(0,0,0,0.2))', borderColor: 'rgba(99,102,241,0.3)' }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
            🚀 Calibrate Your AI Workspace
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            To personalize these industry salary metrics, skill demand charts, and match scores, complete these 3 quick steps:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {[
              { title: "1. Run AI prediction", desc: "ML-guided evaluation of your exact technical skillset", href: "/predict", done: isPredicted },
              { title: "2. Complete an Assessment", desc: "Take a fast quiz to dynamically sync assessed skill scores", href: "/assessment", done: isAssessed },
              { title: "3. Parse Your Resume", desc: "Instantly scan and convert resume text into an ATS form", href: "/resume", done: isResumeUploaded }
            ].map((step, idx) => (
              <a key={idx} href={step.href} style={{
                display: 'flex', gap: 12, padding: 16, borderRadius: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                textDecoration: 'none', color: 'inherit', transition: 'var(--transition)'
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent-primary)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-color)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
              >
                {step.done ? <CheckCircle2 color="#10b981" style={{ flexShrink: 0 }}/> : <Circle color="var(--text-muted)" style={{ flexShrink: 0 }}/>}
                <div>
                  <h4 style={{ fontWeight: 700, fontSize: 14, color: step.done ? 'var(--text-muted)' : 'var(--text-primary)' }}>{step.title}</h4>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{step.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid-4 fade-up" style={{ marginBottom: 28 }}>
        {stats.map((s, i) => (
          <div key={i} className="card" style={{ animationDelay: `${i * 0.05}s` }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Space Grotesk',sans-serif",
              background: s.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {s.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>{s.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 24 }}>
        <div className="card fade-up">
          <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: 16 }}>
                {hasData ? `${primaryCareer} Salary Growth` : "Industry Tech Salary Growth"}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Average industry compensation (USD K)</p>
            </div>
            <span className="badge badge-blue">+62% over 5 years</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={salaryTrend}>
              <defs>
                <linearGradient id="sgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year"/>
              <YAxis domain={['auto', 'auto']} tickFormatter={v => `$${v}K`}/>
              <Tooltip formatter={(v: unknown) => [`$${(v as number)}K`, 'Avg Salary']}/>
              <Area type="monotone" dataKey="avg" stroke="#6366f1" strokeWidth={2.5} fill="url(#sgGrad)"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card fade-up">
          <h3 style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
            {hasData ? "Your Skill Competence" : "Skill Distribution"}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
            {hasData ? "Assessed test average against pending skills" : "What employers look for"}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={skillMix} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {skillMix.map((e, i) => <Cell key={i} fill={e.color || '#6366f1'}/>)}
              </Pie>
              <Tooltip formatter={(v: unknown) => [`${(v as number)}%`, '']}/>
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {skillMix.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color || '#6366f1', flexShrink: 0 }}/>
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Career demand bar chart */}
      <div className="card fade-up" style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontWeight: 700, fontSize: 16 }}>
            {hasData ? `Your Predicted Career Path Demands` : "Career Role Market Demand 2025"}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Employer demand index (out of 100)</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={careerDemand} barSize={32}>
            <CartesianGrid strokeDasharray="3 3"/>
            <XAxis dataKey="name"/>
            <YAxis domain={[70, 100]}/>
            <Tooltip/>
            <Bar dataKey="demand" radius={[6, 6, 0, 0]} fill="#6366f1"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Quick action cards */}
      <h2 style={{ fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
      <div className="grid-3">
        {[
          { icon: <Brain size={22}/>, title: 'Run AI Prediction', desc: 'Get instant career path prediction based on your skills', href: '/predict', color: '#6366f1' },
          { icon: <BarChart3 size={22}/>, title: 'Analyze Skill Gap', desc: 'See exactly what skills you need for your dream role', href: '/skills', color: '#8b5cf6' },
          { icon: <Briefcase size={22}/>, title: 'Browse Job Market', desc: 'Explore trending jobs & salary benchmarks', href: '/market', color: '#06b6d4' },
        ].map((a, i) => (
          <a key={i} href={a.href} className="card" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: `rgba(${a.color.includes('6366') ? '99,102,241' : a.color.includes('8b5c') ? '139,92,246' : '6,182,212'},0.15)`,
              color: a.color, marginBottom: 14 }}>
              {a.icon}
            </div>
            <h4 style={{ fontWeight: 700, marginBottom: 6 }}>{a.title}</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{a.desc}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
