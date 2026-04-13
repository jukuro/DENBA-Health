import React, { useState, useEffect } from 'react';
import { X, Clock, MessageSquare, Save, Send } from 'lucide-react';

export default function SaleDetailsModal({ sale, onClose, token, isAdmin }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMemo, setNewMemo] = useState('');
  
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState(sale.customer_name || sale.customer || '');
  const [editCompanyName, setEditCompanyName] = useState(sale.company_name || sale.company || '');

  const fetchHistory = async () => {
    try {
      const endpoint = isAdmin 
        ? `http://localhost:3001/api/admin/sales/${sale.id}/history`
        : `http://localhost:3001/api/agent/sales/${sale.id}/history`;
        
      const res = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [sale.id]);

  const handleAddMemo = async (e) => {
    e.preventDefault();
    if (!newMemo.trim()) return;
    
    try {
      const endpoint = isAdmin 
        ? `http://localhost:3001/api/admin/sales/${sale.id}/memo`
        : `http://localhost:3001/api/agent/sales/${sale.id}/memo`;
        
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ memo: newMemo })
      });
      
      if (res.ok) {
        setNewMemo('');
        fetchHistory(); // refresh timeline
      } else {
        alert('メモの追加に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  const handleUpdateCustomer = async () => {
    try {
      const endpoint = isAdmin 
        ? `http://localhost:3001/api/admin/sales/${sale.id}/customer`
        : `http://localhost:3001/api/agent/sales/${sale.id}/customer`;
        
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ customerName: editCustomerName, companyName: editCompanyName })
      });
      
      if (res.ok) {
        setIsEditingCustomer(false);
        fetchHistory();
        sale.customer_name = editCustomerName;
        sale.company_name = editCompanyName;
      } else {
        alert('更新に失敗しました');
      }
    } catch (err) {
      alert('エラーが発生しました');
    }
  };

  return (
    <div style={{position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.85)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:100}}>
      <div className="glass-panel content-card fade-in" style={{width: '600px', maxWidth: '95vw', height: '80vh', display: 'flex', flexDirection: 'column', border:'1px solid var(--accent-blue)', padding:0, overflow:'hidden'}}>
        
        {/* Header */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)'}}>
           <h3 className="card-title" style={{marginBottom: 0}}>取引詳細: <span className="mono" style={{color:'var(--text-secondary)'}}>{sale.id}</span></h3>
           <button onClick={onClose} style={{background:'transparent', border:'none', color:'var(--text-secondary)', cursor:'pointer'}}><X size={24} /></button>
        </div>

        <div style={{display:'flex', flex:1, overflow:'hidden'}}>
          {/* Left panel: Info */}
          <div style={{flex:'0 0 40%', borderRight:'1px solid rgba(255,255,255,0.1)', padding:'24px', overflowY:'auto', background:'rgba(0,0,0,0.1)'}}>
            <h4 style={{fontSize:'0.9rem', color:'var(--text-secondary)', marginBottom:'16px'}}>基本情報</h4>
            
            <div style={{marginBottom:'16px'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>お客様名</span>
                {!isEditingCustomer && (
                  <button onClick={() => setIsEditingCustomer(true)} style={{background:'transparent', border:'1px solid var(--accent-blue)', color:'var(--accent-blue)', borderRadius:'4px', padding:'2px 8px', fontSize:'0.75rem', cursor:'pointer'}}>編集</button>
                )}
              </div>
              
              {isEditingCustomer ? (
                <div style={{marginTop:'8px', display:'flex', flexDirection:'column', gap:'8px'}}>
                  <input type="text" value={editCompanyName} onChange={e => setEditCompanyName(e.target.value)} placeholder="法人名 (任意)" className="link-input" style={{width:'100%', fontSize:'0.85rem', padding:'6px', background:'rgba(255,255,255,0.05)'}}/>
                  <input type="text" value={editCustomerName} onChange={e => setEditCustomerName(e.target.value)} placeholder="お客様名 (必須)" className="link-input" style={{width:'100%', fontSize:'0.85rem', padding:'6px', background:'rgba(255,255,255,0.05)'}} required/>
                  <div style={{display:'flex', gap:'8px', marginTop:'4px'}}>
                    <button onClick={handleUpdateCustomer} className="primary-btn" style={{padding:'4px 12px', fontSize:'0.8rem'}}>保存</button>
                    <button onClick={() => setIsEditingCustomer(false)} style={{background:'transparent', color:'var(--text-secondary)', border:'1px solid var(--text-secondary)', borderRadius:'4px', padding:'4px 12px', fontSize:'0.8rem', cursor:'pointer'}}>キャンセル</button>
                  </div>
                </div>
              ) : (
                <div style={{fontWeight:'500', marginTop:'4px'}}>{sale.company_name || sale.company ? <span style={{fontSize:'0.85rem', color:'var(--text-secondary)'}}>{sale.company_name || sale.company}<br/></span> : null}{sale.customer_name || sale.customer}</div>
              )}
            </div>
            
            <div style={{marginBottom:'16px'}}>
              <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>商品</span>
              <div>{sale.product_name || sale.product}</div>
              <div className="mono" style={{fontSize:'0.9rem', color:'var(--text-secondary)'}}>¥{(sale.product_price || sale.price)?.toLocaleString()}</div>
            </div>

            <div style={{marginBottom:'16px'}}>
              <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>現在のステータス</span>
              <div>
                <span className={`type-badge ${['すべての処理完了', '入金完了（利益確定）'].includes(sale.status) ? 'badge-green' : sale.status === 'キャンセル' ? 'badge-gray' : 'badge-orange'}`} style={{display:'inline-block', marginTop:'4px'}}>
                  {sale.status}
                </span>
              </div>
            </div>
            
            <div style={{marginBottom:'16px'}}>
               <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>{isAdmin ? '代理店' : '担当代理店'}</span>
               <div>{sale.agent_name || (isAdmin ? sale.agent_id : '自店')}</div>
            </div>
          </div>

          {/* Right panel: Timeline & Chat */}
          <div style={{flex:1, display:'flex', flexDirection:'column', background:'rgba(0,0,0,0.3)'}}>
            <div style={{padding:'16px 24px', borderBottom:'1px solid rgba(255,255,255,0.05)', background:'rgba(0,0,0,0.2)'}}>
              <h4 style={{fontSize:'0.9rem', color:'var(--text-secondary)', margin:0}}><Clock size={16} style={{display:'inline', marginBottom:'-3px', marginRight:'4px'}}/> 履歴・メモ</h4>
            </div>

            <div style={{flex:1, padding:'24px', overflowY:'auto'}}>
              {loading ? (
                 <div style={{textAlign:'center', color:'var(--text-muted)'}}>読み込み中...</div>
              ) : (
                <div style={{display:'flex', flexDirection:'column', gap:'16px'}}>
                  {history.map(evt => {
                     const isStatus = evt.event_type === 'status';
                     const isHQ = evt.updated_by === 'admin';
                     const dateStr = new Date(evt.created_at).toLocaleString('ja-JP', { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' });
                     
                     return (
                       <div key={evt.id} style={{display:'flex', flexDirection:'column', alignItems: isHQ ? 'flex-end' : 'flex-start'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                             {isHQ ? (
                               <>
                                 <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{dateStr}</span>
                                 <span style={{fontSize:'0.75rem', background:'var(--accent-gold)', color:'#000', padding:'2px 8px', borderRadius:'12px', fontWeight:'bold'}}>本部</span>
                               </>
                             ) : (
                               <>
                                 <span style={{fontSize:'0.75rem', background:'var(--accent-blue)', color:'#fff', padding:'2px 8px', borderRadius:'12px'}}>代理店</span>
                                 <span style={{fontSize:'0.75rem', color:'var(--text-muted)'}}>{dateStr}</span>
                               </>
                             )}
                          </div>
                          
                          {isStatus ? (
                            <div style={{background: 'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', padding:'8px 12px', borderRadius:'8px', fontSize:'0.9rem'}}>
                              ステータスを更新: <strong style={{color: isHQ ? 'var(--accent-gold)' : 'var(--accent-blue)'}}>{evt.event_content}</strong>
                            </div>
                          ) : (
                            <div style={{background: isHQ ? 'rgba(212, 175, 55, 0.15)' : 'rgba(56, 189, 248, 0.15)', border:`1px solid ${isHQ ? 'var(--accent-gold)' : 'var(--accent-blue)'}`, padding:'10px 14px', borderRadius:'12px', borderTopRightRadius: isHQ ? '2px' : '12px', borderTopLeftRadius: isHQ ? '12px' : '2px', fontSize:'0.9rem', maxWidth:'85%', wordBreak:'break-word'}}>
                              {evt.event_content}
                            </div>
                          )}
                       </div>
                     );
                  })}
                  {history.length === 0 && <div style={{textAlign:'center', color:'var(--text-muted)'}}>履歴がありません</div>}
                </div>
              )}
            </div>

            {/* Input area */}
            <form onSubmit={handleAddMemo} style={{padding:'16px', borderTop:'1px solid rgba(255,255,255,0.1)', background:'rgba(0,0,0,0.2)', display:'flex', gap:'8px'}}>
               <input 
                 type="text" 
                 value={newMemo}
                 onChange={e => setNewMemo(e.target.value)}
                 placeholder="メモを入力して共有..." 
                 style={{flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.2)', borderRadius:'24px', padding:'10px 16px', color:'var(--text-primary)', outline:'none'}}
               />
               <button type="submit" disabled={!newMemo.trim()} style={{background: isAdmin ? 'var(--accent-gold)' : 'var(--accent-blue)', color: isAdmin ? '#000' : '#fff', border:'none', borderRadius:'50%', width:'42px', height:'42px', display:'flex', justifyContent:'center', alignItems:'center', cursor: newMemo.trim() ? 'pointer' : 'not-allowed', opacity: newMemo.trim() ? 1 : 0.5}}>
                 <Send size={18} style={isAdmin ? {} : {marginLeft:'-2px'} }/>
               </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
