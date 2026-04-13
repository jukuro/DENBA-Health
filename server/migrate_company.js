const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'denba.db');
const db = new sqlite3.Database(dbPath);

console.log('Running migration...');
db.serialize(() => {
  db.run(`ALTER TABLE sales ADD COLUMN company_name TEXT`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added company_name column');
  });
  
  db.run(`ALTER TABLE sales ADD COLUMN last_status_updater TEXT DEFAULT 'agent'`, (err) => {
    if (err && !err.message.includes('duplicate column name')) console.error(err);
    else console.log('Added last_status_updater column');
  });
});

db.close(() => {
  console.log('Migration finished.');
});
