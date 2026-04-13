import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './Login.css';

export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bankInfo, setBankInfo] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, bankInfo, phone, address })
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '登録に失敗しました');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/agent');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container glass-panel page-transition" style={{maxWidth: '500px'}}>
        <div className="login-header">
          <h1 className="gradient-text-gold logo-title">DENBA Health</h1>
          <p className="subtitle">代理店 新規登録</p>
        </div>
        
        <form className="login-card" onSubmit={handleRegister}>
          <p className="login-desc" style={{marginBottom: '20px'}}>
            必要な情報を入力してアカウントを作成してください。
          </p>
          
          {error && <div className="error-msg" style={{color: '#ffaaaa', marginBottom: '16px', background: 'rgba(255,0,0,0.1)', padding: '8px', borderRadius: '4px'}}>{error}</div>}

          <div style={{display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px'}}>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>お名前・法人名</label>
               <input type="text" className="link-input" value={name} onChange={e=>setName(e.target.value)} required placeholder="山田 太郎" />
            </div>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>電話番号</label>
               <input type="tel" className="link-input" value={phone} onChange={e=>setPhone(e.target.value)} required placeholder="090-1234-5678" />
            </div>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>ご住所（郵便番号・建物名まで）</label>
               <input type="text" className="link-input" value={address} onChange={e=>setAddress(e.target.value)} required placeholder="〒100-0000 東京都..." />
            </div>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>メールアドレス（ログイン用）</label>
               <input type="email" className="link-input" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="yamada@example.com" />
            </div>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>パスワード</label>
               <input type="password" className="link-input" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="8文字以上" minLength="6" />
            </div>
            <div>
               <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>報酬お振込先口座</label>
               <input type="text" className="link-input" value={bankInfo} onChange={e=>setBankInfo(e.target.value)} required placeholder="〇〇銀行 〇〇支店 普通123456" />
            </div>
          </div>

          <button type="submit" className="primary-btn" style={{width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'}} disabled={loading}>
            {loading ? '登録中...' : 'アカウントを作成して始める'}
          </button>
          
          <div style={{marginTop: '20px', textAlign: 'center', fontSize: '0.9rem'}}>
             <a href="/login" style={{color: 'var(--text-secondary)', textDecoration: 'underline'}}>既にアカウントをお持ちの方（ログイン）</a>
          </div>
        </form>
      </div>
    </div>
  );
}
