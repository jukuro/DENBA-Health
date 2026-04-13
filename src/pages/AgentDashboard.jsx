import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import GuidelinesModal from '../components/GuidelinesModal';
import SaleDetailsModal from '../components/SaleDetailsModal';
import { Copy, Link as LinkIcon, FileText, Download, Award, TrendingUp, CheckCircle, History, Plus, BookOpen } from 'lucide-react';
import { PRODUCTS } from './Purchase';
import './AgentDashboard.css';

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);
  const [newCustomer, setNewCustomer] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [isStockPurchase, setIsStockPurchase] = useState(false);
  const [purchaseQty, setPurchaseQty] = useState(1);
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [isDemo, setIsDemo] = useState(true);
  
  const [showPamModal, setShowPamModal] = useState(false);
  const [useRegisteredAddress, setUseRegisteredAddress] = useState(true);
  const [targetName, setTargetName] = useState('');
  const [targetPhone, setTargetPhone] = useState('');
  const [targetAddress, setTargetAddress] = useState('');
  const [pamCopies, setPamCopies] = useState('1');
  
  const token = localStorage.getItem('token');

  const fetchData = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/agent/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) navigate('/login');
    else fetchData();
  }, [navigate]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePamphletRequest = async (e) => {
     e.preventDefault();
     try {
       const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/agent/pamphlet`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ useRegisteredAddress, targetName, targetPhone, targetAddress, copies: pamCopies })
       });
       if (res.ok) {
          setShowPamModal(false);
          setTargetAddress('');
          setTargetName('');
          setTargetPhone('');
          setPamCopies('1');
          alert('パンフレットの発送依頼を本部に送信しました。');
       } else {
          alert('エラーが発生しました');
       }
     } catch (err) {
       alert('エラーが発生しました');
     }
  };

  const handleReportSale = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        date: newDate, 
        isDemo, 
        productName: selectedProduct.name, 
        productPrice: selectedProduct.price,
        qty: "1"
      };

      if (isStockPurchase && data?.status === '卸型') {
        payload.customerName = '自社在庫 (後から登録)';
        payload.companyName = '';
        payload.qty = purchaseQty.toString();
      } else {
        payload.customerName = newCustomer;
        payload.companyName = newCompany;
      }

      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/agent/sales`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify(payload)
      });
      if (res.ok) {
         setShowModal(false);
         setNewCustomer('');
         setNewCompany('');
         setIsStockPurchase(false);
         setPurchaseQty(1);
         fetchData(); // reload
      } else {
         const d = await res.json();
         alert(d.error || 'エラーが発生しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  const updateStatus = async (orderId, newStatus) => {
     try {
       await fetch(`http://localhost:3001/api/agent/sales/${orderId}/status`, {
         method: 'PUT',
         headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({ status: newStatus })
       });
       fetchData();
     } catch (err) {
       alert('ステータス更新に失敗しました');
     }
  };

  if (loading || !data) return <div className="page-wrapper fade-in" style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh'}}>データの読み込み中...</div>;

  return (
    <div className="page-wrapper fade-in">
      <Header role="agent" user={data} />
      
      <main className="container dashboard-main">
        <h2 className="dashboard-title">代理店ダッシュボード</h2>
        
        <div className="stats-grid">
          <div className="stat-card glass-panel flex-col">
            <div className="stat-header">
              <Award className="icon-gold" size={24} />
              <span>現在の報酬ランク</span>
            </div>
            <div className="stat-value gradient-text-gold">{data.currentTier ? data.currentTier+"%" : "卸売"}</div>
            <p className="stat-subtext">種別: {data.status}</p>
          </div>

          <div className="stat-card glass-panel flex-col">
            <div className="stat-header">
              <TrendingUp className="icon-blue" size={24} />
              <span>累計販売台数</span>
            </div>
            <div className="stat-value">{data.totalSales} <span style={{fontSize:'1rem'}}>台</span></div>
          </div>
          
          <div className="stat-card glass-panel flex-col">
            <div className="stat-header">
              <CheckCircle className="icon-green" size={24} />
              <span>支払予定報酬額</span>
            </div>
            <div className="stat-value">¥{data.thisMonthCommission.toLocaleString()}</div>
          </div>
        </div>

        <div className="glass-panel content-card" style={{marginBottom: '24px'}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px'}}>
            <h3 className="card-title" style={{marginBottom: 0}}><History size={20} className="icon-blue" /> 売上報告・販売履歴</h3>
            <button className="copy-btn" style={{background: 'var(--accent-blue)', color: '#fff', border: 'none'}} onClick={() => setShowModal(true)}>
               <Plus size={16} /> 新規売上を報告する
            </button>
          </div>
          
          <div className="table-responsive">
            <table className="agent-table">
              <thead>
                <tr>
                  <th>注文ID</th>
                  <th>契約日</th>
                  <th>お客様名</th>
                  <th>商品</th>
                  <th>ステータス</th>
                  <th>{data?.status === '卸型' ? '卸売仕入額 (75%)' : '報酬額 (予定)'}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.salesHistory.map(sale => (
                  <tr key={sale.id}>
                    <td className="mono">{sale.id}</td>
                    <td>{sale.date}</td>
                    <td>{sale.company ? <><span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{sale.company}</span><br/></> : null}{sale.customer}</td>
                    <td>{sale.product}<br/><span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>¥{sale.price?.toLocaleString()}</span></td>
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
                        {sale.updater === 'admin' ? (
                          <span title="本部により更新されました" style={{fontSize:'0.75rem', background:'var(--accent-gold)', color:'#000', padding:'2px 6px', borderRadius:'12px', fontWeight:'bold'}}>HQ更新</span>
                        ) : (
                          <span title="代理店(あなた)により更新されました" style={{fontSize:'0.75rem', background:'var(--accent-blue)', color:'#fff', padding:'2px 6px', borderRadius:'12px', opacity:0.7}}>自店</span>
                        )}
                      </div>
                    </td>
                    <td><strong style={{color: data?.status === '卸型' ? 'var(--accent-gold)' : 'inherit'}}>¥{data?.status === '卸型' ? (sale.price * 0.75).toLocaleString() : sale.commission.toLocaleString()}</strong></td>
                    <td style={{textAlign: 'right'}}>
                       <button onClick={() => setSelectedSaleDetail(sale)} style={{background:'rgba(255,255,255,0.1)', color:'var(--text-primary)', border:'1px solid rgba(255,255,255,0.2)', padding:'4px 12px', borderRadius:'16px', fontSize:'0.8rem', cursor:'pointer'}}>
                          詳細・メモ
                       </button>
                    </td>
                  </tr>
                ))}
                {data.salesHistory.length === 0 && (
                   <tr><td colSpan="7" style={{textAlign:'center', color:'var(--text-muted)'}}>実績がありません</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Pamphlet */}
        {showPamModal && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
            <form className="glass-panel content-card" style={{width: '400px', border:'1px solid var(--accent-gold)'}} onSubmit={handlePamphletRequest}>
               <h3 className="card-title" style={{marginBottom: '20px', color:'var(--accent-gold)'}}>パンフレットの請求</h3>
               <div style={{display:'flex', flexDirection:'column', gap:'16px', marginBottom:'24px'}}>
                  <div>
                    <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>送付先の選択</label>
                    <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                      <label style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <input type="radio" checked={useRegisteredAddress} onChange={() => setUseRegisteredAddress(true)} />
                        代理店ご自身の登録住所へ送付
                      </label>
                      <label style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <input type="radio" checked={!useRegisteredAddress} onChange={() => setUseRegisteredAddress(false)} />
                        別の住所（お客様宛て等）へ直送
                      </label>
                    </div>
                  </div>

                  {!useRegisteredAddress && (
                    <div style={{display:'flex', flexDirection:'column', gap:'16px', padding:'16px', background:'rgba(255,255,255,0.05)', borderRadius:'8px'}}>
                      <div>
                        <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>お届け先お名前</label>
                        <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={targetName} onChange={e=>setTargetName(e.target.value)} required={!useRegisteredAddress} placeholder="山田 太郎"/>
                      </div>
                      <div>
                        <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>お電話番号</label>
                        <input type="tel" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={targetPhone} onChange={e=>setTargetPhone(e.target.value)} required={!useRegisteredAddress} placeholder="090-1234-5678"/>
                      </div>
                      <div>
                        <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>送付先のご住所</label>
                        <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={targetAddress} onChange={e=>setTargetAddress(e.target.value)} required={!useRegisteredAddress} placeholder="〒100-0000 東京都..."/>
                      </div>
                    </div>
                  )}

                  <div>
                    <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>必要部数</label>
                    <select className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)', color: 'var(--text-primary)'}} value={pamCopies} onChange={e=>setPamCopies(e.target.value)}>
                      <option value="1">1部</option>
                      <option value="3">3部</option>
                      <option value="5">5部</option>
                      <option value="10">10部</option>
                    </select>
                  </div>
               </div>
               <div style={{display:'flex', justifyContent:'flex-end', gap:'12px'}}>
                  <button type="button" onClick={()=>setShowPamModal(false)} style={{padding:'8px 16px', color:'var(--text-secondary)'}}>キャンセル</button>
                  <button type="submit" className="primary-btn">本部へ送付を依頼する</button>
               </div>
            </form>
          </div>
        )}

        {/* Modal for reporting sale */}
        {showModal && (
          <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
             <div className="glass-panel content-card fade-in" style={{width: '450px'}}>
               <h3 className="card-title" style={{marginBottom: '20px'}}>{data?.status === '卸型' ? '商品の仕入れ・手配' : '新規売上の報告 / デモ手配'}</h3>
               <form onSubmit={handleReportSale} style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                   
                   {data?.status !== '卸型' && (
                     <div>
                       <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>ご依頼内容</label>
                       <div style={{display:'flex', gap:'16px', alignItems:'center'}}>
                         <label style={{display:'flex', alignItems:'center', gap:'4px'}}><input type="radio" checked={isDemo===true} onChange={()=>setIsDemo(true)} /> デモ申込・手配</label>
                         <label style={{display:'flex', alignItems:'center', gap:'4px'}}><input type="radio" checked={isDemo===false} onChange={()=>setIsDemo(false)} /> 即時購入（発注）</label>
                       </div>
                     </div>
                   )}

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
                   
                   {data?.status === '卸型' && (
                     <div style={{background:'rgba(212, 175, 55, 0.1)', border:'1px solid var(--accent-gold)', borderRadius:'8px', padding:'12px', marginTop:'8px'}}>
                       <label style={{display:'block', fontSize:'0.85rem', color:'var(--accent-gold)', marginBottom:'12px'}}>仕入れ・販売の方法をお選びください</label>
                       <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                         <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:'var(--text-primary)'}}>
                           <input type="radio" checked={!isStockPurchase} onChange={() => setIsStockPurchase(false)} />
                           エンドユーザーへ直接販売・直送を手配する（お客様名あり）
                         </label>
                         <label style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', color:'var(--text-primary)'}}>
                           <input type="radio" checked={isStockPurchase} onChange={() => setIsStockPurchase(true)} />
                           自社の在庫用としてまとめて仕入れる（お客様名なし）
                         </label>
                       </div>
                     </div>
                   )}

                   {!isStockPurchase && (
                     <>
                       <div>
                         <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>法人名・屋号 <span style={{fontSize:'0.8rem'}}>(任意)</span></label>
                         <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={newCompany} onChange={e=>setNewCompany(e.target.value)} placeholder="（例）株式会社ヤマダ"/>
                       </div>
                       <div>
                         <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>お客様お名前 <span style={{color:'var(--accent-gold)'}}>*</span></label>
                         <input type="text" className="link-input" style={{width:'100%', background:'rgba(255,255,255,0.1)'}} value={newCustomer} onChange={e=>setNewCustomer(e.target.value)} required placeholder="（例）山田 太郎 様"/>
                       </div>
                     </>
                   )}

                   {isStockPurchase && (
                     <div>
                       <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>仕入れ点数（台数）</label>
                       <select 
                         className="link-input" 
                         style={{width:'100%', background:'var(--bg-secondary)', color: 'var(--text-primary)'}}
                         value={purchaseQty}
                         onChange={e => setPurchaseQty(parseInt(e.target.value, 10))}
                       >
                         {[1,2,3,4,5,10].map(q => (
                           <option key={q} value={q} style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>{q} 点</option>
                         ))}
                       </select>
                       <p style={{fontSize:'0.8rem', color:'var(--text-secondary)', margin:'8px 0 0', lineHeight:'1.4'}}>※報告後、一覧から1台ずつお客様名を登録できるようになります。</p>
                     </div>
                   )}

                   <div>
                     <label style={{display:'block', fontSize:'0.85rem', color:'var(--text-secondary)', marginBottom:'8px'}}>販売日（契約日）</label>
                     <input type="date" className="link-input" style={{width:'100%', colorScheme: 'dark', background:'rgba(255,255,255,0.1)'}} value={newDate} onChange={e=>setNewDate(e.target.value)} required />
                   </div>
                <div style={{display:'flex', justifyContent:'flex-end', gap:'12px'}}>
                   <button type="button" onClick={()=>setShowModal(false)} style={{padding:'8px 16px', color:'var(--text-secondary)', background:'transparent', border:'none', cursor:'pointer'}}>キャンセル</button>
                   <button type="submit" className="primary-btn">送信する</button>
                </div>
              </form>
             </div>
          </div>
        )}

        <div className="content-grid">
          <div className="glass-panel content-card">
            <h3 className="card-title"><FileText size={20} className="icon-gold" /> 販売サポート＆資料</h3>
            
            <div style={{marginBottom: '20px'}}>
              <h4 style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '8px'}}>業務フローと報酬ルールの確認</h4>
              <div style={{background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', textAlign: 'center'}}>
                 <button 
                    className="primary-btn" 
                    style={{width: '100%', display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', background:'var(--accent-blue)'}}
                    onClick={() => setShowGuidelines(true)}
                 >
                    <BookOpen size={18} /> 代理店規定・標準業務フローを見る
                 </button>
                 <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '12px', lineHeight: '1.4'}}>
                   ※販売・納品の流れ、紹介型・卸型の報酬設定、および昇格条件の詳細はこちらをご確認ください。
                 </p>
              </div>
            </div>

            <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
              <button className="primary-btn" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'8px', background:'var(--border-color)', color:'var(--text-primary)'}} onClick={() => alert('販売マニュアル (PDF) がダウンロードされる想定です\n※デモ環境のためダミーです')}>
                <Download size={16} /> 販売マニュアル（閲覧・ダウンロード）
              </button>
              <button className="primary-btn" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:'8px'}} onClick={() => setShowPamModal(true)}>
                <FileText size={16} /> 紙のパンフレットを請求する（フォーム）
              </button>
            </div>
          </div>

          <div className="glass-panel content-card">
            <h3 className="card-title"><LinkIcon size={20} className="icon-blue" /> あなた専用の商品購入リンク</h3>
            <p className="card-desc" style={{fontSize: '0.9rem'}}>このリンクをお客様にお送りください。リンク先のフォームからお客様が製品の購入やデモを申し込まれると、自動的にあなたの実績として計上されます。</p>
            
            <div className="link-box">
              <input type="text" readOnly value={data.referralLink} className="link-input" />
              <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopy}>
                <Copy size={18} />
                {copied ? 'コピーしました' : 'コピー'}
              </button>
            </div>
          </div>
        </div>

        {selectedSaleDetail && (
          <SaleDetailsModal 
             sale={selectedSaleDetail} 
             onClose={() => setSelectedSaleDetail(null)} 
             token={token} 
             isAdmin={false} 
          />
        )}

        {showGuidelines && <GuidelinesModal onClose={() => setShowGuidelines(false)} />}
      </main>
    </div>
  );
}
