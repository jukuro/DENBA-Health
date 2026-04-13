import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import './Header.css';

export default function Header({ role, user }) {
  const navigate = useNavigate();
  return (
    <header className="app-header glass-panel">
      <div className="header-container">
        <div className="header-logo">
          <span className="gradient-text-gold logo-text">DENBA Health</span>
          <span className="role-badge">{role === 'admin' ? '本部' : '代理店'}</span>
        </div>
        <div className="header-user">
          <span className="user-name">{user.name} 様</span>
          <button className="logout-btn" onClick={() => navigate('/login')}>
            <LogOut size={18} />
            <span>ログアウト</span>
          </button>
        </div>
      </div>
    </header>
  );
}
