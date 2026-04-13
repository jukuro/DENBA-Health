import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import GuidelinesModal from '../components/GuidelinesModal';
import SaleDetailsModal from '../components/SaleDetailsModal';
import { Users, DollarSign, Activity, CreditCard, FileText, BookOpen, Plus, History, Calendar, TrendingUp } from 'lucide-react';
import { PRODUCTS } from './Purchase';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [allSales, setAllSales] = useState([]);
  const [pamphlets, setPamphlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  
  // HQ Direct Sales Modal
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0] || {name:'チャージ', price:396000});
  const [isDemo, setIsDemo] = useState(true);

  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isEditingAgent, setIsEditingAgent] = useState(false);
  const [editAgentType, setEditAgentType] = useState('紹介型');
  const [editAgentTier, setEditAgentTier] = useState('10');
  const token = localStorage.getItem('token');

  const fetchDashboard = useCallback(() => {
    Promise.all([
       fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
       fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/pamphlets`, { headers: { 'Authorization': `Bearer ${token}` } }),
       fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/sales-all`, { headers: { 'Authorization': `Bearer ${token}` } })
    ])
    .then(async ([resDash, resPam, resAllSales]) => {
       if(resDash.status === 401 || resDash.status === 403) throw new Error('Auth failed');
       const jsonDash = await resDash.json();
       const jsonPam = await resPam.json();
       const jsonAllSales = await resAllSales.json();
       setData(jsonDash);
       setPamphlets(jsonPam);
       setAllSales(jsonAllSales);
       setLoading(false);
    })
    .catch(err => {
       localStorage.removeItem('token');
       navigate('/login');
    });
  }, [navigate, token]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchDashboard();
  }, [token, navigate, fetchDashboard]);

  const updateStatus = async (orderId, newStatus) => {
     try {
       await fetch(`http://localhost:3001/api/admin/sales/${orderId}/status`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
       });
       fetchDashboard();
     } catch (err) {
       alert('ステータス更新に失敗しました');
     }
  };

  const updatePamphletStatus = async (pamId, newStatus) => {
     try {
       await fetch(`http://localhost:3001/api/admin/pamphlets/${pamId}/status`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
       });
       fetchDashboard();
     } catch (err) {
       alert('ステータス更新に失敗しました');
     }
  };

  const handleSaveAgent = async () => {
     if (!selectedAgent) return;
     try {
       await fetch(`http://localhost:3001/api/admin/agents/${selectedAgent.id}`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ type: editAgentType, tier: editAgentTier })
       });
       setSelectedAgent({
         ...selectedAgent,
         type: editAgentType,
         tier: editAgentType === '卸型' ? null : parseInt(editAgentTier, 10)
       });
       setIsEditingAgent(false);
       fetchDashboard();
     } catch (err) {
       alert('更新に失敗しました');
     }
  };

  const handleReportHQSale = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/admin/sales`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ customerName: newCustomer, companyName: newCompany, date: newDate, isDemo, productName: selectedProduct.name, productPrice: selectedProduct.price })
      });
      if (res.ok) {
         setShowSaleModal(false);
         setNewCustomer('');
         setNewCompany('');
         fetchDashboard();
      } else {
         const d = await res.json();
         alert(d.error || 'エラーが発生しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  if (loading || !data) return <div className="page-wrapper" style={{display:'flex',justifyContent:'center',alignItems:'center', height:'100vh'}}>データの読み込み中...</div>;

  return (
    <div className="page-wrapper fade-in">
      <Header role="admin" user={{name: "本部管理者"}} />
      
      <main className="container dashboard-main">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '24px'}}>
           <div>
              <h2 style={{color: 'var(--text-primary)', margin: 0}}>本部ダッシュボード</h2>
              <p style={{color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0'}}>当月の実績データと業務の管理（月次で毎月リセットされます）</p>
           </div>
           
           <div style={{display:'flex', gap:'12px'}}>
             <Link to="/admin/reports" className="link-input flex-center" style={{textDecoration:'none', color:'var(--text-primary)', border:'1px solid var(--accent-gold)', borderRadius:'24px', padding:'8px 16px', background:'rgba(212, 175, 55, 0.1)', cursor:'pointer'}}>
                <TrendingUp size={16} style={{marginRight:'6px', color:'var(--accent-gold)'}}/> 全期間の累計レポートを見る
             </Link>
             <button 
                className="primary-btn"
                style={{display:'flex', alignItems:'center', gap:'8px', background:'var(--accent-blue)'}}
                onClick={() => setShowGuidelines(true)}
             >
                <BookOpen size={18} /> 代理店規定・標準業務フローを確認
             </button>
           </div>
        </div>

        <div className="glass-panel content-card" style={{marginBottom: '24px', padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)'}}>
          <div>
            <h3 style={{fontSize: '1rem', marginBottom: '4px', color: 'var(--text-primary)'}}>新規代理店の招待・登録用リンク</h3>
            <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>このURLをコピーして、新しく代理店となる方に送付してください。（システムへの登録は本部からの招待でのみ可能です）</p>
          </div>
          <div style={{display: 'flex', gap: '8px'}}>
            <input type="text" readOnly value={`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/register`} className="link-input" style={{width: '300px', background: 'rgba(0,0,0,0.2)'}} />
            <button className="copy-btn" onClick={() => {
              navigator.clipboard.writeText(`${import.meta.env.VITE_APP_URL || 'http://localhost:5173'}/register`);
              alert("コピーしました");
            }}>URLをコピー</button>
          </div>
        </div>
        
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">今月の総売上</span>
              <DollarSign className="stat-icon" style={{color: 'var(--accent-gold)'}}/>
            </div>
            <div className="stat-value">¥{data?.monthlyRevenue?.toLocaleString()}</div>
            <div className="stat-trend" style={{color:'var(--text-secondary)'}}>今月発生した全売上</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">今月の粗利 (本部利益)</span>
              <Activity className="stat-icon" style={{color: 'var(--accent-green)'}}/>
            </div>
            <div className="stat-value" style={{color: 'var(--accent-gold)'}}>¥{data?.monthlyHqProfit?.toLocaleString()}</div>
            <div className="stat-trend" style={{color:'var(--text-secondary)'}}>総売上 - 仕入・代理店報酬</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">今月の代理店報酬支払額</span>
              <CreditCard className="stat-icon" style={{color: 'var(--accent-blue)'}}/>
            </div>
            <div className="stat-value" style={{color: 'var(--accent-blue)'}}>¥{data?.monthlyPayouts?.toLocaleString()}</div>
            <div className="stat-trend" style={{color:'var(--text-secondary)'}}>今月発生分の報酬合計</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">今月の販売台数</span>
              <Calendar className="stat-icon" style={{color: 'var(--text-secondary)'}}/>
            </div>
            <div className="stat-value">{data?.monthlySalesCount} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>台</span></div>
            <div className="stat-trend" style={{color:'var(--text-secondary)'}}>今月販売された総数</div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <span className="stat-title">登録代理店数</span>
              <Users className="stat-icon" style={{color: 'var(--accent-blue)'}}/>
            </div>
            <div className="stat-value">{data?.totalAgents} <span style={{fontSize: '1rem', color: 'var(--text-muted)'}}>名</span></div>
            <div className="stat-trend" style={{color: 'var(--accent-green)'}}>うち今月新規登録: {data?.newAgentsThisMonth}名</div>
          </div>
        </div>

        {/* Real-time Full Ledger */}
        <div className="glass-panel agent-list-container" style={{marginBottom: '32px', borderColor: 'var(--accent-blue)'}}>
          <div className="table-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h3 className="card-title" style={{marginBottom: 0}}><History size={20} className="icon-blue" /> 全売上実績・リアルタイム一覧</h3>
            <button className="primary-btn" style={{display:'flex', alignItems:'center', gap:'8px', background:'var(--accent-gold)'}} onClick={() => setShowSaleModal(true)}>
               <Plus size={16} /> 本部直売上を登録
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>注文ID</th>
                  <th>契約日</th>
                  <th>販売元・代理店</th>
                  <th>お客様名</th>
                  <th>商品</th>
                  <th>ステータス (変更可)</th>
                  <th>代理店報酬</th>
                  <th>粗利 (本部)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {allSales.map(sale => (
                  <tr key={sale.id} style={{background: sale.note === '本部売上' ? 'rgba(212, 175, 55, 0.05)' : 'none'}}>
                    <td className="mono">{sale.id}</td>
                    <td>{sale.date}</td>
                    <td>
                      {sale.agent_name ? (
                        <>
                          <div style={{fontWeight: 500}}>{sale.agent_name}</div>
                          <div className="mono" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{sale.agent_id}</div>
                        </>
                      ) : (
                        <div style={{fontWeight: 500, color: 'var(--accent-gold)'}}>本部</div>
                      )}
                    </td>
                    <td>{sale.company_name ? <><span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{sale.company_name}</span><br/></> : null}{sale.customer_name}</td>
                    <td>{sale.product_name}<br/><span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>¥{sale.product_price?.toLocaleString()}</span></td>
                    <td>
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <select 
                          value={sale.status}
                          onChange={(e) => updateStatus(sale.id, e.target.value)}
                          className={['すべての処理完了', '入金完了（利益確定）'].includes(sale.status) ? 'badge-green' : sale.status === 'キャンセル' ? 'badge-gray' : 'badge-orange'}
                          style={{border:'none', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem', appearance:'auto'}}
                        >
                          <option value="デモ・商談中">デモ・商談中</option>
                          <option value="発注手配中">発注手配中</option>
                          <option value="納品済・入金待ち">納品済・入金待ち</option>
                          <option value="入金完了（利益確定）">入金完了（利益確定）</option>
                          <option value="すべての処理完了">すべての処理完了</option>
                          <option value="キャンセル">キャンセル</option>
                        </select>
                        {sale.last_status_updater === 'agent' ? (
                          <span title="代理店により更新されました" style={{fontSize:'0.75rem', background:'var(--accent-blue)', color:'#fff', padding:'2px 6px', borderRadius:'12px', opacity:0.7}}>代理店</span>
                        ) : (
                          <span title="本部(あなた)により更新されました" style={{fontSize:'0.75rem', background:'var(--accent-gold)', color:'#000', padding:'2px 6px', borderRadius:'12px', fontWeight:'bold'}}>自社</span>
                        )}
                      </div>
                    </td>
                    <td style={{color: 'var(--accent-blue)'}}>{sale.agent_commission > 0 ? `¥${sale.agent_commission.toLocaleString()}` : '-'}</td>
                    <td style={{color: 'var(--accent-gold)'}}>
                       {/* HQ Profit calculation logic */}
                       {sale.note === '本部直販' 
                         ? `¥${sale.product_price.toLocaleString()} (直販)`
                         : (sale.note.includes('卸売') ? `¥${(sale.product_price * 0.75).toLocaleString()} (仕入額)` : `¥${(sale.product_price - sale.agent_commission).toLocaleString()} (粗利)` )}
                    </td>
                    <td style={{textAlign: 'right'}}>
                       <button onClick={() => setSelectedSaleDetail(sale)} style={{background:'rgba(255,255,255,0.1)', color:'var(--text-primary)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:'16px', fontSize:'0.8rem', cursor:'pointer'}}>
                          詳細・メモ
                       </button>
                    </td>
                  </tr>
                ))}
                {allSales.length === 0 && <tr><td colSpan="9" style={{textAlign:'center', color:'var(--text-muted)'}}>実績データはありません</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel agent-list-container" style={{marginBottom: '32px'}}>
          <div className="table-header">
            <h3 className="card-title"><CreditCard size={20} className="icon-gold" /> 今月の支払管理（振込データ）</h3>
            <button className="primary-btn">全銀CSVデータをダウンロード</button>
          </div>
          
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>支払ID</th>
                  <th>代理店・紹介者</th>
                  <th>振込先口座</th>
                  <th>支払額</th>
                  <th>内訳</th>
                  <th>状態 (変更可)</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.map(pay => (
                  <tr key={pay.reqId}>
                    <td className="mono">{pay.reqId}</td>
                    <td>
                      <div style={{fontWeight: 500}}>{pay.agentName}</div>
                      <div className="mono" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{pay.agentId}</div>
                    </td>
                    <td>{pay.bank || '口座未登録'}</td>
                    <td style={{color: 'var(--accent-gold)'}}><strong>¥{pay.amount.toLocaleString()}</strong></td>
                    <td style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{pay.details}</td>
                    <td>
                      <select 
                        value={pay.status}
                        onChange={(e) => updateStatus(pay.reqId, e.target.value)}
                        style={{background:'var(--bg-secondary)', color:'var(--text-primary)', border:'1px solid var(--border-color)', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem'}}
                      >
                        <option value="デモ・商談中">デモ・商談中</option>
                        <option value="発注手配中">発注手配中</option>
                        <option value="納品済・入金待ち">納品済・入金待ち</option>
                        <option value="入金完了（利益確定）">入金完了（利益確定）</option>
                        <option value="すべての処理完了">すべての処理完了</option>
                        <option value="キャンセル">キャンセル</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {data.payouts.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'var(--text-muted)'}}>支払データはありません</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel agent-list-container" style={{marginBottom: '32px'}}>
          <div className="table-header">
            <h3 className="card-title"><FileText size={20} className="icon-blue" /> パンフレット・資料請求・発送管理</h3>
          </div>
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>請求日時</th>
                  <th>代理店</th>
                  <th>お届け先お名前 / 電話番号</th>
                  <th>送付先ご住所</th>
                  <th>部数</th>
                  <th>状態 (変更可)</th>
                </tr>
              </thead>
              <tbody>
                {pamphlets.map(pam => (
                  <tr key={pam.id}>
                    <td>{new Date(pam.created_at).toLocaleString('ja-JP', {month:'numeric', day:'numeric', hour:'numeric', minute:'numeric'})}</td>
                    <td>{pam.requestor_name}<br/><span className="mono" style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{pam.agent_id}</span></td>
                    <td>{pam.target_name}<br/><span style={{fontSize: '0.85rem'}}>{pam.target_phone}</span></td>
                    <td style={{fontSize: '0.85rem', maxWidth: '200px', wordWrap: 'break-word'}}>{pam.target_address}</td>
                    <td style={{textAlign: 'center'}}>{pam.copies}部</td>
                    <td>
                      <select 
                        value={pam.status}
                        onChange={(e) => updatePamphletStatus(pam.id, e.target.value)}
                        style={{background:'var(--bg-secondary)', color:'var(--text-primary)', border:'1px solid var(--border-color)', padding:'4px 8px', borderRadius:'4px', fontSize:'0.85rem'}}
                      >
                        <option value="未発送">未発送</option>
                        <option value="発送準備中">発送準備中</option>
                        <option value="発送完了">発送完了</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {pamphlets.length === 0 && <tr><td colSpan="6" style={{textAlign:'center', color:'var(--text-muted)'}}>資料請求はありません</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel agent-list-container" style={{marginTop: '0'}}>
          <div className="table-header">
            <h3 className="card-title">代理店一覧・売上実績</h3>
          </div>
          
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>代理店ID</th>
                  <th>氏名</th>
                  <th>種別</th>
                  <th>現在の報酬率</th>
                  <th>累計販売</th>
                  <th>詳細</th>
                </tr>
              </thead>
              <tbody>
                {data.agentList.map(agent => (
                  <tr key={agent.id}>
                    <td className="mono">{agent.id}</td>
                    <td>{agent.name}</td>
                    <td><span className={`type-badge ${agent.type === '卸型' ? 'badge-gold' : 'badge-blue'}`}>{agent.type}</span></td>
                    <td>{agent.tier ? `${agent.tier}%` : '卸売'}</td>
                    <td>{agent.totalSales}台</td>
                    <td>
                      <button onClick={() => setSelectedAgent(agent)} style={{padding: '4px 12px', fontSize: '0.8rem', cursor: 'pointer', background: 'var(--accent-blue)', color: '#fff', border: 'none', borderRadius: '4px'}}>確認</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedAgent && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
            <div className="glass-panel content-card fade-in" style={{width: '500px', border:'1px solid var(--accent-blue)', maxHeight: '90vh', overflowY: 'auto'}}>
               <h3 className="card-title" style={{marginBottom: '20px'}}>代理店 詳細情報</h3>
               
               <div style={{display:'flex', flexDirection:'column', gap:'12px', fontSize: '0.9rem', marginBottom:'24px'}}>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>お名前</span>
                    <strong style={{fontSize: '1rem'}}>{selectedAgent.name}</strong>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>ID</span>
                    <span className="mono">{selectedAgent.id}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px', alignItems:'center'}}>
                    <span style={{color:'var(--text-secondary)'}}>契約種別<br/>報酬率</span>
                    {isEditingAgent ? (
                      <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                        <select 
                          value={editAgentType} 
                          onChange={(e) => setEditAgentType(e.target.value)} 
                          className="link-input"
                          style={{background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'4px 8px'}}
                        >
                          <option value="紹介型" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>紹介型</option>
                          <option value="卸型" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>卸型</option>
                        </select>
                        {editAgentType === '紹介型' && (
                           <select 
                             value={editAgentTier}
                             onChange={(e) => setEditAgentTier(e.target.value)}
                             className="link-input"
                             style={{background:'var(--bg-secondary)', color:'var(--text-primary)', padding:'4px 8px'}}
                           >
                             <option value="10" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>10%</option>
                             <option value="20" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>20%</option>
                             <option value="25" style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>25%</option>
                           </select>
                        )}
                      </div>
                    ) : (
                      <span>{selectedAgent.type} {selectedAgent.tier ? `(現在の報酬率: ${selectedAgent.tier}%)` : ''}</span>
                    )}
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>登録日時</span>
                    <span className="mono">{new Date(selectedAgent.created_at).toLocaleString('ja-JP')}</span>
                  </div>

                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px', marginTop: '8px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                    <span style={{color:'var(--text-secondary)'}}>メールアドレス</span>
                    <span>{selectedAgent.email}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>電話番号</span>
                    <span>{selectedAgent.phone || '未登録'}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>ご住所</span>
                    <span>{selectedAgent.address || '未登録'}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px', marginTop: '8px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                    <span style={{color:'var(--text-secondary)'}}>振込先口座</span>
                    <span>{selectedAgent.bank_info || '未登録'}</span>
                  </div>
                  
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px', marginTop: '8px', paddingTop:'12px', borderTop:'1px solid rgba(255,255,255,0.1)'}}>
                    <span style={{color:'var(--text-secondary)'}}>専用紹介コード</span>
                    <span className="mono">{selectedAgent.referral_code}</span>
                  </div>
                  <div style={{display:'grid', gridTemplateColumns:'120px 1fr', gap:'8px'}}>
                    <span style={{color:'var(--text-secondary)'}}>総販売実績</span>
                    <span>{selectedAgent.totalSales} 台</span>
                  </div>
               </div>
               
               <div style={{display:'flex', justifyContent:'flex-end', gap:'12px'}}>
                  {isEditingAgent ? (
                    <>
                      <button type="button" onClick={() => setIsEditingAgent(false)} className="primary-btn" style={{background:'var(--bg-secondary)', color:'var(--text-primary)'}}>キャンセル</button>
                      <button type="button" onClick={handleSaveAgent} className="primary-btn">保存する</button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => {
                        setEditAgentType(selectedAgent.type);
                        setEditAgentTier(selectedAgent.tier ? selectedAgent.tier.toString() : '10');
                        setIsEditingAgent(true);
                      }} className="primary-btn" style={{background:'var(--accent-blue)'}}>情報を編集する</button>
                      <button type="button" onClick={()=>setSelectedAgent(null)} className="primary-btn" style={{background:'var(--bg-secondary)', color:'var(--text-primary)'}}>閉じる</button>
                    </>
                  )}
               </div>
            </div>
          </div>
        )}

        {/* Modal for reporting HQ sale */}
        {showSaleModal && (
           <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
             <form className="glass-panel content-card" style={{width: '400px', border:'1px solid var(--accent-gold)'}} onSubmit={handleReportHQSale}>
                <h3 className="card-title" style={{marginBottom: '20px'}}>本部直販売上の登録</h3>
                <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px'}}>
                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>内容</label>
                     <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                       <label style={{display:'flex', alignItems:'center', gap:'4px'}}><input type="radio" checked={isDemo===true} onChange={()=>setIsDemo(true)} /> デモ申込・手配</label>
                       <label style={{display:'flex', alignItems:'center', gap:'4px'}}><input type="radio" checked={isDemo===false} onChange={()=>setIsDemo(false)} /> 即時購入（完了）</label>
                     </div>
                   </div>
                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>対象製品</label>
                     <select 
                       className="link-input" 
                       style={{width:'100%', background:'var(--bg-secondary)', color: 'var(--text-primary)'}}
                       value={selectedProduct.name}
                       onChange={e => setSelectedProduct(PRODUCTS.find(p => p.name === e.target.value))}
                     >
                       {PRODUCTS.map(p => (
                         <option key={p.name} value={p.name} style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>{p.name} - ¥{p.price.toLocaleString()}</option>
                       ))}
                     </select>
                   </div>
                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>法人名・屋号 <span style={{fontSize:'0.8rem'}}>(任意)</span></label>
                     <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="（例）株式会社ヤマダ"/>
                   </div>
                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>お客様お名前 <span style={{color:'var(--accent-gold)'}}>*</span></label>
                     <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={newCustomer} onChange={e=>setNewCustomer(e.target.value)} required placeholder="（例）本部 太郎 様"/>
                   </div>
                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>契約日・手配日</label>
                     <input type="date" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={newDate} onChange={e=>setNewDate(e.target.value)} required/>
                   </div>
                </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:'12px'}}>
                   <button type="button" onClick={()=>setShowSaleModal(false)} style={{padding:'8px 16px', color:'var(--text-secondary)'}}>キャンセル</button>
                   <button type="submit" className="primary-btn" style={{background: 'var(--accent-gold)'}}>売上を登録する</button>
                </div>
             </form>
           </div>
        )}

        {selectedSaleDetail && (
          <SaleDetailsModal 
             sale={selectedSaleDetail} 
             onClose={() => setSelectedSaleDetail(null)} 
             token={token} 
             isAdmin={true} 
          />
        )}

        {showGuidelines && <GuidelinesModal onClose={() => setShowGuidelines(false)} />}
      </main>
    </div>
  );
}
