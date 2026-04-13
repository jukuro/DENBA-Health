const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'denba.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration...');
db.serialize(() => {
  // Try to add columns. This will throw an error if they already exist, which we can ignore.
  db.run(`ALTER TABLE sales ADD COLUMN product_name TEXT DEFAULT 'チャージ'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error(err);
    } else {
      console.log('Added product_name column');
    }
  });
  
  db.run(`ALTER TABLE sales ADD COLUMN product_price INTEGER DEFAULT 396000`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error(err);
    } else {
      console.log('Added product_price column');
    }
  });
});

db.close(() => {
  console.log('Migration finished.');
});
