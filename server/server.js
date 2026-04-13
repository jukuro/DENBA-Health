const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db, initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'denba-secret-key-for-demo';

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

// API: Register Agent
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, bankInfo, referredBy, phone, address } = req.body;
  if (!name || !email || !password || !phone || !address) {
     return res.status(400).json({ error: '必須項目が不足しています' });
  }

  // Generate unique AGT ID
  const newId = 'AGT-' + Math.floor(Math.random() * 90000 + 10000);
  const refCode = 'REF-' + newId;
  const hash = await bcrypt.hash(password, 10);
  
  db.get('SELECT id FROM users WHERE email = ?', [email], (err, row) => {
    if (row) return res.status(400).json({ error: 'このメールアドレスは既に登録されています' });
    
    // Default tier is 10 for 紹介型
    db.run(
      `INSERT INTO users (id, email, password, name, phone, address, role, type, tier, referral_code, referred_by, bank_info) 
       VALUES (?, ?, ?, ?, ?, ?, 'agent', '紹介型', 10, ?, ?, ?)`,
      [newId, email, hash, name, phone, address, refCode, referredBy || null, bankInfo || ''],
      function(err) {
        if (err) return res.status(500).json({ error: '登録に失敗しました' });
        
        // Auto login
        const token = jwt.sign({ id: newId, role: 'agent', type: '紹介型' }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, role: 'agent', user: { id: newId, name, email } });
      }
    );
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err || !user) return res.status(401).json({ error: 'Invalid ID/Password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid ID/Password' });
    const token = jwt.sign({ id: user.id, role: user.role, type: user.type }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, role: user.role, user: { id: user.id, name: user.name, email: user.email } });
  });
});

const calculateCommission = (productName, productPrice, type, tier) => {
  if (productName === 'DENBAリュック' || productPrice < 50000) return { commission: 0, note: '小物販売 (対象外)' };
  
  if (type === '紹介型') {
    return { commission: Math.floor(productPrice * (tier || 10) / 100), note: `紹介報酬 (${tier || 10}%)` };
  } else if (type === '卸型') {
    return { commission: Math.floor(productPrice * 0.25), note: '卸売差益 (~25%)' };
  }
  return { commission: 0, note: '本部売上' }; // admin or generic
};

const getAgentDashboardStats = (agentId) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE id = ?', [agentId], (err, user) => {
      if (err || !user) return reject(err);
      
      db.all('SELECT * FROM sales WHERE agent_id = ? ORDER BY date DESC', [agentId], (err, sales) => {
        if (err) return reject(err);
        
        let totalSales = sales.length;
        let thisMonthSales = sales.length; 
        let thisMonthCommission = sales.reduce((sum, s) => sum + s.agent_commission, 0);

        resolve({
          id: user.id, name: user.name, status: user.type, totalSales, currentTier: user.tier,
          thisMonthSales, thisMonthCommission,
          address: user.address, phone: user.phone,
          referralLink: "http://localhost:5173/buy?ref=" + user.id,
          salesHistory: sales.map(s => ({
              id: s.id, date: s.date, customer: s.customer_name, company: s.company_name, status: s.status,
              product: s.product_name, price: s.product_price,
              updater: s.last_status_updater,
              commission: s.agent_commission, note: s.note
          }))
        });
      });
    });
  });
};

app.get('/api/agent/dashboard', authenticate, async (req, res) => {
  if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
  try {
    const data = await getAgentDashboardStats(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create Pamphlet Request
app.post('/api/agent/pamphlet', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const { useRegisteredAddress, targetName, targetPhone, targetAddress, copies } = req.body;
   const agentId = req.user.id;

   db.get('SELECT name, phone, address FROM users WHERE id = ?', [agentId], (err, user) => {
       if (err || !user) return res.status(500).json({ error: 'User not found' });
       
       let finalName = useRegisteredAddress ? user.name : targetName;
       let finalPhone = useRegisteredAddress ? user.phone : targetPhone;
       let finalAddress = useRegisteredAddress ? user.address : targetAddress;

       db.run(`INSERT INTO pamphlet_requests (agent_id, target_name, target_phone, target_address, copies, status) VALUES (?, ?, ?, ?, ?, ?)`,
         [agentId, finalName, finalPhone, finalAddress, copies, '未発送'], function(err) {
           if (err) return res.status(500).json({ error: 'Failed to request' });
           res.json({ success: true });
       });
   });
});

// Update Report Sale to handle isDemo status
app.post('/api/agent/sales', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const { customerName, companyName, date, productName, productPrice, qty } = req.body;
   
   db.get('SELECT * FROM users WHERE id = ?', [req.user.id], (err, agent) => {
     if (err || !agent) return res.status(404).json({error: 'Agent not found'});
     
     let commission = 0;
     let note = '通常販売';
     if (agent.type === '紹介型') {
       commission = Math.floor(productPrice * ((agent.tier || 10) / 100));
       note = `紹介販売 (${agent.tier || 10}%)`;
     } else if (agent.type === '卸型') {
       note = '卸売 (報酬なし)';
     }

     const initialStatus = '発注手配中';
     const quantity = qty ? parseInt(qty, 10) : 1;

     const insertSale = (i) => {
       if (i >= quantity) {
         return res.json({ success: true, message: '売上（仕入）を報告しました。' });
       }
       const orderId = `REQ-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;
       db.run(`INSERT INTO sales (id, agent_id, date, customer_name, company_name, product_name, product_price, status, note, agent_commission, referrer_id, referrer_commission, last_status_updater) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
         [orderId, req.user.id, date, customerName, companyName || null, productName, productPrice, initialStatus, note, commission, null, 0, 'agent'], function(err) {
           if (!err) {
             db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, 'agent')`, [orderId, initialStatus]);
           }
           insertSale(i + 1);
       });
     };

     insertSale(0);
   });
});

// Agent Status Update (Sales)
app.put('/api/agent/sales/:id/status', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id;
   const { status } = req.body;
   db.run('UPDATE sales SET status = ?, last_status_updater = ? WHERE id = ? AND agent_id = ?', [status, 'agent', orderId, req.user.id], function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      if (this.changes === 0) return res.status(404).json({ error: 'Not found or permission denied' });
      
      db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, 'agent')`, [orderId, status]);

      res.json({ success: true });
   });
});

// Agent Add Memo
app.post('/api/agent/sales/:id/memo', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id;
   const { memo } = req.body;
   
   db.get('SELECT id FROM sales WHERE id = ? AND agent_id = ?', [orderId, req.user.id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Not found' });
      
      db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'memo', ?, 'agent')`, [orderId, memo], function(err) {
         if (err) return res.status(500).json({ error: 'Failed' });
         res.json({ success: true });
      });
   });
});

// Agent Get History
app.get('/api/agent/sales/:id/history', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id;
   // Verify ownership
   db.get('SELECT id FROM sales WHERE id = ? AND agent_id = ?', [orderId, req.user.id], (err, row) => {
      if (err || !row) return res.status(404).json({ error: 'Not found' });
      
      db.all('SELECT * FROM sales_history WHERE sales_id = ? ORDER BY created_at ASC', [orderId], (err, rows) => {
         if (err) return res.status(500).json({ error: 'Failed' });
         res.json(rows);
      });
   });
});

// Update Customer Name (Agent)
app.put('/api/agent/sales/:id/customer', authenticate, (req, res) => {
   if (req.user.role !== 'agent') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id;
   const { customerName, companyName } = req.body;
   
   db.run('UPDATE sales SET customer_name = ?, company_name = ? WHERE id = ? AND agent_id = ?', [customerName, companyName || null, orderId, req.user.id], function(err) {
      if (err || this.changes === 0) return res.status(400).json({ error: 'Failed' });
      
      const historyStr = `エンドユーザー情報登録: ${companyName ? companyName + ' ' : ''}${customerName}`;
      db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'memo', ?, 'agent')`, [orderId, historyStr]);
      res.json({ success: true });
   });
});

// Update Customer Name (Admin)
app.put('/api/admin/sales/:id/customer', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id;
   const { customerName, companyName } = req.body;
   
   db.run('UPDATE sales SET customer_name = ?, company_name = ? WHERE id = ?', [customerName, companyName || null, orderId], function(err) {
      if (err || this.changes === 0) return res.status(400).json({ error: 'Failed' });
      
      const historyStr = `エンドユーザー情報変更: ${companyName ? companyName + ' ' : ''}${customerName}`;
      db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'memo', ?, 'admin')`, [orderId, historyStr]);
      res.json({ success: true });
   });
});

app.get('/api/admin/dashboard', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   db.all('SELECT * FROM users WHERE role="agent"', (err, agents) => {
     db.all('SELECT * FROM sales ORDER BY date DESC', (err, sales) => {
       const now = new Date();
       const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
       
       const monthlySales = sales.filter(s => s.date.startsWith(currentMonthPrefix));
       const newAgentsThisMonth = agents.filter(a => a.created_at && a.created_at.startsWith(currentMonthPrefix)).length;

       let monthlyRevenue = monthlySales.reduce((sum, s) => {
          if (s.note === '本部直販') {
             return sum + s.product_price;
          } else if (s.note && s.note.includes('卸売')) {
             return sum + (s.product_price * 0.75); // Wholesale revenue is wholesale price
          } else {
             return sum + s.product_price; // Referral revenue is full price
          }
       }, 0);
       let monthlyHqProfit = monthlySales.reduce((sum, s) => {
          if (s.note === '本部直販') {
             return sum + s.product_price;
          } else if (s.note && s.note.includes('卸売')) {
             return sum + (s.product_price * 0.75); // 75% is purchase price paid by agent to HQ
          } else {
             return sum + (s.product_price - s.agent_commission); // Regular sales
          }
       }, 0);

       let payouts = [];
       let totalPayouts = 0;
       
       // Payouts might need to show all pending, but for metrics we want "this month's scheduled payouts"
       const monthlyPayouts = monthlySales.reduce((sum, s) => sum + s.agent_commission, 0);

       // Still return all payouts for the table
       sales.forEach(s => {
          if (s.agent_commission > 0) {
            const ag = agents.find(a => a.id === s.agent_id);
            payouts.push({
               reqId: s.id, agentId: s.agent_id, agentName: ag?.name,
               bank: ag?.bank_info, amount: s.agent_commission, details: s.note, status: s.status, date: s.date
            });
            totalPayouts += s.agent_commission;
          }
       });

       res.json({
         totalAgents: agents.length, 
         newAgentsThisMonth,
         monthlySalesCount: monthlySales.length, 
         monthlyRevenue, 
         monthlyHqProfit,
         monthlyPayouts, 
         pendingApprovals: 0,
         agentList: agents.map(a => ({ ...a, totalSales: sales.filter(s => s.agent_id === a.id).length })),
         payouts
       });
     });
   });
});

app.get('/api/admin/reports', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   db.all('SELECT * FROM users WHERE role="agent"', (err, agents) => {
     db.all('SELECT * FROM sales ORDER BY date DESC', (err, sales) => {
       let allTimeRevenue = sales.reduce((sum, s) => {
          if (s.note === '本部直販') {
             return sum + s.product_price;
          } else if (s.note && s.note.includes('卸売')) {
             return sum + (s.product_price * 0.75);
          } else {
             return sum + s.product_price; 
          }
       }, 0);
       let allTimeHqProfit = sales.reduce((sum, s) => {
          if (s.note === '本部直販') {
             return sum + s.product_price;
          } else if (s.note && s.note.includes('卸売')) {
             return sum + (s.product_price * 0.75);
          } else {
             return sum + (s.product_price - s.agent_commission); 
          }
       }, 0);
       let allTimePayouts = sales.reduce((sum, s) => sum + s.agent_commission, 0);

       let agentRanking = agents.map(a => {
          const agentSales = sales.filter(s => s.agent_id === a.id);
          const totalSalesValue = agentSales.reduce((sum, s) => sum + s.product_price, 0);
          return {
             id: a.id,
             name: a.name,
             type: a.type,
             tier: a.tier,
             salesCount: agentSales.length,
             totalSalesValue
          };
       }).sort((a, b) => b.totalSalesValue - a.totalSalesValue);

       res.json({
         allTimeRevenue,
         allTimeHqProfit,
         allTimePayouts,
         allTimeSalesCount: sales.length,
         agentRanking
       });
     });
   });
});

// Admin Update Agent Type and Tier
app.put('/api/admin/agents/:id', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const { type, tier } = req.body;
   const parsedTier = type === '卸型' ? null : parseInt(tier, 10);
   
   db.run('UPDATE users SET type = ?, tier = ? WHERE id = ?', [type, parsedTier, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ success: true });
   });
});

// Admin Status Update (Sales)
app.put('/api/admin/sales/:id/status', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id.replace('-REF', ''); // strip suffix if updating from referral line item
   const { status } = req.body;
   db.run('UPDATE sales SET status = ?, last_status_updater = ? WHERE id = ?', [status, 'admin', orderId], function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      
      db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, 'admin')`, [orderId, status]);
      
      res.json({ success: true });
   });
});

// Admin Add Memo
app.post('/api/admin/sales/:id/memo', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id.replace('-REF', '');
   const { memo } = req.body;
   
   db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'memo', ?, 'admin')`, [orderId, memo], function(err) {
      if (err) return res.status(500).json({ error: 'Failed' });
      res.json({ success: true });
   });
});

// Admin Get History
app.get('/api/admin/sales/:id/history', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const orderId = req.params.id.replace('-REF', '');
   db.all('SELECT * FROM sales_history WHERE sales_id = ? ORDER BY created_at ASC', [orderId], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed' });
      res.json(rows);
   });
});

// Admin Get Pamphlet Requests
app.get('/api/admin/pamphlets', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   db.all(`
     SELECT p.*, u.name as requestor_name 
     FROM pamphlet_requests p 
     JOIN users u ON p.agent_id = u.id 
     ORDER BY p.created_at DESC
   `, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed' });
      res.json(rows);
   });
});

// Admin Status Update (Pamphlets)
app.put('/api/admin/pamphlets/:id/status', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const { status } = req.body;
   db.run('UPDATE pamphlet_requests SET status = ? WHERE id = ?', [status, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: 'Update failed' });
      res.json({ success: true });
   });
});

// Admin All Sales (Real-time Ledger)
app.get('/api/admin/sales-all', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   db.all(`
     SELECT s.*, u.name as agent_name
     FROM sales s
     LEFT JOIN users u ON s.agent_id = u.id
     ORDER BY s.date DESC, s.created_at DESC
   `, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed' });
      res.json(rows);
   });
});

// Admin Direct Sale
app.post('/api/admin/sales', authenticate, (req, res) => {
   if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
   const { customerName, companyName, date, productName = 'チャージ', productPrice = 396000, isDemo } = req.body;
   if (!customerName || !date) return res.status(400).json({ error: 'Bad Request' });

   const orderId = 'ORD-' + Math.floor(Math.random()*100000).toString().padStart(5, '0');
   const initialStatus = isDemo ? 'デモ・商談中' : 'すべての処理完了';

   db.run(`INSERT INTO sales (id, agent_id, date, customer_name, company_name, product_name, product_price, status, note, agent_commission, referrer_id, referrer_commission, last_status_updater) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
     [orderId, req.user.id, date, customerName, companyName || null, productName, productPrice, initialStatus, '本部直販', 0, null, 0, 'admin'], function(err) {
       if (err) return res.status(500).json({error: 'Failed to record sale'});
       
       db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, 'admin')`, [orderId, initialStatus]);
       db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'memo', ?, 'admin')`, [orderId, '本部直販']);
       
       res.json({ success: true, message: '本部直販売上が登録されました。' });
   });
});

// Public Purchase API (from /buy form)
app.post('/api/public/purchase', (req, res) => {
   const { agentId, customerName, companyName, phone, productName = 'チャージ', productPrice = 396000, isDemo } = req.body;
   if (!agentId || !customerName) return res.status(400).json({ error: 'Bad Request' });

   const date = new Date().toISOString().split('T')[0];
   const orderId = 'ORD-' + Math.floor(Math.random()*100000).toString().padStart(5, '0');
   const initialStatus = isDemo ? 'デモ・商談中' : '発注手配中';

   db.get('SELECT * FROM users WHERE id = ?', [agentId], (err, user) => {
      if (err || !user) return res.status(404).json({ error: 'Agent not found' });
      
      let { commission, note } = calculateCommission(productName, productPrice, user.type, user.tier);

      db.run(`INSERT INTO sales (id, agent_id, date, customer_name, company_name, product_name, product_price, status, note, agent_commission, referrer_id, referrer_commission, last_status_updater) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, agentId, date, customerName, companyName || null, productName, productPrice, initialStatus, note, commission, null, 0, 'agent'], function(err) {
          if (err) return res.status(500).json({error: 'Failed to record sale'});
          
          db.run(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, 'agent')`, [orderId, initialStatus]);
          
          res.json({ success: true, message: 'お申し込みを承りました。' });
      });
   });
});

const PORT = process.env.PORT || 3001;
initDb().then(() => {
  app.listen(PORT, () => console.log(`Backend API running on http://localhost:${PORT}`));
});
