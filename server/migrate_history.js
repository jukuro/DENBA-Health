const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'denba.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration...');
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS sales_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sales_id TEXT NOT NULL,
      event_type TEXT NOT NULL, -- 'status' or 'memo'
      event_content TEXT NOT NULL,
      updated_by TEXT NOT NULL, -- 'admin', 'agent', or 'system'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sales_id) REFERENCES sales(id)
    )
  `, (err) => {
    if (err) console.error(err);
    else console.log('Created sales_history table');
  });

  // Optional: Backfill existing sales with an initial status event
  db.all(`SELECT id, status, last_status_updater FROM sales`, (err, rows) => {
    if (err) return console.error(err);
    if (!rows || rows.length === 0) return;
    
    db.get(`SELECT COUNT(*) as count FROM sales_history`, (err, res) => {
      if (res && res.count === 0) {
        console.log('Backfilling existing sales history...');
        const stmt = db.prepare(`INSERT INTO sales_history (sales_id, event_type, event_content, updated_by) VALUES (?, 'status', ?, ?)`);
        rows.forEach(row => {
          stmt.run(row.id, row.status, row.last_status_updater || 'admin');
        });
        stmt.finalize(() => console.log('Backfill complete'));
      }
    });
  });
});

setTimeout(() => {
  db.close(() => console.log('Migration finished.'));
}, 2000);
