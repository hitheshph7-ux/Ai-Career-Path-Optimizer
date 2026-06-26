import React, { useState } from 'react';
import { api } from '../api/client';
import { Upload, FileText, CheckCircle, AlertCircle, X, Zap, Wand2, Download, Copy, Plus, RotateCcw } from 'lucide-react';

type ParseResult = Record<string, unknown>;
type EnhanceResult = Record<string, unknown>;
type Phase = 'upload' | 'parsed' | 'enhanced';

const CAREERS = ['Data Scientist','AI/ML Engineer','Full Stack Developer','Cloud Architect','DevOps Engineer','Cybersecurity Analyst','Mobile Developer'];

const SKILL_SUGGESTIONS: Record<string, string[]> = {
  'Data Scientist':       ['Python','SQL','Machine Learning','Pandas','NumPy','Scikit-learn','TensorFlow','Git'],
  'AI/ML Engineer':       ['Python','TensorFlow','PyTorch','Deep Learning','NLP','Docker','AWS','Git'],
  'Full Stack Developer': ['JavaScript','React','Node.js','SQL','Docker','Git','CI/CD','TypeScript'],
  'Cloud Architect':      ['AWS','Azure','GCP','Kubernetes','Terraform','Docker','System Design','Linux'],
  'DevOps Engineer':      ['Docker','Kubernetes','AWS','CI/CD','Linux','Terraform','Git','Python'],
  'Cybersecurity Analyst':['Linux','Python','Agile','AWS','Git','System Design'],
  'Mobile Developer':     ['JavaScript','React','TypeScript','Git','Agile'],
};

export default function ResumePage() {
  const [file, setFile]           = useState<File | null>(null);
  const [dragging, setDragging]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [result, setResult]       = useState<ParseResult | null>(null);
  const [enhanced, setEnhanced]   = useState<EnhanceResult | null>(null);
  const [error, setError]         = useState('');
  const [phase, setPhase]         = useState<Phase>('upload');
  const [targetRole, setTargetRole] = useState('Data Scientist');
  const [appliedSkills, setAppliedSkills] = useState<string[]>([]);
  const [copied, setCopied]       = useState(false);

  const handleFile = (f: File) => {
    if (!f.name.match(/\.(pdf|txt|doc)$/i)) { setError('Upload a PDF, TXT, or DOC file'); return; }
    setFile(f); setError(''); setResult(null); setEnhanced(null); setPhase('upload');
  };

  const upload = async () => {
    if (!file) return;
    setLoading(true); setError('');
    try {
      const r = await api.parseResume(file);
      setResult(r as ParseResult);
      setAppliedSkills([]);
      setPhase('parsed');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Upload failed'); }
    finally { setLoading(false); }
  };

  // Auto-apply: merge suggestions into skills
  const handleAutoApply = async () => {
    if (!result) return;
    const current = result.skills_extracted as string[];
    const suggestions = (SKILL_SUGGESTIONS[targetRole] || []).filter(s => !current.includes(s));
    try {
      const r = await api.applySuggestions(current, suggestions);
      const merged = (r as Record<string, unknown>).merged_skills as string[];
      const added  = (r as Record<string, unknown>).skills_added as string[];
      setResult(prev => prev ? { ...prev, skills_extracted: merged, skill_count: merged.length, ats_score: Math.min(100, merged.length * 7 + (prev.estimated_experience as number) * 4 + 10) } : prev);
      setAppliedSkills(added);
    } catch { /* silent */ }
  };

  const handleEnhance = async () => {
    if (!result) return;
    setEnhancing(true);
    try {
      const payload = {
        skills_extracted:     result.skills_extracted,
        name_detected:        result.name_detected || 'Your Name',
        email_found:          result.email_found || '',
        phone_found:          result.phone_found || '',
        education_detected:   result.education_detected || 'B.Tech',
        estimated_experience: result.estimated_experience || 0,
        target_role:          targetRole,
        extra_skills:         appliedSkills,
      };
      const r = await api.enhanceResume(payload as Record<string, unknown>);
      setEnhanced(r as EnhanceResult);
      setPhase('enhanced');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Enhancement failed'); }
    finally { setEnhancing(false); }
  };

  const handleCopy = () => {
    if (enhanced?.ats_resume_text) {
      navigator.clipboard.writeText(enhanced.ats_resume_text as string);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (!enhanced?.ats_resume_text) return;
    const blob = new Blob([enhanced.ats_resume_text as string], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'ATS_Resume_Optimized.txt';
    a.click(); URL.revokeObjectURL(url);
  };

  const reset = () => { setFile(null); setResult(null); setEnhanced(null); setPhase('upload'); setError(''); setAppliedSkills([]); };

  const atsColor = (score: number) => score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const currentScore = result ? result.ats_score as number : 0;
  const newScore     = enhanced ? enhanced.new_ats_score as number : 0;

  // ── SELECT STYLE ──────────────────────────────────────────────────────────
  const SELECT = { background:'rgba(255,255,255,0.05)', border:'1px solid var(--border-color)', borderRadius:8, padding:'9px 14px', color:'var(--text-primary)', fontSize:14, fontFamily:'inherit', outline:'none', width:'100%' };

  return (
    <div style={{ padding:32, maxWidth:1000 }}>
      {/* Header */}
      <div className="fade-up" style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:28, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif" }}>📄 Resume Parser & ATS Optimizer</h1>
        <p style={{ color:'var(--text-muted)', marginTop:6 }}>Upload → Parse skills → Auto-apply suggestions → Convert to ATS-friendly resume</p>
      </div>

      {/* Progress steps */}
      <div style={{ display:'flex', gap:0, marginBottom:28 }}>
        {[['1','Upload & Parse','upload'],['2','Apply Suggestions','parsed'],['3','ATS Resume','enhanced']].map(([n, label, p], i) => (
          <React.Fragment key={p}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6, flex:1 }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:700,
                background: phase === p ? 'var(--accent-primary)' : ((['upload','parsed','enhanced'].indexOf(phase) > i) ? 'var(--accent-green)' : 'rgba(255,255,255,0.06)'),
                color: phase === p || ['upload','parsed','enhanced'].indexOf(phase) > i ? '#fff' : 'var(--text-muted)',
                transition:'all 0.3s',
              }}>
                {['upload','parsed','enhanced'].indexOf(phase) > i ? <CheckCircle size={16}/> : n}
              </div>
              <span style={{ fontSize:11, color: phase===p ? 'var(--text-primary)' : 'var(--text-muted)', whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ height:2, flex:1, background: ['upload','parsed','enhanced'].indexOf(phase) > i ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)', marginBottom:22, transition:'all 0.5s' }}/>}
          </React.Fragment>
        ))}
      </div>

      {/* ── PHASE 1: Upload ──────────────────────────────────────────────── */}
      {phase === 'upload' && (
        <div className="card fade-up">
          <div
            onDrop={e => { e.preventDefault(); setDragging(false); if(e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => document.getElementById('resume-input')?.click()}
            style={{ border:`2px dashed ${dragging?'var(--accent-primary)':file?'var(--accent-green)':'var(--border-color)'}`, borderRadius:16, padding:52, textAlign:'center', cursor:'pointer', background: dragging?'rgba(99,102,241,0.05)':file?'rgba(16,185,129,0.05)':'transparent', transition:'var(--transition)' }}>
            <input id="resume-input" type="file" accept=".pdf,.txt,.doc" style={{ display:'none' }} onChange={e => { if(e.target.files?.[0]) handleFile(e.target.files[0]); }}/>
            {file ? (
              <>
                <FileText size={48} color="var(--accent-green)" style={{ marginBottom:12 }}/>
                <p style={{ fontWeight:700, marginBottom:4 }}>{file.name}</p>
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>{(file.size/1024).toFixed(1)} KB</p>
                <button style={{ marginTop:10, background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:13, display:'inline-flex', gap:4, alignItems:'center' }}
                  onClick={e => { e.stopPropagation(); setFile(null); }}>
                  <X size={14}/> Remove
                </button>
              </>
            ) : (
              <>
                <Upload size={48} color="var(--text-muted)" style={{ marginBottom:12 }}/>
                <p style={{ fontWeight:600, fontSize:16, marginBottom:4 }}>Drop your resume here</p>
                <p style={{ color:'var(--text-muted)', fontSize:13 }}>or click to browse — PDF, TXT, DOC supported</p>
              </>
            )}
          </div>

          {error && <div style={{ marginTop:14, padding:12, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:8, color:'#f87171', fontSize:13, display:'flex', gap:8, alignItems:'center' }}><AlertCircle size={14}/>{error}</div>}

          {file && (
            <button className="btn btn-primary" onClick={upload} disabled={loading} style={{ marginTop:20, width:'100%', justifyContent:'center', fontSize:15, padding:'13px' }}>
              {loading ? <><span className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block' }}/> Parsing...</> : <><Zap size={16}/> Parse Resume</>}
            </button>
          )}
        </div>
      )}

      {/* ── PHASE 2: Parsed + Suggestions ───────────────────────────────── */}
      {phase === 'parsed' && result && (
        <div className="fade-up">
          {/* Score row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:20 }}>
            {[
              { label:'ATS Score', value:`${currentScore}`, unit:'/100', color: atsColor(currentScore), icon:'📊' },
              { label:'Skills Found', value:`${result.skill_count}`, unit:'skills', color:'#6366f1', icon:'🛠️' },
              { label:'Experience', value:`${result.estimated_experience}`, unit:'years', color:'#06b6d4', icon:'⏱️' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:32, fontWeight:900, fontFamily:"'Space Grotesk',sans-serif", color:s.color }}>{s.value}</div>
                <div style={{ fontSize:12, color:'var(--text-muted)' }}>{s.label} · {s.unit}</div>
              </div>
            ))}
          </div>

          {/* Target role selector */}
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div style={{ flex:1, minWidth:200 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'var(--text-secondary)', marginBottom:8 }}>Target Career Role</p>
                <select style={SELECT} value={targetRole} onChange={e => setTargetRole(e.target.value)}>
                  {CAREERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <button onClick={handleAutoApply} className="btn btn-secondary" style={{ gap:8, whiteSpace:'nowrap', borderColor:'var(--accent-green)', color:'#34d399' }}>
                <Plus size={16}/> Auto-Apply Suggestions
              </button>
            </div>

            {appliedSkills.length > 0 && (
              <div style={{ marginTop:14, padding:12, background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:10, fontSize:13 }}>
                <span style={{ color:'#34d399', fontWeight:700 }}>✅ {appliedSkills.length} skills added: </span>
                <span style={{ color:'var(--text-secondary)' }}>{appliedSkills.join(' • ')}</span>
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="card" style={{ marginBottom:16 }}>
            <h3 style={{ fontWeight:700, marginBottom:14 }}>✅ Extracted Skills ({(result.skills_extracted as string[]).length})</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {(result.skills_extracted as string[]).map((s, i) => (
                <span key={i} style={{ padding:'5px 14px', background: appliedSkills.includes(s) ? 'rgba(16,185,129,0.15)' : 'rgba(99,102,241,0.15)', border:`1px solid ${appliedSkills.includes(s)?'rgba(16,185,129,0.4)':'rgba(99,102,241,0.3)'}`, borderRadius:20, fontSize:13, fontWeight:600, color: appliedSkills.includes(s)?'#34d399':'#a5b4fc' }}>
                  {appliedSkills.includes(s) ? '+ ' : ''}{s}
                </span>
              ))}
            </div>
          </div>

          {/* ATS Recommendations */}
          <div className="card" style={{ marginBottom:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap:'wrap', gap:10 }}>
              <h3 style={{ fontWeight:700 }}>💡 ATS Improvement Suggestions</h3>
              <button onClick={handleAutoApply} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', color:'#34d399', cursor:'pointer', fontSize:13, fontWeight:600, fontFamily:'inherit', transition:'var(--transition)' }}
                onMouseEnter={e => (e.currentTarget.style.background='rgba(16,185,129,0.22)')}
                onMouseLeave={e => (e.currentTarget.style.background='rgba(16,185,129,0.12)')}>
                <Plus size={14}/> Apply All Skills
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {(result.recommendations as string[]).map((r, i) => (
                <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, padding:'10px 14px', background:'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:10 }}>
                  <div style={{ display:'flex', gap:10, alignItems:'flex-start', flex:1 }}>
                    <span style={{ color:'#fbbf24', fontSize:16, flexShrink:0, marginTop:1 }}>⚡</span>
                    <span style={{ fontSize:14, color:'var(--text-secondary)' }}>{r}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Convert button */}
          <div style={{ display:'flex', gap:12 }}>
            <button className="btn btn-secondary" onClick={reset}>← Re-upload</button>
            <button className="btn btn-primary" onClick={handleEnhance} disabled={enhancing} style={{ flex:1, justifyContent:'center', fontSize:15, padding:'13px' }}>
              {enhancing
                ? <><span className="spin" style={{ width:16,height:16,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block' }}/> Generating ATS Resume...</>
                : <><Wand2 size={16}/> Convert to ATS-Friendly Resume</>}
            </button>
          </div>
        </div>
      )}

      {/* ── PHASE 3: Enhanced ATS Resume ─────────────────────────────────── */}
      {phase === 'enhanced' && enhanced && (
        <div className="fade-up">
          {/* Score comparison */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:14, marginBottom:20 }}>
            {[
              { label:'Old ATS Score', value:`${currentScore}/100`, color: atsColor(currentScore), icon:'📉' },
              { label:'New ATS Score', value:`${newScore}/100`, color: atsColor(newScore), icon:'📈' },
              { label:'Skills Included', value:`${enhanced.total_skills}`, color:'#6366f1', icon:'🛠️' },
              { label:'Skills Added', value:`+${enhanced.skills_added}`, color:'#10b981', icon:'✅' },
            ].map((s, i) => (
              <div key={i} className="card" style={{ textAlign:'center' }}>
                <div style={{ fontSize:20, marginBottom:6 }}>{s.icon}</div>
                <div style={{ fontSize:24, fontWeight:900, fontFamily:"'Space Grotesk',sans-serif", color:s.color }}>{s.value}</div>
                <div style={{ fontSize:11, color:'var(--text-muted)', marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Score improvement banner */}
          {newScore > currentScore && (
            <div style={{ padding:'14px 20px', background:'linear-gradient(135deg,rgba(16,185,129,0.1),rgba(6,182,212,0.08))', border:'1px solid rgba(16,185,129,0.25)', borderRadius:12, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:24 }}>🎉</span>
              <div>
                <p style={{ fontWeight:700, color:'#34d399' }}>ATS Score improved by +{newScore - currentScore} points!</p>
                <p style={{ fontSize:13, color:'var(--text-muted)' }}>Your resume is now optimized for {enhanced.target_role as string} roles</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
            <button onClick={() => setPhase('parsed')} className="btn btn-secondary"><RotateCcw size={14}/> Back</button>
            <button onClick={handleCopy} className="btn btn-secondary" style={{ color: copied ? '#34d399' : undefined, borderColor: copied ? 'rgba(16,185,129,0.4)' : undefined }}>
              <Copy size={14}/> {copied ? 'Copied!' : 'Copy Text'}
            </button>
            <button onClick={handleDownload} className="btn btn-primary" style={{ marginLeft:'auto' }}>
              <Download size={14}/> Download .txt
            </button>
          </div>

          {/* Resume preview */}
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div style={{ padding:'14px 20px', background:'rgba(99,102,241,0.08)', borderBottom:'1px solid var(--border-color)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <FileText size={16} color="var(--accent-primary)"/>
                <span style={{ fontWeight:700, fontSize:14 }}>ATS-Optimized Resume</span>
                <span className="badge badge-blue">For {enhanced.target_role as string}</span>
              </div>
              <span style={{ fontSize:12, color:'var(--text-muted)' }}>{enhanced.word_count as number} words</span>
            </div>
            <pre style={{ padding:28, margin:0, fontFamily:"'Courier New', Courier, monospace", fontSize:13, lineHeight:1.7, color:'var(--text-secondary)', background:'rgba(0,0,0,0.2)', whiteSpace:'pre-wrap', wordBreak:'break-word', maxHeight:600, overflowY:'auto' }}>
              {enhanced.ats_resume_text as string}
            </pre>
          </div>

          {/* Tips box */}
          <div style={{ marginTop:16, padding:18, background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:12 }}>
            <p style={{ fontWeight:700, marginBottom:10, color:'var(--accent-primary)' }}>📋 Before Submitting</p>
            <ul style={{ listStyle:'none', padding:0, display:'flex', flexDirection:'column', gap:6 }}>
              {['Fill in [Company Name], [City], and date placeholders with your real experience','Remove the ATS Optimization Notes section at the bottom','Add your actual project links and GitHub URLs','Quantify every bullet point with real numbers and percentages','Save as .docx for Word-based ATS, or .pdf for modern ATS systems'].map((t, i) => (
                <li key={i} style={{ fontSize:13, color:'var(--text-muted)', display:'flex', gap:8 }}>
                  <span style={{ color:'var(--accent-primary)', flexShrink:0 }}>→</span>{t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
