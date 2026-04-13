import React, { useState } from 'react';
import { X, BookOpen, DollarSign, Activity, Settings, Info } from 'lucide-react';
import './GuidelinesModal.css';

export default function GuidelinesModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('flow');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-panel guidelines-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><BookOpen size={20} className="icon-blue" /> 代理店規定・標準業務フロー</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className="modal-content">
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === 'flow' ? 'active' : ''}`}
              onClick={() => setActiveTab('flow')}
            >
              業務フロー（全体）
            </button>
            <button 
              className={`tab-btn ${activeTab === 'reward' ? 'active' : ''}`}
              onClick={() => setActiveTab('reward')}
            >
              紹介型の報酬規定
            </button>
            <button 
              className={`tab-btn ${activeTab === 'wholesale' ? 'active' : ''}`}
              onClick={() => setActiveTab('wholesale')}
            >
              卸売型の仕入れ規定
            </button>
          </div>

          {activeTab === 'flow' && (
            <div className="guideline-section fade-in">
              <h4><Activity size={18} /> お申し込みから報酬支払いまでの流れ</h4>
              
              <div className="info-box" style={{marginBottom: '20px'}}>
                <strong>DENBA Health 製品価格:</strong> 396,000円（税込）
              </div>

              <div className="flow-container">
                <div className="flow-step">
                  <div className="flow-number">1</div>
                  <div className="flow-step-content">
                    <h5>お客様へのご案内・ヒアリング</h5>
                    <p>パンフレットやデモ機を活用し、お客様へ製品をご案内します。必要に応じてダッシュボードからパンフレットの発送依頼やデモ機の手配を本部へ申請可能です。</p>
                  </div>
                </div>
                
                <div className="flow-arrow">↓</div>
                
                <div className="flow-step">
                  <div className="flow-number">2</div>
                  <div className="flow-step-content">
                    <h5>購入お申し込み（売上報告）</h5>
                    <p>お客様の購入意思が確認できたら、代理店ダッシュボードの「新規売上を報告する」から、お客様名と契約日を登録してください。</p>
                  </div>
                </div>

                <div className="flow-arrow">↓</div>

                <div className="flow-step">
                  <div className="flow-number">3</div>
                  <div className="flow-step-content">
                    <h5>本部によるメーカー発注・納品</h5>
                    <p>本部にてメーカーへの製品発注を行います。製品はお客様宅へ直送、または代理店様経由で納品されます。ダッシュボード上でのステータスが更新されます。</p>
                  </div>
                </div>

                <div className="flow-arrow">↓</div>

                <div className="flow-step">
                  <div className="flow-number">4</div>
                  <div className="flow-step-content">
                    <h5>お客様からのお支払い完了</h5>
                    <p>お客様から本部（指定口座）へのお支払いが完了した時点で、当月の代理店成果として確定いたします。</p>
                  </div>
                </div>

                <div className="flow-arrow">↓</div>

                <div className="flow-step">
                  <div className="flow-number">5</div>
                  <div className="flow-step-content">
                    <h5>報酬のお振り込み</h5>
                    <p>ステータスが「すべての処理完了」となった売上について、規定の計算ロジック（紹介型/卸型）に基づき、代理店様の登録口座へ報酬をお支払いします。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reward' && (
            <div className="guideline-section fade-in">
              <h4><DollarSign size={18} /> 紹介型代理店の報酬規定と昇格条件</h4>
              
              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>
                紹介型の代理店様は、販売実績（累計）や本部の審査に応じて報酬率（10%、20%、25%）の引き上げが行われます。
                販売した商品の「定価 × ご自身の報酬率」が報酬額となります。（※小物類・リュックは報酬対象外となります）
                初期ステータスは全員「10%」からスタートとなります。
              </p>

              <div className="glass-panel" style={{overflow: 'hidden', padding: 0}}>
                <table className="reward-table">
                  <thead>
                    <tr>
                      <th>報酬率（Tier）</th>
                      <th>1台あたりの報酬額</th>
                      <th>適用の目安条件</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong>10%</strong> <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>(初期)</span></td>
                      <td>商品の定価の10% <br/><span style={{fontSize:'0.8rem'}}>(例: チャージなら39,600円)</span></td>
                      <td>新規登録時 〜 1台目の販売</td>
                    </tr>
                    <tr>
                      <td><strong style={{color: 'var(--accent-blue)'}}>20%</strong></td>
                      <td>商品の定価の20% <br/><span style={{fontSize:'0.8rem'}}>(例: チャージなら79,200円)</span></td>
                      <td>累計2台目以降の販売実績</td>
                    </tr>
                    <tr>
                      <td><strong style={{color: 'var(--accent-gold)'}}>25%</strong> <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>(VIP)</span></td>
                      <td>商品の定価の25% <br/><span style={{fontSize:'0.8rem'}}>(例: チャージなら99,000円)</span></td>
                      <td>累計3台目以降、または特約等による本部承認</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="info-box gold">
                <strong><Settings size={14} style={{display:'inline', marginBottom:'-2px'}}/> 報酬率の引き上げ（手動反映）について</strong><br/>
                システムの都合上、販売実績に基づく自動昇格は行っておりません。代理店様の活動実績を確認のうえ、本部管理者がマニュアル（手動）にて「報酬率の引き上げ調整」を個別に行う運用となっております。
              </div>
            </div>
          )}

          {activeTab === 'wholesale' && (
            <div className="guideline-section fade-in">
              <h4 className="gold"><Activity size={18} /> 卸型代理店に関する規定（買取・差益モデル）</h4>
              
              <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px'}}>
                卸型代理店様は、紹介型とは異なり**「全額前払いで商品を仕入れ、独自の価格（定価）でお客様に販売する」**モデルとなります。
                報酬のパーセンテージではなく、仕入れ値と販売価格の差額（差益）が利益となります。
              </p>

              <div className="flow-container" style={{marginBottom: '24px'}}>
                <div className="flow-step" style={{borderColor: 'rgba(212, 175, 55, 0.2)'}}>
                  <div className="flow-number" style={{background: 'var(--accent-gold)'}}><Info size={16} /></div>
                  <div className="flow-step-content">
                    <h5>卸型代理店の利益構造</h5>
                    <ul style={{marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '20px'}}>
                      <li>各商品の卸仕入価格は、<strong style={{color: 'var(--accent-gold)'}}>「定価の約75%」</strong>にて設定されております。</li>
                      <li>定価と卸仕入価格の差額となる<strong style={{color: 'var(--accent-gold)'}}>「約25%」</strong>が代理店様の利益となります。</li>
                      <li style={{marginTop: '8px', color: 'var(--text-muted)'}}>※詳細な商品ごとの仕切値については、別途本部より配布される価格表をご確認ください。</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="info-box">
                <strong>業務フローの主な違い</strong><br/>
                本部からのお振込を待つ「紹介型」と異なり、お客様から直接代金を受け取っていただきます。その後、卸価格（300,000円）を本部へお振込みいただくことで、直ちにメーカーへ発注を行い商品を納品いたします。「仕入れ」の性質上、事前の審査と承認が必要となります。
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
