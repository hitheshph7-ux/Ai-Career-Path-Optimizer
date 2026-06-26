import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'var(--bg-primary)' }}>
      <div style={{ textAlign:'center' }}>
        <div className="spin" style={{ width:40,height:40,border:'3px solid var(--border-color)',borderTop:'3px solid var(--accent-primary)',borderRadius:'50%',margin:'0 auto 16px' }}/>
        <p style={{ color:'var(--text-muted)' }}>Loading...</p>
      </div>
    </div>
  );
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}
