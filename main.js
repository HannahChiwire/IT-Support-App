// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db'); // make sure the file name matches your actual file, e.g., database.js

let mainWindow;

app.whenReady().then(async () => {
  // Initialize the database
  await db.init();

  // Create the main application window
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Load the login page from renderer folder
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
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
    const ticketId = await db.createTicket(ticketData);
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

