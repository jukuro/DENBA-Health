import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User } from 'lucide-react';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      if (data.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/agent');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const autoFillAgent = () => { setEmail('tanaka@example.com'); setPassword('agent123'); };
  const autoFillWholesale = () => { setEmail('suzuki@example.com'); setPassword('agent123'); };
  const autoFillAdmin = () => { setEmail('admin@denba-hq.com'); setPassword('admin123'); };

  return (
    <div className="login-wrapper">
      <div className="login-container glass-panel page-transition">
        <div className="login-header">
          <h1 className="gradient-text-gold logo-title">DENBA Health</h1>
          <p className="subtitle">代理店ポータルシステム</p>
        </div>
        
        <form className="login-card" onSubmit={handleLogin}>
          <p className="login-desc">登録されたメールアドレスとパスワードを入力</p>
          
          {error && <div className="error-msg" style={{color: '#ffaaaa', marginBottom: '16px', background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '4px'}}>{error}</div>}

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
            <input 
              type="email" 
              placeholder="メールアドレス" 
              className="link-input" 
              value={email} onChange={e=>setEmail(e.target.value)}
              required 
            />
            <input 
              type="password" 
              placeholder="パスワード" 
              className="link-input" 
              value={password} onChange={e=>setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="primary-btn" style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'}} disabled={loading}>
            {loading ? '認証中...' : 'ログイン'}
          </button>

          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
             <a href="/register" style={{color: 'var(--text-secondary)', textDecoration: 'underline'}}>新規代理店登録はこちら（招待コードをお持ちの方）</a>
          </div>
          <div style={{marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px', fontSize: '0.85rem'}}>
            <p style={{color: 'var(--text-muted)', marginBottom: '8px'}}>テスト用自動入力：</p>
            <div style={{display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap'}}>
               <button type="button" onClick={autoFillAgent} style={{background: 'rgba(56,189,248,0.1)', color: 'var(--accent-blue)', padding: '4px 8px', borderRadius: '4px'}}>紹介型 (田中様)</button>
               <button type="button" onClick={autoFillWholesale} style={{background: 'rgba(167,139,250,0.1)', color: '#A78BFA', padding: '4px 8px', borderRadius: '4px'}}>卸型 (鈴木様)</button>
               <button type="button" onClick={autoFillAdmin} style={{background: 'rgba(252,211,77,0.1)', color: 'var(--accent-gold)', padding: '4px 8px', borderRadius: '4px'}}>本部管理者</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
