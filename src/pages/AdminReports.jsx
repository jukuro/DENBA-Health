import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { DollarSign, Activity, CreditCard, Calendar, Award } from 'lucide-react';
import './AdminDashboard.css'; // Reuse CSS

export default function AdminReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchReports();
  }, [token, navigate]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="page-wrapper fade-in" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>データの読み込み中...</div>;
  }

  return (
    <div className="page-wrapper fade-in">
      <Header role="admin" user={{name: "本部管理者"}} />
      
      <main className="container dashboard-main">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '24px'}}>
           <div>
              <h2 style={{color: 'var(--text-primary)', margin: 0}}>累計実績・詳細レポート</h2>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0'}}>事業開始からのすべての期間の累計データが表示されています</p>
           </div>
           
           <button 
              className="primary-btn"
              style={{display:'flex', alignItems:'center', gap:'8px', background:'var(--bg-secondary)', color:'var(--text-primary)', border:'1px solid var(--border-color)'}}
              onClick={() => navigate('/admin')}
           >
              ダッシュボードへ戻る
           </button>
        </div>

        <div className="stats-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'}}>
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">全期間: 総売上</span>
              <DollarSign className="stat-icon" style={{color: 'var(--accent-gold)'}}/>
            </div>
            <div className="stat-value">¥{data.allTimeRevenue.toLocaleString()}</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">全期間: 総利益 (粗利)</span>
              <Activity className="stat-icon" style={{color: 'var(--accent-green)'}}/>
            </div>
            <div className="stat-value" style={{color: 'var(--accent-gold)'}}>¥{data.allTimeHqProfit.toLocaleString()}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">全期間: 代理店報酬総額</span>
              <CreditCard className="stat-icon" style={{color: 'var(--accent-blue)'}}/>
            </div>
            <div className="stat-value" style={{color: 'var(--accent-blue)'}}>¥{data.allTimePayouts.toLocaleString()}</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">全期間: 販売台数</span>
              <Calendar className="stat-icon" style={{color: 'var(--text-secondary)'}}/>
            </div>
            <div className="stat-value">{data.allTimeSalesCount} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>台</span></div>
          </div>
        </div>

        {/* Agent Ranking Table */}
        <div className="glass-panel" style={{marginTop: '32px'}}>
          <div className="table-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--border-color)'}}>
            <h3 className="card-title" style={{marginBottom: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
               <Award size={20} className="icon-gold" /> 代理店別 累計売上ランキング
            </h3>
          </div>
          
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>順位</th>
                  <th>代理店ID</th>
                  <th>お名前</th>
                  <th>契約種別</th>
                  <th>販売台数</th>
                  <th>累計売上高</th>
                </tr>
              </thead>
              <tbody>
                {data.agentRanking.map((agent, index) => (
                  <tr key={agent.id}>
                    <td>
                      <span style={{
                         display: 'inline-block',
                         width: '24px', height: '24px', textAlign: 'center', lineHeight: '24px', borderRadius: '50%',
                         background: index === 0 ? 'var(--accent-gold)' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : 'var(--bg-secondary)',
                         color: index < 3 ? '#000' : 'var(--text-muted)',
                         fontWeight: index < 3 ? 'bold' : 'normal'
                      }}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="mono">{agent.id}</td>
                    <td style={{fontWeight: '500'}}>{agent.name}</td>
                    <td>
                      <span className={`type-badge ${agent.type === '卸型' ? 'badge-gold' : 'badge-blue'}`}>
                        {agent.type} {agent.tier ? `${agent.tier}%` : ''}
                      </span>
                    </td>
                    <td>{agent.salesCount} 台</td>
                    <td style={{color: 'var(--accent-gold)', fontWeight: 'bold'}}>¥{agent.totalSalesValue.toLocaleString()}</td>
                  </tr>
                ))}
                {data.agentRanking.length === 0 && (
                   <tr><td colSpan="6" style={{textAlign:'center', color:'var(--text-muted)'}}>代理店が登録されていません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
