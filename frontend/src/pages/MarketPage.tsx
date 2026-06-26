import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Line } from 'recharts';
import { Briefcase, Search } from 'lucide-react';

export default function MarketPage() {
  const [trends, setTrends]   = useState<Record<string,unknown> | null>(null);
  const [salaries, setSalaries] = useState<unknown[]>([]);
  const [jobs, setJobs]       = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    Promise.all([api.getMarketTrends(), api.getSalaries(), api.getJobs()])
      .then(([t, s, j]) => {
        setTrends(t as Record<string,unknown>);
        setSalaries((s as Record<string,unknown[]>).salary_data || []);
        setJobs((j as Record<string,unknown[]>).jobs || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredJobs = (jobs as Record<string,unknown>[]).filter(j =>
    !search || (j.title as string).toLowerCase().includes(search.toLowerCase()) ||
    (j.company as string).toLowerCase().includes(search.toLowerCase())
  );

  const trendingSkills = trends ? (trends.trending_skills as Record<string,unknown>[]) : [];
  const yearData = trends ? ((trends.market_overview as Record<string,unknown>)?.year_data as Record<string,unknown>[]) : [];

  if (loading) return (
    <div style={{ padding:32, display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <div style={{ textAlign:'center' }}>
        <div className="spin" style={{ width:40,height:40,border:'3px solid var(--border-color)',borderTop:'3px solid var(--accent-primary)',borderRadius:'50%',margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--text-muted)' }}>Loading market data...</p>
      </div>
    </div>
  );

  return (
    <div style={{ padding:32, maxWidth:1200 }}>
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>
          <Briefcase style={{ display:'inline',marginRight:10 }} size={26}/> Job Market Intelligence
        </h1>
        <p style={{ color:'var(--text-muted)', marginTop:6 }}>Real-time market trends, salaries, and job opportunities</p>
      </div>

      {/* Growth chart */}
      {yearData.length > 0 && (
        <div className="card fade-up" style={{ marginBottom:24 }}>
          <h3 style={{ fontWeight:700, marginBottom:4 }}>📈 Tech Job Market Growth</h3>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:20 }}>Total tech job openings & avg salary over 6 years</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={yearData as Record<string,unknown>[]}>
              <defs>
                <linearGradient id="jg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="year"/>
              <YAxis yAxisId="left" tickFormatter={v => `${(v/1000000).toFixed(1)}M`}/>
              <YAxis yAxisId="right" orientation="right" tickFormatter={v => `$${(v/1000).toFixed(0)}K`}/>
              <Tooltip formatter={(v: unknown, n: unknown) => (n as string)==='jobs' ? [`${((v as number)/1000000).toFixed(2)}M jobs`,''] : [`$${((v as number)/1000).toFixed(0)}K avg`,''] }/>
              <Area yAxisId="left" type="monotone" dataKey="jobs" fill="url(#jg)" stroke="#06b6d4" strokeWidth={2}/>
              <Line yAxisId="right" type="monotone" dataKey="avg_salary" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill:'#f59e0b', r:4 }}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Trending skills */}
        <div className="card fade-up">
          <h3 style={{ fontWeight:700, marginBottom:4 }}>🔥 Trending Tech Skills</h3>
          <p style={{ color:'var(--text-muted)', fontSize:13, marginBottom:16 }}>Highest employer demand in 2025</p>
          {trendingSkills.slice(0,8).map((s, i) => (
            <div key={i} style={{ marginBottom:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontWeight:600, fontSize:14 }}>{s.skill as string}</span>
                  <span className="badge badge-blue">{s.category as string}</span>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ color:'var(--accent-green)', fontSize:12, fontWeight:600 }}>{s.growth as string}</span>
                  <span style={{ color:'var(--text-muted)', fontSize:12 }}>{s.demand as number}%</span>
                </div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width:`${s.demand as number}%`, background:`hsl(${(s.demand as number)*2},70%,60%)` }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Salary comparison */}
        <div className="card fade-up">
          <h3 style={{ fontWeight:700, marginBottom:20 }}>💰 Salary by Career Role</h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={(salaries as Record<string,unknown>[]).map(s => ({ name:(s.career as string).replace(' Developer','').replace(' Engineer',''), avg:(s.avg as number)/1000 }))} layout="vertical" barSize={14}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis type="number" tickFormatter={v => `$${v}K`}/>
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize:11 }}/>
              <Tooltip formatter={(v: unknown) => [`$${(v as number)}K`, 'Avg Salary']}/>
              <Bar dataKey="avg" fill="#6366f1" radius={[0,4,4,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Jobs */}
      <div className="card fade-up">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, flexWrap:'wrap', gap:12 }}>
          <h3 style={{ fontWeight:700 }}>🔍 Live Job Listings ({filteredJobs.length})</h3>
          <div style={{ position:'relative' }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input className="form-input" style={{ paddingLeft:36, width:240 }} placeholder="Search jobs..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div style={{ display:'grid', gap:12 }}>
          {filteredJobs.map((job, i) => {
            const j = job as Record<string,unknown>;
            return (
              <div key={i} style={{ padding:16, background:'rgba(255,255,255,0.03)', borderRadius:12, border:'1px solid var(--border-color)',
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
                transition:'var(--transition)', cursor:'pointer' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--accent-primary)'; (e.currentTarget as HTMLElement).style.background='rgba(99,102,241,0.05)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor='var(--border-color)'; (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.03)'; }}
              >
                <div>
                  <h4 style={{ fontWeight:700, marginBottom:4 }}>{j.title as string}</h4>
                  <p style={{ color:'var(--text-muted)', fontSize:13 }}>{j.company as string} • {j.location as string} • {j.posted as string}</p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ color:'var(--accent-green)', fontWeight:700, fontSize:14 }}>{j.salary as string}</span>
                  <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(16,185,129,0.15)', color:'#34d399', fontSize:12, fontWeight:700 }}>
                    {j.match as number}% match
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
