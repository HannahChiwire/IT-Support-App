// database.js
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

let db;

// simple helper to run SQL
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

// initialize DB in a writable location (userData by default)
async function init(dataDir) {
  const dir = dataDir || path.join(__dirname, 'data');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const dbFile = path.join(dir, 'tickets.db');

  db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) throw err;
  });

  // create required tables if they don't exist
  await run(`CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    department TEXT,
    issue TEXT,
    priority TEXT,
    status TEXT,
    created_at TEXT
  )`);

  return dbFile;
}

// export functions
module.exports = {
  init,
  run,
};
