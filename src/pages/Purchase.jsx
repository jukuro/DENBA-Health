import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Activity } from 'lucide-react';
import './Purchase.css';

export const PRODUCTS = [
  { name: 'チャージ', price: 396000, description: '基本モデル' },
  { name: 'DENBA Health スタンダード', price: 550000, description: '標準モデル' },
  { name: 'DENBA Health ハイグレード', price: 900000, description: '最上位モデル' },
  { name: 'DENBA ビーノ', price: 50000, description: '小物' },
  { name: 'DENBAリュック', price: 33000, description: '小物' }
];

export default function Purchase() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get('ref');

  const [customerName, setCustomerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If no ref code is present, it's an invalid link.
    // We could show an error, but let's just let it load and handle visually.
  }, [refCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/public/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          agentId: refCode,
          customerName,
          companyName,
          phone,
          productName: selectedProduct.name,
          productPrice: selectedProduct.price,
          isDemo
        })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const errorData = await res.json();
        alert('エラーが発生しました: ' + (errorData.error || '不明なエラー'));
      }
    } catch (err) {
      alert('ネットワークエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  if (!refCode) {
    return (
      <div className="page-wrapper fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px', textAlign: 'center' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%' }}>
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>無効なリンクです</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            このページには有効な紹介コードが必要です。<br/>
            代理店から送られた正しいURLからアクセスしてください。
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
       <div className="page-wrapper fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', padding: '20px' }}>
        <div className="glass-panel" style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent-gold)', marginBottom: '16px' }}>お申し込み完了</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.6' }}>
            {customerName} 様<br/><br/>
            {isDemo ? '製品デモのお申し込み' : '製品のご購入お申し込み'}を承りました。<br/>
            担当代理店、または本部より改めてご連絡させていただきます。
          </p>
          <button className="primary-btn" onClick={() => window.close()}>画面を閉じる</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper fade-in">
      <header style={{ padding: '20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center' }}>
        <h1 className="gradient-text-gold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>DENBA Health 公式お申し込み</h1>
      </header>

      <main className="container" style={{ paddingTop: '40px', paddingBottom: '40px', maxWidth: '600px' }}>
        <div className="glass-panel" style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity className="icon-blue"/> 空間を革新するコンディショニングマット
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            DENBA Healthは、空間全体に電子微細振動を発生させ、鮮度保持技術を応用して人間の「コンディショニング」をサポートします。
          </p>
          <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(212, 175, 55, 0.1)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>対象製品の選択</span>
              <select 
                className="link-input option-dark-bg" 
                style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)', padding: '10px'}}
                value={selectedProduct.name}
                onChange={e => setSelectedProduct(PRODUCTS.find(p => p.name === e.target.value))}
              >
                {PRODUCTS.map(p => (
                  <option key={p.name} value={p.name} style={{background: 'var(--bg-secondary)', color: 'var(--text-primary)'}}>{p.name} - ¥{p.price.toLocaleString()}</option>
                ))}
              </select>
            </div>
            {selectedProduct.name.includes('Health') || selectedProduct.name === 'チャージ' ? (
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px'}}>
                ※DENBA Health（チャージ/スタンダード/ハイグレード）同梱物：マット中サイズ(60×120cm）、検電器1本、白ケーブル(5ｍ）
              </div>
            ) : null}
          </div>
        </div>

        <form className="glass-panel purchase-form" onSubmit={handleSubmit}>
          <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-color-light)', paddingBottom: '12px' }}>
            お申し込みフォーム
          </h3>

          <div className="form-group">
            <label>お申し込み内容</label>
            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="orderType" checked={!isDemo} onChange={() => setIsDemo(false)} />
                <ShoppingCart size={18} className="icon-gold"/> 商品を購入する
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="orderType" checked={isDemo} onChange={() => setIsDemo(true)} />
                <Heart size={18} className="icon-blue"/> 製品デモ（お試し）を申し込む
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>法人名・屋号 <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>(任意)</span></label>
            <input 
              type="text" 
              value={companyName} 
              onChange={e => setCompanyName(e.target.value)} 
              placeholder="例：株式会社ヤマダ"
            />
          </div>

          <div className="form-group">
            <label>お客様ご担当者名 <span style={{color:'var(--accent-gold)'}}>*</span></label>
            <input 
              type="text" 
              required 
              value={customerName} 
              onChange={e => setCustomerName(e.target.value)} 
              placeholder="例：山田 太郎"
            />
          </div>

          <div className="form-group">
            <label>お電話番号</label>
            <input 
              type="tel" 
              required 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="090-1234-5678"
            />
          </div>

          <div className="form-group" style={{ opacity: 0.5 }}>
            <label>担当代理店ID</label>
            <input type="text" value={refCode} readOnly style={{ background: 'rgba(0,0,0,0.2)' }} />
          </div>

          <button 
            type="submit" 
            className="primary-btn submit-btn" 
            disabled={loading}
          >
            {loading ? '送信中...' : '上記の内容で申し込む'}
          </button>
        </form>
      </main>
    </div>
  );
}
