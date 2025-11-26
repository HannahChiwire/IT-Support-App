// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');
const nodemailer = require('nodemailer');
const { autoUpdater } = require('electron-updater');

// load .env
require('dotenv').config();

// Create a Gmail transporter
let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS
    }
  });
  console.log('Gmail transporter created successfully.');
} catch (err) {
  console.error('Failed to create Gmail transporter:', err);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ICT@sigelege.com';
const SEND_FROM = process.env.SEND_FROM || process.env.GMAIL_USER || 'no-reply@example.com';

let mainWindow;

app.whenReady().then(async () => {
  // use a writable location for the DB
  const userDataPath = app.getPath('userData'); // e.g. C:\Users\<user>\AppData\Roaming\<appId>
  await db.init(userDataPath);

  // create window after DB initialized
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // auto-update: check once on startup
  try {
    autoUpdater.autoDownload = true; // auto-download when update found
    autoUpdater.checkForUpdatesAndNotify(); // shows notifications for update events
  } catch (e) {
    console.warn('Auto-updater init failed:', e);
  }
});

// ---------- IPC HANDLERS ----------

// Register a new user
ipcMain.handle('register-user', async (event, userData) => {
  try {
    await db.registerUser(userData);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Login a user
ipcMain.handle('login-user', async (event, { email, password }) => {
  const user = await db.loginUser(email, password);
  return user; // null if login fails
});

// Create a new report/ticket
ipcMain.handle('create-ticket', async (event, ticketData) => {
  try {
    // db.createTicket should return { id, created_at }
    const res = await db.createTicket(ticketData);
    const ticketId = res && res.id ? res.id : res; // fallback if createTicket returns id directly
    const createdAt = res && res.created_at ? res.created_at : new Date().toISOString();

    // send email in background (non-blocking)
    (async () => {
      try {
        if (!transporter) {
          console.warn('Gmail transporter not configured — skipping email.');
          return;
        }

        const mailOptions = {
          to: ADMIN_EMAIL,
          from: SEND_FROM,
          subject: `New Support Ticket #${ticketId} — ${ticketData.priority || 'N/A'}`,
          html: `
            <p>A new support request has been logged and requires your attention.</p>
            <ul>
              <li><strong>Reporter:</strong> ${ticketData.name || 'Unknown'}</li>
              <li><strong>Department:</strong> ${ticketData.department || 'N/A'}</li>
              <li><strong>Priority:</strong> ${ticketData.priority || 'N/A'}</li>
              <li><strong>Issue:</strong> ${ticketData.issue || ''}</li>
            </ul>
          `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Gmail: notification sent for ticket', ticketId, 'response:', info && info.response);
      } catch (emailErr) {
        console.error('Gmail send error:', emailErr);
      }
    })();

    return { success: true, id: ticketId };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Fetch tickets — for admin (all) or for a specific user
ipcMain.handle('fetch-tickets', async (event, user_id = null) => {
  try {
    const tickets = await db.fetchTickets(user_id);
    // Return the tickets array directly so renderers that expect an array work correctly
    return tickets;
  } catch (err) {
    console.error('fetch-tickets error:', err);
    // Return an empty array on error so the renderer can handle it uniformly
    return [];
  }
});

// Update ticket status
ipcMain.handle('update-status', async (event, { id, status }) => {
  try {
    await db.updateStatus(id, status);
    return { success: true };
  } catch (err) {
    return { success: false, message: err.message };
  }
});

// Optional: Open a new window for admin or user dashboard
ipcMain.on('open-dashboard', (event, role) => {
  const dashboardFile =
    role === 'admin' ? 'admin.html' : 'user.html';

  const dashboardWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  dashboardWindow.loadFile(path.join(__dirname, 'renderer', dashboardFile));
});

