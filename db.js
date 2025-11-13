// database.js
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'tickets.db');
let db;

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'));
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'));
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'));
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function init() {
  const exists = fs.existsSync(DB_PATH);
  db = new sqlite3.Database(DB_PATH);

  if (!exists) {
    // Create users table
    await run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        department TEXT,
        role TEXT
      );
    `);

    // Create tickets table
    await run(`
      CREATE TABLE tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        name TEXT,
        department TEXT,
        issue TEXT,
        priority TEXT,
        status TEXT,
        created_at TEXT
      );
    `);

    // Pre-create default admin user
    await run(`
      INSERT INTO users (name, email, password, department, role)
      VALUES (?, ?, ?, ?, ?)`,
      ['Admin', 'admin@support.com', 'admin123', 'IT', 'admin']
    );

    console.log("✅ Database initialized — Admin account created (admin@support.com / admin123)");
  } else {
    console.log("ℹ️ Database already exists — Ready to use.");
  }
}

// --- User Registration ---
async function registerUser({ name, email, password, department }) {
  const role = email === 'admin@support.com' ? 'admin' : 'user';
  await run(
    `INSERT INTO users (name, email, password, department, role)
     VALUES (?, ?, ?, ?, ?)`,
    [name, email, password, department, role]
  );
  return true;
}

// --- Login ---
async function loginUser(email, password) {
  const user = await get(
    `SELECT * FROM users WHERE email = ? AND password = ?`,
    [email, password]
  );
  return user;
}

// --- Create Ticket ---
async function createTicket({ user_id, name, department, issue, priority }) {
  const created_at = new Date().toISOString();
  const res = await run(
    `INSERT INTO tickets (user_id, name, department, issue, priority, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'Pending', ?)`,
    [user_id, name, department, issue, priority, created_at]
  );
  return res.lastID;
}

// --- Fetch Tickets ---
// Admin: all tickets
// User: only their own tickets
async function fetchTickets(user_id = null) {
  if (user_id) {
    return await all(
      `SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC`,
      [user_id]
    );
  } else {
    return await all(`SELECT * FROM tickets ORDER BY created_at DESC`);
  }
}

async function updateStatus(id, status) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('Database not initialized'));
    const query = `UPDATE tickets SET status = ? WHERE id = ?`;
    db.run(query, [status, id], function (err) {
      if (err) reject(err);
      else resolve(true);
    });
  });
}


module.exports = {
  init,
  registerUser,
  loginUser,
  createTicket,
  fetchTickets,
  updateStatus
};
