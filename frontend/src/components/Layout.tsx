import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Brain, BarChart3, Briefcase,
  FileText, ClipboardList, LogOut, ChevronLeft, ChevronRight, Zap
} from 'lucide-react';

const NAV = [
  { to: '/dashboard',   icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/predict',     icon: Brain,           label: 'AI Predictor' },
  { to: '/skills',      icon: BarChart3,       label: 'Skill Gap' },
  { to: '/market',      icon: Briefcase,       label: 'Job Market' },
  { to: '/resume',      icon: FileText,        label: 'Resume Parser' },
  { to: '/assessment',  icon: ClipboardList,   label: 'Assessment' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 68 : 240,
        background:'var(--bg-secondary)',
        borderRight:'1px solid var(--border-color)',
        display:'flex', flexDirection:'column',
        transition:'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        position:'fixed', top:0, left:0, bottom:0, zIndex:100,
        overflow:'hidden',
        flexShrink: 0,
      }}>
        {/* Logo + Toggle Row */}
        <div style={{
          padding:'16px 12px',
          borderBottom:'1px solid var(--border-color)',
          display:'flex', alignItems:'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap:8, minHeight:64,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, overflow:'hidden' }}>
            <div style={{
              width:36, height:36, borderRadius:10, flexShrink:0,
              background:'var(--grad-primary)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 16px rgba(99,102,241,0.4)',
            }}>
              <Zap size={18} color="#fff" />
            </div>
            {!collapsed && (
              <div style={{ overflow:'hidden' }}>
                <div style={{ fontWeight:800, fontSize:14, fontFamily:"'Space Grotesk',sans-serif", letterSpacing:'-0.01em', whiteSpace:'nowrap' }}>
                  AI Career
                </div>
                <div style={{ fontSize:11, color:'var(--text-muted)', whiteSpace:'nowrap' }}>Path Optimizer</div>
              </div>
            )}
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{
              width:28, height:28, borderRadius:8, flexShrink:0,
              background:'rgba(255,255,255,0.06)',
              border:'1px solid var(--border-color)',
              cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
              color:'var(--text-muted)', transition:'var(--transition)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(99,102,241,0.15)'; (e.currentTarget as HTMLElement).style.color='var(--text-primary)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color='var(--text-muted)'; }}
          >
            {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 8px', display:'flex', flexDirection:'column', gap:2 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} style={({ isActive }) => ({
              display:'flex', alignItems:'center', gap:10,
              padding: collapsed ? '10px 0' : '10px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius:10,
              color: isActive ? '#c7d2fe' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.18)' : 'transparent',
              textDecoration:'none', fontSize:14, fontWeight: isActive ? 600 : 500,
              transition:'var(--transition)', overflow:'hidden',
              borderLeft: isActive ? '3px solid var(--accent-primary)' : '3px solid transparent',
            })}>
              <Icon size={18} style={{ flexShrink:0 }} />
              {!collapsed && <span style={{ whiteSpace:'nowrap' }}>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{ padding:'12px 8px', borderTop:'1px solid var(--border-color)' }}>
          {!collapsed && (
            <div style={{ padding:'8px 12px', marginBottom:6, borderRadius:8, background:'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize:13, fontWeight:600, color:'var(--text-primary)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</div>
              <div style={{ fontSize:11, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</div>
            </div>
          )}
          <button onClick={handleLogout} style={{
            display:'flex', alignItems:'center', gap:10,
            padding: collapsed ? '10px 0' : '10px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius:10, color:'#f87171', background:'transparent', border:'none',
            cursor:'pointer', fontSize:14, fontWeight:500, width:'100%',
            transition:'var(--transition)',
          }}
            onMouseEnter={e => (e.currentTarget.style.background='rgba(239,68,68,0.1)')}
            onMouseLeave={e => (e.currentTarget.style.background='transparent')}
          >
            <LogOut size={18} style={{ flexShrink:0 }} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main style={{
        marginLeft: collapsed ? 68 : 240,
        flex:1,
        transition:'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
        minHeight:'100vh',
        overflow:'auto',
      }}>
        {children}
      </main>
    </div>
  );
}
