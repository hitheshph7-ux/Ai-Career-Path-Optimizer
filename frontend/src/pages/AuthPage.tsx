import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';

type Mode = 'login' | 'register';

export default function AuthPage() {
  const [mode, setMode]         = useState<Mode>('login');
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('demo@aicareer.com');
  const [password, setPassword] = useState('password123');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login, register }     = useAuth();
  const navigate                = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(name, email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center',
      background:'var(--bg-primary)', padding:24, position:'relative', overflow:'hidden',
    }}>
      {/* Background orbs */}
      <div style={{ position:'absolute', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)', top:-100, left:-100, pointerEvents:'none' }}/>
      <div style={{ position:'absolute', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(139,92,246,0.1) 0%,transparent 70%)', bottom:-80, right:-80, pointerEvents:'none' }}/>

      <div className="fade-up" style={{ width:'100%', maxWidth:440 }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{
            width:60, height:60, borderRadius:16, background:'var(--grad-primary)',
            display:'inline-flex', alignItems:'center', justifyContent:'center', marginBottom:16,
            boxShadow:'0 0 40px rgba(99,102,241,0.4)',
          }}>
            <Zap size={28} color="#fff"/>
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", marginBottom:6 }}>
            AI Career Optimizer
          </h1>
          <p style={{ color:'var(--text-muted)', fontSize:14 }}>
            Discover your perfect career path with AI
          </p>
        </div>

        {/* Card */}
        <div className="glass" style={{ padding:32 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:0, marginBottom:28, background:'rgba(255,255,255,0.04)', borderRadius:10, padding:4 }}>
            {(['login','register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }} style={{
                flex:1, padding:'8px 16px', border:'none', borderRadius:8,
                background: mode===m ? 'var(--accent-primary)' : 'transparent',
                color: mode===m ? '#fff' : 'var(--text-secondary)',
                cursor:'pointer', fontWeight:600, fontSize:14, fontFamily:'inherit',
                transition:'var(--transition)',
              }}>
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:18 }}>
            {mode === 'register' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position:'relative' }}>
                  <User size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
                  <input className="form-input" style={{ paddingLeft:38 }}
                    placeholder="John Doe" value={name} onChange={e => setName(e.target.value)} required />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position:'relative' }}>
                <Mail size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
                <input className="form-input" style={{ paddingLeft:38 }}
                  type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position:'relative' }}>
                <Lock size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
                <input className="form-input" style={{ paddingLeft:38, paddingRight:38 }}
                  type={showPw ? 'text' : 'password'} placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)',
                }}>
                  {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)',
                borderRadius:8, padding:'10px 14px', color:'#f87171', fontSize:13,
                display:'flex', gap:8, alignItems:'center' }}>
                <AlertCircle size={14}/> {error}
              </div>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%', justifyContent:'center', padding:'12px 24px', fontSize:15, marginTop:4 }}>
              {loading
                ? <><span className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block' }}/> Processing...</>
                : mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <div style={{ marginTop:20, padding:14, background:'rgba(99,102,241,0.08)', borderRadius:8, border:'1px solid rgba(99,102,241,0.2)', fontSize:13, color:'var(--text-secondary)' }}>
              <strong style={{ color:'var(--accent-primary)' }}>Demo credentials:</strong><br/>
              Email: demo@aicareer.com &nbsp;|&nbsp; Password: password123
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
