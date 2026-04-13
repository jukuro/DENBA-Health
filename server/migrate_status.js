const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'denba.db');
const db = new sqlite3.Database(dbPath);

const statusMap = {
  'デモ申込/手配中': 'デモ・商談中',
  'デモ貸出中': 'デモ・商談中',
  '購入申込/発注待': '発注手配中',
  'メーカー発注済': '発注手配中',
  '処理中': '発注手配中',
  
  '納品済/請求・入金待': '納品済・入金待ち',
  '納品完了': '納品済・入金待ち',
  '仕入代金入金待': '納品済・入金待ち',
  
  '入金完了（報酬確定）': '入金完了（利益確定）',
  
  '完了': 'すべての処理完了',
  '代理店へ報酬支払済': 'すべての処理完了'
};

db.serialize(() => {
  db.all('SELECT id, status FROM sales', [], (err, rows) => {
    if (err) throw err;
    let count = 0;
    
    // Begin transaction
    db.run("BEGIN TRANSACTION");
    const stmt = db.prepare("UPDATE sales SET status = ? WHERE id = ?");
    
    for (const row of rows) {
      let newStatus = statusMap[row.status] || row.status;
      // If none matches exactly, map specific words
      if (['完了', '代理店へ報酬支払済', 'すべての処理完了'].includes(newStatus)) {
          newStatus = 'すべての処理完了';
      }
      
      if (row.status !== newStatus) {
        stmt.run(newStatus, row.id);
        count++;
        console.log(`Updated sale ${row.id}: ${row.status} -> ${newStatus}`);
      }
    }
    
    stmt.finalize();
    db.run("COMMIT", () => {
       console.log(`Successfully migrated ${count} sales records.`);
    });
  });
});
