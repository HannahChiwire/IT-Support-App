const { ipcRenderer } = require('electron');

// =========================
// Registration
// =========================
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      password: document.getElementById('password').value,
      department: document.getElementById('department').value
    };
    const result = await ipcRenderer.invoke('register-user', user);
    if (result.success) {
      alert('Registration successful! You can now log in.');
      window.location.href = 'index.html';
    } else {
      alert('Error: ' + result.message);
    }
  });
}

// =========================
// Login
// =========================
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const user = await ipcRenderer.invoke('login-user', { email, password });
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      if (user.role === 'admin') window.location.href = 'admin.html';
      else window.location.href = 'user.html';
    } else {
      alert('Invalid email or password.');
    }
  });
}

// =========================
// Logout
// =========================
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
  });
}

// =========================
// Submit Report (User Page)
// =========================
const reportForm = document.getElementById('reportForm');
if (reportForm) {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch (err) {
    user = null;
  }

  if (!user) {
    // If not logged in, redirect to login
    window.location.href = 'index.html';
  }

  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to submit a report.');
      window.location.href = 'index.html';
      return;
    }

    const report = {
      user_id: user.id,
      name: user.name,
      department: user.department,
      issue: document.getElementById('issue').value,
      priority: document.getElementById('priority').value
    };

    const result = await ipcRenderer.invoke('create-ticket', report);

    if (result && result.success) {
      alert('Report submitted successfully!');
      document.getElementById('reportForm').reset();
      if (typeof loadUserReports === 'function') loadUserReports(); // refresh reports after submission
    } else {
      alert('Error submitting report: ' + (result && result.message ? result.message : 'Unknown error'));
    }
  });

  // Load user's own reports
  async function loadUserReports() {
    let tickets = await ipcRenderer.invoke('fetch-tickets', user.id);
    // Normalize possible shapes: array or { success, data }
    if (!Array.isArray(tickets)) {
      if (tickets && Array.isArray(tickets.data)) tickets = tickets.data;
      else tickets = tickets || [];
    }

    const container = document.getElementById('reportsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (!tickets || tickets.length === 0) {
      container.innerHTML = '<p>No reports submitted yet.</p>';
      return;
    }

    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'ticket';
      const createdAt = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown';
      div.innerHTML = `
        <h3>${ticket.issue}</h3>
        <p><b>Priority:</b> ${ticket.priority || 'N/A'}</p>
        <p><b>Status:</b> ${ticket.status || 'N/A'}</p>
        <small>Submitted on: ${createdAt}</small>
        <hr>
      `;
      container.appendChild(div);
    });
  }

  // Load when user page opens
  loadUserReports();
}

// =========================
// Admin Dashboard: View All Reports
// =========================
const adminContainer = document.getElementById('adminReportsContainer');
if (adminContainer) {
  async function loadAllReports() {
    let tickets = await ipcRenderer.invoke('fetch-tickets');
    // Normalize possible shapes: array or { success, data }
    if (!Array.isArray(tickets)) {
      if (tickets && Array.isArray(tickets.data)) tickets = tickets.data;
      else tickets = tickets || [];
    }

    adminContainer.innerHTML = '';

    if (!tickets || tickets.length === 0) {
      adminContainer.innerHTML = '<p>No reports available.</p>';
      return;
    }

    tickets.forEach(ticket => {
      const div = document.createElement('div');
      div.className = 'ticket';
      const createdAt = ticket.created_at ? new Date(ticket.created_at).toLocaleString() : 'Unknown';
      div.innerHTML = `
        <h3>${ticket.issue}</h3>
        <p><b>Reporter:</b> ${ticket.name || 'Unknown'} (${ticket.department || 'N/A'})</p>
        <p><b>Priority:</b> ${ticket.priority || 'N/A'}</p>
        <p><b>Status:</b> ${ticket.status || 'N/A'}</p>
        <small>Created: ${createdAt}</small>
        <hr>
      `;
      adminContainer.appendChild(div);
    });
  }

  // Load reports automatically when admin page opens
  loadAllReports();
}
