const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'denba.db');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // ユーザー（代理店・本部）テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          phone TEXT,
          address TEXT,
          role TEXT NOT NULL DEFAULT 'agent', -- 'admin' or 'agent'
          type TEXT, -- '紹介型' or '卸型'
          tier INTEGER, -- 10, 20, 25 (紹介型のみ)
          referral_code TEXT UNIQUE,
          referred_by TEXT, -- 紹介元のユーザーID
          bank_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 注文・売上テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id TEXT PRIMARY KEY,
          agent_id TEXT NOT NULL,
          date TEXT NOT NULL,
          customer_name TEXT NOT NULL,
          company_name TEXT,
          product_name TEXT DEFAULT 'チャージ',
          product_price INTEGER DEFAULT 396000,
          status TEXT NOT NULL DEFAULT '完了',
          last_status_updater TEXT DEFAULT 'agent',
          note TEXT,
          agent_commission INTEGER NOT NULL,
          referrer_id TEXT,
          referrer_commission INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id) REFERENCES users(id),
          FOREIGN KEY (referrer_id) REFERENCES users(id)
        )
      `);

      // ステータス履歴・メモテーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS sales_history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sales_id TEXT NOT NULL,
          event_type TEXT NOT NULL, -- 'status' or 'memo'
          event_content TEXT NOT NULL,
          updated_by TEXT NOT NULL, -- 'admin', 'agent'
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sales_id) REFERENCES sales(id)
        )
      `);

      // パンフレット請求テーブル
      db.run(`
        CREATE TABLE IF NOT EXISTS pamphlet_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          agent_id TEXT NOT NULL,
          target_name TEXT NOT NULL,
          target_phone TEXT NOT NULL,
          target_address TEXT NOT NULL,
          copies INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT '未発送',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (agent_id) REFERENCES users(id)
        )
      `, err => {
        if (err) return reject(err);
        seedData();
        resolve();
      });
    });
  });
};

const seedData = async () => {
  // 本部とテスト用代理店がなければ作成する
  db.get("SELECT COUNT(*) as count FROM users", async (err, row) => {
    if (row.count === 0) {
      console.log('Seeding initial data...');
      const adminHash = await bcrypt.hash('admin123', 10);
      const agentHash = await bcrypt.hash('agent123', 10);
      const agent2Hash = await bcrypt.hash('agent2123', 10);

      const stmt = db.prepare("INSERT INTO users (id, email, password, name, phone, address, role, type, tier, referral_code, referred_by, bank_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      
      // Admin
      stmt.run('USR-ADMIN', 'admin@denba-hq.com', adminHash, '本部管理者', null, null, 'admin', null, null, null, null, null);
      
      // Agent 1 (紹介者)
      stmt.run('AGT-10024', 'tanaka@example.com', agentHash, '田中 健一郎', '090-1234-5678', '〒160-0022 東京都新宿区新宿1-1-1', 'agent', '紹介型', 25, 'REF-TANAKA', null, '三井住友銀行 新宿支店 普通1234567');
      
      // Agent 2 (Agent 1の紹介で入った人)
      stmt.run('AGT-10025', 'satou@example.com', agent2Hash, '佐藤 一郎', '080-9876-5432', '〒150-0002 東京都渋谷区渋谷2-2-2', 'agent', '紹介型', 10, 'REF-SATOU', 'AGT-10024', 'PayPay銀行 すずめ支店 普通5555555');

      // Wholesale Agent
      stmt.run('AGT-10026', 'suzuki@example.com', agentHash, '鈴木 美咲', '070-1111-2222', '〒100-0001 東京都千代田区千代田1-1-1', 'agent', '卸型', null, 'REF-SUZUKI', null, '三菱UFJ銀行 本店 普通9876543');
      
      stmt.finalize();

      const salesStmt = db.prepare("INSERT INTO sales (id, agent_id, date, customer_name, company_name, product_name, product_price, status, note, agent_commission, referrer_id, referrer_commission, last_status_updater) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
      salesStmt.run('ORD-00100', 'AGT-10024', '2026-04-12', '山本 様', null, 'チャージ', 396000, '納品完了', '通常販売 (3台目・25%)', 99000, null, 0, 'admin');
      salesStmt.run('ORD-00042', 'AGT-10024', '2026-02-18', '木村 様', '株式会社 木村商事', 'チャージ', 396000, '完了', '通常販売 (2台目・20%)', 79200, null, 0, 'agent');
      salesStmt.run('ORD-00015', 'AGT-10024', '2026-01-20', '小林 様', null, 'チャージ', 396000, '完了', '初回販売 (10%)', 39600, null, 0, 'agent');
      salesStmt.run('ORD-00102', 'AGT-10025', '2026-04-15', '高橋 様', '高橋クリニック', 'チャージ', 396000, '納品完了', '初回販売 (10%)', 39600, 'AGT-10024', 19800, 'admin');
      salesStmt.finalize();
      
      const pamStmt = db.prepare("INSERT INTO pamphlet_requests (agent_id, target_name, target_phone, target_address, copies, status) VALUES (?, ?, ?, ?, ?, ?)");
      pamStmt.run('AGT-10024', '田中 健一郎', '090-1234-5678', '〒160-0022 東京都新宿区新宿1-1-1', 5, '未発送');
      pamStmt.run('AGT-10025', '新規見込み客 山田様', '03-1111-2222', '〒104-0061 東京都中央区銀座...', 1, '発送完了');
      pamStmt.finalize();

      console.log('Seed data created.');
    }
  });
};

module.exports = { db, initDb };
